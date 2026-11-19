from __future__ import annotations

import glob
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
JAVA_MAIN_CLASS_RE = re.compile(
    r"\bclass\s+([A-Za-z_$][\w$]*)[^{]*\{[^{}]*?\bpublic\s+static\s+void\s+main\b",
    re.DOTALL,
)
JAVA_ANY_CLASS_RE = re.compile(r"\bclass\s+([A-Za-z_$][\w$]*)")


@dataclass(frozen=True)
class CommandResult:
    stdout: str
    stderr: str
    exit_code: int | None
    timed_out: bool


class RunnerError(RuntimeError):
    pass


def _binary_name(name: str) -> str:
    return f"{name}.exe" if os.name == "nt" else name


def _find_executable(name: str) -> str | None:
    """Finds real executables on the system, avoiding hanging wrappers."""
    # Java & Javac resolution
    if name in ("java", "javac"):
        java_home = os.environ.get("JAVA_HOME")
        if java_home:
            candidate = Path(java_home) / "bin" / _binary_name(name)
            if candidate.is_file():
                return str(candidate)

        if os.name == "nt":
            for pattern in [
                r"C:\Program Files\Java\jdk*\bin",
                r"C:\Program Files\Eclipse Adoptium\jdk*\bin",
                r"C:\Program Files\Microsoft\jdk*\bin",
                r"C:\Program Files\Amazon Corretto\jdk*\bin",
                r"C:\Program Files (x86)\Java\jdk*\bin",
            ]:
                matches = sorted(
                    glob.glob(os.path.join(pattern, _binary_name(name))), reverse=True
                )
                if matches:
                    return matches[0]

    if name in ("python", "python3"):
        if sys.executable:
            return sys.executable

    # General PATH search, skipping known non-functional wrappers
    found = shutil.which(name)
    if found and "Common Files\\Oracle\\Java\\javapath" in found:
        path_dirs = os.environ.get("PATH", "").split(os.pathsep)
        for d in path_dirs:
            if "Common Files\\Oracle\\Java\\javapath" not in d:
                candidate = Path(d) / _binary_name(name)
                if candidate.is_file():
                    return str(candidate)

    return found


_TOOL_RUNNABLE_CACHE: dict[str, bool] = {}


def _can_run_tool(tool_path: str | None) -> bool:
    """Verifies that the tool can actually execute on the current operating system."""
    if not tool_path:
        return False
    if tool_path in _TOOL_RUNNABLE_CACHE:
        return _TOOL_RUNNABLE_CACHE[tool_path]

    try:
        # Quick invocation to verify binary can execute without OS relocation or link error
        res = subprocess.run(
            [tool_path, "--version"],
            capture_output=True,
            timeout=2.0,
            text=True,
        )
        is_runnable = (res.returncode == 0)
    except Exception:
        is_runnable = False

    _TOOL_RUNNABLE_CACHE[tool_path] = is_runnable
    return is_runnable


def language_tools() -> dict[Language, dict[str, str | None]]:
    return {
        Language.python: {"python": _find_executable("python") or sys.executable},
        Language.javascript: {"node": _find_executable("node")},
        Language.c: {"gcc": _find_executable("gcc")},
        Language.cpp: {"g++": _find_executable("g++")},
        Language.java: {
            "javac": _find_executable("javac"),
            "java": _find_executable("java"),
        },
    }


def is_language_available(language: Language) -> bool:
    tools = language_tools()[language]
    return all(path is not None and _can_run_tool(path) for path in tools.values())


def run_code(
    *,
    language: Language,
    code: str,
    stdin: str,
    timeout_seconds: float,
) -> RunResponse:
    started = time.perf_counter()

    if not is_language_available(language):
        tools_dict = language_tools()[language]
        unavail = [
            name
            for name, path in tools_dict.items()
            if path is None or not _can_run_tool(path)
        ]
        tools_msg = ", ".join(unavail)
        return _response(
            language=language,
            status="toolchain_missing",
            stderr=f"Required toolchain not found or cannot execute on this system: {tools_msg}",
            started=started,
        )

    with tempfile.TemporaryDirectory(prefix="code-runner-") as temp_dir:
        workdir = Path(temp_dir)

        try:
            if language == Language.python:
                return _run_python(code, stdin, timeout_seconds, workdir, started)
            if language == Language.javascript:
                return _run_javascript(code, stdin, timeout_seconds, workdir, started)
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

    python_bin = _find_executable("python") or sys.executable
    result = _run_command(
        [python_bin, "-u", str(source)],
        stdin=stdin,
        timeout_seconds=timeout_seconds,
        cwd=workdir,
    )
    return _execution_response(Language.python, result, started)


def _run_javascript(
    code: str,
    stdin: str,
    timeout_seconds: float,
    workdir: Path,
    started: float,
) -> RunResponse:
    source = workdir / "main.js"
    source.write_text(code, encoding="utf-8")

    node_bin = _find_executable("node") or "node"
    result = _run_command(
        [node_bin, str(source)],
        stdin=stdin,
        timeout_seconds=timeout_seconds,
        cwd=workdir,
    )
    return _execution_response(Language.javascript, result, started)


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

    gcc_bin = _find_executable("gcc") or "gcc"
    compile_result = _run_command(
        [gcc_bin, str(source), "-O2", "-std=c11", "-o", str(binary), "-lm"],
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

    gpp_bin = _find_executable("g++") or "g++"
    compile_result = _run_command(
        [gpp_bin, str(source), "-O2", "-std=c++17", "-o", str(binary)],
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


def _java_class_name(code: str) -> str:
    m_pub = JAVA_PUBLIC_CLASS_RE.search(code)
    if m_pub:
        return m_pub.group(1)
    m_main = JAVA_MAIN_CLASS_RE.search(code)
    if m_main:
        return m_main.group(1)
    m_any = JAVA_ANY_CLASS_RE.search(code)
    if m_any:
        return m_any.group(1)
    return "Main"


def _run_java(
    code: str,
    stdin: str,
    timeout_seconds: float,
    workdir: Path,
    started: float,
) -> RunResponse:
    # Strip package declaration so compilation in a flat temporary folder succeeds
    cleaned_code = re.sub(
        r"^\s*package\s+[\w.]+;\s*", "// package removed\n", code, flags=re.MULTILINE
    )

    class_name = _java_class_name(cleaned_code)
    source = workdir / f"{class_name}.java"
    source.write_text(cleaned_code, encoding="utf-8")

    javac_bin = _find_executable("javac") or "javac"
    java_bin = _find_executable("java") or "java"

    compile_result = _run_command(
        [javac_bin, str(source)],
        stdin="",
        timeout_seconds=timeout_seconds,
        cwd=workdir,
    )
    if compile_result.exit_code != 0 or compile_result.timed_out:
        return _compile_response(Language.java, compile_result, started)

    # Determine class name to execute
    target_class = class_name
    if not (workdir / f"{class_name}.class").exists():
        classes = [p.stem for p in workdir.glob("*.class")]
        if classes:
            target_class = classes[0]

    run_result = _run_command(
        [java_bin, "-cp", str(workdir), target_class],
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
        timeout_msg = "Execution timed out."
        full_stderr = f"{stderr}\n{timeout_msg}" if stderr else timeout_msg
        return CommandResult(
            stdout=_trim(stdout),
            stderr=_trim(full_stderr),
            exit_code=None,
            timed_out=True,
        )


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
