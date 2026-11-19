import sys
from pathlib import Path

# Add compiler root to sys.path
compiler_dir = str(Path(__file__).parent.parent)
if compiler_dir not in sys.path:
    sys.path.insert(0, compiler_dir)

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
    assert result.exit_code == 0


def test_python_timeout():
    result = run_code(
        language=Language.python,
        code="import time\ntime.sleep(2)",
        stdin="",
        timeout_seconds=0.5,
    )

    assert result.status == "timeout"
    assert result.timed_out is True


def test_javascript_execution():
    if not is_language_available(Language.javascript):
        return

    result = run_code(
        language=Language.javascript,
        code='const fs = require("fs"); const input = fs.readFileSync(0, "utf-8").trim(); console.log(`Hello, ${input}!`);',
        stdin="NodeJS\n",
        timeout_seconds=3,
    )

    assert result.status == "success"
    assert "Hello, NodeJS!" in result.stdout
    assert result.exit_code == 0


def test_java_execution_public_class():
    if not is_language_available(Language.java):
        return

    result = run_code(
        language=Language.java,
        code='public class Main { public static void main(String[] args) { System.out.println("Hello, Java!"); } }',
        stdin="",
        timeout_seconds=5,
    )

    assert result.status == "success"
    assert "Hello, Java!" in result.stdout
    assert result.exit_code == 0


def test_java_execution_solution_class():
    """Tests competitive programming style class Solution without public modifier."""
    if not is_language_available(Language.java):
        return

    result = run_code(
        language=Language.java,
        code='class Solution { public static void main(String[] args) { System.out.println("Solution executed!"); } }',
        stdin="",
        timeout_seconds=5,
    )

    assert result.status == "success"
    assert "Solution executed!" in result.stdout
    assert result.exit_code == 0


def test_java_compile_error():
    if not is_language_available(Language.java):
        return

    result = run_code(
        language=Language.java,
        code='public class Main { public static void main(String[] args) { invalid_syntax } }',
        stdin="",
        timeout_seconds=5,
    )

    assert result.status == "compile_error"
    assert result.compile_stderr != ""


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
    assert result.compile_stderr != ""
