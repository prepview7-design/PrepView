from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

from app.models import HealthResponse, LanguageStatus, RunRequest, RunResponse
from app.runner import is_language_available, language_tools, run_code

app = FastAPI(
    title="Online Compiler and Interpreter API",
    description="Run Python, C, C++, and Java code through a FastAPI backend.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", response_class=HTMLResponse)
def playground() -> str:
    return """
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Online Compiler</title>
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background: #f6f7f9; color: #1f2937; }
    main { max-width: 1100px; margin: 0 auto; padding: 28px; }
    h1 { font-size: 28px; margin: 0 0 18px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    label { display: block; font-weight: 650; margin: 12px 0 6px; }
    textarea, select, input { width: 100%; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; font: 14px ui-monospace, SFMono-Regular, Consolas, monospace; background: white; }
    textarea { min-height: 360px; resize: vertical; }
    #stdin { min-height: 96px; }
    button { margin-top: 12px; border: 0; border-radius: 6px; background: #2563eb; color: white; padding: 10px 16px; font-weight: 700; cursor: pointer; }
    button:disabled { opacity: .65; cursor: wait; }
    pre { min-height: 198px; white-space: pre-wrap; background: #111827; color: #e5e7eb; border-radius: 6px; padding: 14px; overflow: auto; }
    @media (max-width: 850px) { .grid { grid-template-columns: 1fr; } main { padding: 18px; } }
  </style>
</head>
<body>
<main>
  <h1>Online Compiler</h1>
  <div class="grid">
    <section>
      <label for="language">Language</label>
      <select id="language">
        <option value="python">Python</option>
        <option value="c">C</option>
        <option value="cpp">C++</option>
        <option value="java">Java</option>
      </select>
      <label for="code">Code</label>
      <textarea id="code">print("Hello from Python")</textarea>
      <label for="stdin">Input</label>
      <textarea id="stdin"></textarea>
      <button id="run">Run</button>
    </section>
    <section>
      <label>Result</label>
      <pre id="result">Ready.</pre>
    </section>
  </div>
</main>
<script>
const examples = {
  python: 'name = input() or "Python"\\nprint(f"Hello, {name}!")',
  c: '#include <stdio.h>\\nint main() {\\n  char name[80];\\n  if (scanf("%79s", name) != 1) return 0;\\n  printf("Hello, %s!\\\\n", name);\\n  return 0;\\n}',
  cpp: '#include <iostream>\\n#include <string>\\nint main() {\\n  std::string name;\\n  std::cin >> name;\\n  std::cout << "Hello, " << name << "!\\\\n";\\n}',
  java: 'public class Main {\\n  public static void main(String[] args) throws Exception {\\n    java.util.Scanner sc = new java.util.Scanner(System.in);\\n    String name = sc.hasNext() ? sc.next() : "Java";\\n    System.out.println("Hello, " + name + "!");\\n  }\\n}'
};
const language = document.querySelector("#language");
const code = document.querySelector("#code");
const stdin = document.querySelector("#stdin");
const result = document.querySelector("#result");
const run = document.querySelector("#run");
language.addEventListener("change", () => { code.value = examples[language.value]; });
run.addEventListener("click", async () => {
  run.disabled = true;
  result.textContent = "Running...";
  try {
    const response = await fetch("/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: language.value, code: code.value, stdin: stdin.value })
    });
    const data = await response.json();
    result.textContent = [
      `status: ${data.status}`,
      `exit_code: ${data.exit_code}`,
      `duration_ms: ${data.duration_ms}`,
      "",
      "compile stderr:",
      data.compile_stderr || "(empty)",
      "",
      "stdout:",
      data.stdout || "(empty)",
      "",
      "stderr:",
      data.stderr || "(empty)"
    ].join("\\n");
  } catch (error) {
    result.textContent = String(error);
  } finally {
    run.disabled = false;
  }
});
</script>
</body>
</html>
"""


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    tools = language_tools()
    return HealthResponse(
        ok=True,
        languages=[
            LanguageStatus(
                language=language,
                available=is_language_available(language),
                tools=tool_paths,
            )
            for language, tool_paths in tools.items()
        ],
    )


@app.post("/run", response_model=RunResponse)
def run(request: RunRequest) -> RunResponse:
    return run_code(
        language=request.language,
        code=request.code,
        stdin=request.stdin,
        timeout_seconds=request.timeout_seconds,
    )
