# Online Compiler and Interpreter Backend

FastAPI backend for running Python, C, C++, and Java code from a web client.

## Features

- `POST /run` executes code with optional standard input.
- `GET /health` reports available local toolchains.
- Built-in browser playground at `GET /`.
- Per-run temporary directories.
- Compile support for C, C++, and Java.
- Timeout, request-size, and output-size limits.

## Requirements

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Install language toolchains and make sure they are on `PATH`:

- Python: `python`
- C: `gcc`
- C++: `g++`
- Java: `javac` and `java`

## Run

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Open:

```text
http://localhost:8000
```

API docs:

```text
http://localhost:8000/docs
```

## API Example

```bash
curl -X POST http://localhost:8000/run \
  -H "Content-Type: application/json" \
  -d "{\"language\":\"python\",\"code\":\"print(input())\",\"stdin\":\"hello\"}"
```

Response shape:

```json
{
  "language": "python",
  "status": "success",
  "stdout": "hello\n",
  "stderr": "",
  "compile_stdout": "",
  "compile_stderr": "",
  "exit_code": 0,
  "timed_out": false,
  "duration_ms": 28
}
```

## Security Note

This service executes untrusted code. Timeouts and temporary folders are useful operational controls, but they are not a security boundary. Before exposing it to real public users, run executions inside isolated containers or virtual machines, with strict CPU, memory, network, filesystem, and process limits.

Good production architecture:

- FastAPI API server receives requests.
- A job queue dispatches code execution.
- Worker containers run one submission each.
- Containers have no host mounts except a disposable workspace.
- Network is disabled unless explicitly needed.
- CPU, memory, process count, and wall-time limits are enforced by the container runtime.

## Test

```bash
pytest
```
