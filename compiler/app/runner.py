from __future__ import annotations

import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path

from app.models import Language, RunResponse


MAX_OUTPUT_CHARS = 40_000
JAVA_PUBLIC_CLASS_RE = re.compile(r"\bpublic\s+class\s+([A-Za-z_$][\w$]*)")


@dataclass(frozen=True)
class CommandResult:
    stdout: str
    stderr: str
    exit_code: int | None
    timed_out: bool


class RunnerError(RuntimeError):
    pass


def language_tools() -> dict[Language, dict[str, str | None]]:
    return {
        Language.python: {"python": shutil.which("python") or sys.executable},
        Language.c: {"gcc": shutil.which("gcc")},
        Language.cpp: {"g++": shutil.which("g++")},
        Language.java: {
            "javac": shutil.which("javac"),
            "java": shutil.which("java"),
        },
    }


def is_language_available(language: Language) -> bool:
    tools = language_tools()[language]
    return all(path is not None for path in tools.values())


def run_code(
    *,
    language: Language,
    code: str,
    stdin: str,
    timeout_seconds: float,
) -> RunResponse:
    started = time.perf_counter()

    if not is_language_available(language):
        tools = ", ".join(
            name for name, path in language_tools()[language].items() if path is None
        )
        return _response(
            language=language,
            status="toolchain_missing",
            stderr=f"Required toolchain not found on PATH: {tools}",
            started=started,
        )

    with tempfile.TemporaryDirectory(prefix="code-runner-") as temp_dir:
        workdir = Path(temp_dir)

        try:
            if language == Language.python:
                return _run_python(code, stdin, timeout_seconds, workdir, started)
            if language == Language.c:
                return _run_c(code, stdin, timeout_seconds, workdir, started)
            if language == Language.cpp:
                return _run_cpp(code, stdin, timeout_seconds, workdir, started)
            if language == Language.java:
                return _run_java(code, stdin, timeout_seconds, workdir, started)
        except OSError as exc:
            return _response(
                language=language,
                status="runner_error",
                stderr=str(exc),
                started=started,
            )

    raise RunnerError(f"Unsupported language: {language}")


def _run_python(
    code: str,
    stdin: str,
    timeout_seconds: float,
    workdir: Path,
    started: float,
) -> RunResponse:
    source = workdir / "main.py"
    source.write_text(code, encoding="utf-8")

    result = _run_command(
        [sys.executable, "-I", str(source)],
        stdin=stdin,
        timeout_seconds=timeout_seconds,
        cwd=workdir,
    )
    return _execution_response(Language.python, result, started)


def _run_c(
    code: str,
    stdin: str,
    timeout_seconds: float,
    workdir: Path,
    started: float,
) -> RunResponse:
    source = workdir / "main.c"
    binary = workdir / _binary_name("main")
    source.write_text(code, encoding="utf-8")

    compile_result = _run_command(
        ["gcc", str(source), "-O2", "-std=c11", "-o", str(binary)],
        stdin="",
        timeout_seconds=timeout_seconds,
        cwd=workdir,
    )
    if compile_result.exit_code != 0 or compile_result.timed_out:
        return _compile_response(Language.c, compile_result, started)

    run_result = _run_command(
        [str(binary)],
        stdin=stdin,
        timeout_seconds=timeout_seconds,
        cwd=workdir,
    )
    return _execution_response(Language.c, run_result, started, compile_result)


def _run_cpp(
    code: str,
    stdin: str,
    timeout_seconds: float,
    workdir: Path,
    started: float,
) -> RunResponse:
    source = workdir / "main.cpp"
    binary = workdir / _binary_name("main")
    source.write_text(code, encoding="utf-8")

    compile_result = _run_command(
        ["g++", str(source), "-O2", "-std=c++17", "-o", str(binary)],
        stdin="",
        timeout_seconds=timeout_seconds,
        cwd=workdir,
    )
    if compile_result.exit_code != 0 or compile_result.timed_out:
        return _compile_response(Language.cpp, compile_result, started)

    run_result = _run_command(
        [str(binary)],
        stdin=stdin,
        timeout_seconds=timeout_seconds,
        cwd=workdir,
    )
    return _execution_response(Language.cpp, run_result, started, compile_result)


def _run_java(
    code: str,
    stdin: str,
    timeout_seconds: float,
    workdir: Path,
    started: float,
) -> RunResponse:
    class_name = _java_class_name(code)
    source = workdir / f"{class_name}.java"
    source.write_text(code, encoding="utf-8")

    compile_result = _run_command(
        ["javac", str(source)],
        stdin="",
        timeout_seconds=timeout_seconds,
        cwd=workdir,
    )
    if compile_result.exit_code != 0 or compile_result.timed_out:
        return _compile_response(Language.java, compile_result, started)

    run_result = _run_command(
        ["java", "-cp", str(workdir), class_name],
        stdin=stdin,
        timeout_seconds=timeout_seconds,
        cwd=workdir,
    )
    return _execution_response(Language.java, run_result, started, compile_result)


def _run_command(
    command: list[str],
    *,
    stdin: str,
    timeout_seconds: float,
    cwd: Path,
) -> CommandResult:
    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"

    try:
        completed = subprocess.run(
            command,
            input=stdin,
            text=True,
            capture_output=True,
            timeout=timeout_seconds,
            cwd=cwd,
            env=env,
            encoding="utf-8",
            errors="replace",
        )
        return CommandResult(
            stdout=_trim(completed.stdout),
            stderr=_trim(completed.stderr),
            exit_code=completed.returncode,
            timed_out=False,
        )
    except OSError as exc:
        return CommandResult(
            stdout="",
            stderr=str(exc),
            exit_code=1,
            timed_out=False,
        )
    except subprocess.TimeoutExpired as exc:
        stdout = exc.stdout or ""
        stderr = exc.stderr or ""
        if isinstance(stdout, bytes):
            stdout = stdout.decode("utf-8", errors="replace")
        if isinstance(stderr, bytes):
            stderr = stderr.decode("utf-8", errors="replace")
        return CommandResult(
            stdout=_trim(stdout),
            stderr=_trim(stderr + "\nExecution timed out."),
            exit_code=None,
            timed_out=True,
        )


def _java_class_name(code: str) -> str:
    match = JAVA_PUBLIC_CLASS_RE.search(code)
    return match.group(1) if match else "Main"


def _binary_name(name: str) -> str:
    return f"{name}.exe" if os.name == "nt" else name


def _execution_response(
    language: Language,
    run_result: CommandResult,
    started: float,
    compile_result: CommandResult | None = None,
) -> RunResponse:
    if run_result.timed_out:
        status = "timeout"
    elif run_result.exit_code == 0:
        status = "success"
    else:
        status = "runtime_error"

    return _response(
        language=language,
        status=status,
        stdout=run_result.stdout,
        stderr=run_result.stderr,
        compile_stdout=compile_result.stdout if compile_result else "",
        compile_stderr=compile_result.stderr if compile_result else "",
        exit_code=run_result.exit_code,
        timed_out=run_result.timed_out,
        started=started,
    )


def _compile_response(
    language: Language,
    compile_result: CommandResult,
    started: float,
) -> RunResponse:
    return _response(
        language=language,
        status="timeout" if compile_result.timed_out else "compile_error",
        compile_stdout=compile_result.stdout,
        compile_stderr=compile_result.stderr,
        exit_code=compile_result.exit_code,
        timed_out=compile_result.timed_out,
        started=started,
    )


def _response(
    *,
    language: Language,
    status: str,
    started: float,
    stdout: str = "",
    stderr: str = "",
    compile_stdout: str = "",
    compile_stderr: str = "",
    exit_code: int | None = None,
    timed_out: bool = False,
) -> RunResponse:
    return RunResponse(
        language=language,
        status=status,
        stdout=stdout,
        stderr=stderr,
        compile_stdout=compile_stdout,
        compile_stderr=compile_stderr,
        exit_code=exit_code,
        timed_out=timed_out,
        duration_ms=round((time.perf_counter() - started) * 1000),
    )


def _trim(output: str) -> str:
    if len(output) <= MAX_OUTPUT_CHARS:
        return output
    return output[:MAX_OUTPUT_CHARS] + "\n... output truncated ..."
