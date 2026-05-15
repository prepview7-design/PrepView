from app.models import Language
from app.runner import is_language_available, run_code


def test_python_execution():
    result = run_code(
        language=Language.python,
        code='name = input()\nprint(f"Hello, {name}!")',
        stdin="World\n",
        timeout_seconds=3,
    )

    assert result.status == "success"
    assert result.stdout == "Hello, World!\n"


def test_python_timeout():
    result = run_code(
        language=Language.python,
        code="while True:\n    pass",
        stdin="",
        timeout_seconds=0.5,
    )

    assert result.status == "timeout"
    assert result.timed_out is True


def test_c_compile_error_when_toolchain_available():
    if not is_language_available(Language.c):
        return

    result = run_code(
        language=Language.c,
        code="int main( { return 0; }",
        stdin="",
        timeout_seconds=3,
    )

    assert result.status == "compile_error"
    assert result.compile_stderr
