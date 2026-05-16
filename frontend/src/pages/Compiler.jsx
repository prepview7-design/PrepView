import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const examples = {
  python: 'name = input() or "Python"\nprint(f"Hello, {name}!")',
  c: '#include <stdio.h>\nint main() {\n  char name[80];\n  if (scanf("%79s", name) != 1) return 0;\n  printf("Hello, %s!\\n", name);\n  return 0;\n}',
  cpp: '#include <iostream>\n#include <string>\nint main() {\n  std::string name;\n  std::cin >> name;\n  std::cout << "Hello, " << name << "!\\n";\n}',
  java: 'public class Main {\n  public static void main(String[] args) throws Exception {\n    java.util.Scanner sc = new java.util.Scanner(System.in);\n    String name = sc.hasNext() ? sc.next() : "Java";\n    System.out.println("Hello, " + name + "!");\n  }\n}'
};

export default function Compiler() {
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(examples.python);
  const [stdin, setStdin] = useState('');
  const [output, setOutput] = useState('Ready.');
  const [isLoading, setIsLoading] = useState(false);

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    setCode(examples[lang]);
  };

  const handleRun = async () => {
    setIsLoading(true);
    setOutput('Running...');
    try {
      const response = await fetch(`${API_URL}/api/compiler/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code, stdin }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to run code');
      }

      setOutput([
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
      ].join("\n"));
    } catch (error) {
      setOutput(`Error: ${error.message}`);
      toast.error('Failed to execute code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ marginTop: '80px' }}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Online Compiler</h1>
        <p className="mt-2 text-gray-600">Run Python, C, C++, and Java code directly in your browser.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Section */}
        <div className="flex flex-col gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-1 w-1/3">
              <label htmlFor="language" className="text-sm font-medium text-gray-700">Language</label>
              <select
                id="language"
                value={language}
                onChange={handleLanguageChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              >
                <option value="python">Python</option>
                <option value="c">C</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>
            </div>
            
            <button
              onClick={handleRun}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {isLoading ? 'Running...' : 'Run Code'}
            </button>
          </div>

          <div className="flex flex-col gap-1 h-[400px] border border-gray-200 rounded-md overflow-hidden">
            <Editor
              height="100%"
              language={language === 'c' || language === 'cpp' ? 'cpp' : language}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value)}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
              }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="stdin" className="text-sm font-medium text-gray-700">Standard Input (stdin)</label>
            <textarea
              id="stdin"
              rows={3}
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border font-mono"
              placeholder="Enter input here..."
            />
          </div>
        </div>

        {/* Output Section */}
        <div className="flex flex-col gap-4 bg-gray-900 rounded-xl shadow-sm border border-gray-800 p-6 h-full min-h-[600px]">
          <h2 className="text-lg font-medium text-white">Execution Result</h2>
          <pre className="flex-1 overflow-auto bg-black text-gray-300 p-4 rounded-md font-mono text-sm whitespace-pre-wrap">
            {output}
          </pre>
        </div>
      </div>
    </div>
  );
}
