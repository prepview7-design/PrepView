import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import {
  Play,
  Loader2,
  Terminal,
  Code2,
  FileCode2,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAntiCheat } from '../hooks/useAntiCheat';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000';

const examples = {
  python:
    'name = input() or "Python"\nprint(f"Hello, {name}!")',

  c:
    '#include <stdio.h>\nint main() {\n  char name[80];\n  if (scanf("%79s", name) != 1) return 0;\n  printf("Hello, %s!\\n", name);\n  return 0;\n}',

  cpp:
    '#include <iostream>\n#include <string>\nint main() {\n  std::string name;\n  std::cin >> name;\n  std::cout << "Hello, " << name << "!\\n";\n}',

  java:
    'public class Main {\n  public static void main(String[] args) throws Exception {\n    java.util.Scanner sc = new java.util.Scanner(System.in);\n    String name = sc.hasNext() ? sc.next() : "Java";\n    System.out.println("Hello, " + name + "!");\n  }\n}',
};

export default function Compiler() {
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(examples.python);
  const [stdin, setStdin] = useState('');
  const [output, setOutput] = useState(
    '⚡ Ready to execute code...'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  // Anti-Cheat Hook
  useAntiCheat(!hasFailed, () => setHasFailed(true));

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    setCode(examples[lang]);
  };

  const handleRun = async () => {
    setIsLoading(true);
    setOutput('Running...');

    try {
      const response = await fetch(
        `${API_URL}/compiler/run`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            language,
            code,
            stdin,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || 'Failed to run code'
        );
      }

      setOutput(
        [
          `status: ${data.status}`,
          `exit_code: ${data.exit_code}`,
          `duration_ms: ${data.duration_ms}`,
          '',
          'compile stderr:',
          data.compile_stderr || '(empty)',
          '',
          'stdout:',
          data.stdout || '(empty)',
          '',
          'stderr:',
          data.stderr || '(empty)',
        ].join('\n')
      );
    } catch (error) {
      setOutput(`Error: ${error.message}`);
      toast.error('Failed to execute code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* HEADER */}
        <div style={styles.header}>

          <div>
            <div style={styles.titleRow}>

              <div style={styles.logoBox}>
                <Code2 size={28} color="#60A5FA" />
              </div>

              <div>
                <h1 style={styles.title}>
                  PrepView Compiler
                </h1>

                <p style={styles.subtitle}>
                  Run Python, C, C++, and Java directly in
                  your browser.
                </p>
              </div>
            </div>
          </div>

          <div style={styles.headerActions}>

            {/* LANGUAGE */}
            <div style={styles.languageBox}>

              <FileCode2 size={18} color="#94A3B8" />

              <select
                value={language}
                onChange={handleLanguageChange}
                style={styles.select}
              >
                <option value="python">Python</option>
                <option value="c">C</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>
            </div>

            {/* RUN BUTTON */}
            <button
              onClick={handleRun}
              disabled={isLoading}
              style={styles.runButton}
            >
              {isLoading ? (
                <Loader2
                  size={18}
                  className="spin"
                />
              ) : (
                <Play size={18} />
              )}

              {isLoading ? 'Running...' : 'Run Code'}
            </button>
          </div>
        </div>

        {/* MAIN GRID */}
        {hasFailed ? (
          <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <h2 style={{ color: '#EF4444', fontSize: '32px' }}>Disqualified</h2>
            <p style={{ color: '#94A3B8', fontSize: '18px' }}>
              Your session was terminated due to suspicious activity (cheating).
            </p>
          </div>
        ) : (
          <div style={styles.grid}>

          {/* LEFT SIDE */}
          <div style={styles.leftPanel}>

            {/* EDITOR CARD */}
            <div style={styles.card}>

              {/* TOP BAR */}
              <div style={styles.topBar}>

                <div style={styles.topLeft}>

                  <div style={styles.dotRed}></div>
                  <div style={styles.dotYellow}></div>
                  <div style={styles.dotGreen}></div>

                  <div style={styles.fileInfo}>
                    <FileCode2 size={16} />

                    <span>
                      main.
                      {language === 'python'
                        ? 'py'
                        : language === 'cpp'
                        ? 'cpp'
                        : language}
                    </span>
                  </div>
                </div>

                <div style={styles.topRight}>
                  <span>Monaco Editor</span>

                  <ChevronRight size={16} />

                  <span>
                    {language.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* EDITOR */}
              <div style={styles.editorWrapper}>

                <Editor
                  height="100%"
                  language={
                    language === 'c' ||
                    language === 'cpp'
                      ? 'cpp'
                      : language
                  }
                  theme="vs-dark"
                  value={code}
                  onChange={(value) =>
                    setCode(value)
                  }
                  options={{
                    minimap: {
                      enabled: false,
                    },

                    fontSize: 15,

                    smoothScrolling: true,

                    scrollBeyondLastLine: false,

                    automaticLayout: true,

                    padding: {
                      top: 20,
                    },
                  }}
                />
              </div>
            </div>

            {/* INPUT CARD */}
            <div style={styles.card}>

              <div style={styles.topBar}>

                <div style={styles.inputHeader}>
                  <Terminal
                    size={18}
                    color="#60A5FA"
                  />

                  <span>Standard Input</span>
                </div>
              </div>

              <div style={styles.stdinContainer}>

                <textarea
                  rows={5}
                  value={stdin}
                  onChange={(e) =>
                    setStdin(e.target.value)
                  }
                  placeholder="Enter custom input here..."
                  style={styles.textarea}
                />
              </div>
            </div>
          </div>

          {/* OUTPUT PANEL */}
          <div style={styles.outputCard}>

            {/* TERMINAL HEADER */}
            <div style={styles.topBar}>

              <div style={styles.inputHeader}>
                <Terminal
                  size={18}
                  color="#4ADE80"
                />

                <span>Execution Terminal</span>
              </div>

              <div style={styles.liveStatus}>

                <div style={styles.liveDot}></div>

                <span>Live</span>
              </div>
            </div>

            {/* OUTPUT */}
            <div style={styles.outputBody}>

              <pre style={styles.outputText}>
                {output}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0F172A',
    padding: '110px 28px 40px',
    fontFamily: 'Inter, sans-serif',
  },

  container: {
    maxWidth: '1600px',
    margin: '0 auto',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap',
    marginBottom: '28px',
  },

  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
  },

  logoBox: {
    width: '62px',
    height: '62px',
    borderRadius: '20px',
    background: 'rgba(59,130,246,0.12)',
    border: '1px solid rgba(59,130,246,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: '42px',
    fontWeight: 800,
    color: '#FFFFFF',
    margin: 0,
  },

  subtitle: {
    fontSize: '15px',
    color: '#94A3B8',
    marginTop: '6px',
  },

  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },

  languageBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#111827',
    border: '1px solid #334155',
    borderRadius: '18px',
    padding: '14px 18px',
  },

  select: {
    background: 'transparent',
    border: 'none',
    color: '#FFFFFF',
    fontSize: '14px',
    outline: 'none',
    cursor: 'pointer',
  },

  runButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#2563EB',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '18px',
    padding: '14px 24px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow:
      '0 10px 30px rgba(37,99,235,0.25)',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 0.8fr',
    gap: '24px',
  },

  leftPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },

  card: {
    background: '#111827',
    border: '1px solid #1E293B',
    borderRadius: '28px',
    overflow: 'hidden',
    boxShadow:
      '0 10px 40px rgba(0,0,0,0.35)',
  },

  outputCard: {
    background: '#000000',
    border: '1px solid #1E293B',
    borderRadius: '28px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '860px',
    boxShadow:
      '0 10px 40px rgba(0,0,0,0.35)',
  },

  topBar: {
    height: '68px',
    background: '#0B1220',
    borderBottom: '1px solid #1E293B',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 24px',
  },

  topLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },

  dotRed: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: '#EF4444',
  },

  dotYellow: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: '#F59E0B',
  },

  dotGreen: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: '#22C55E',
  },

  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#CBD5E1',
    fontSize: '14px',
    fontWeight: 500,
  },

  topRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#64748B',
    fontSize: '13px',
  },

  editorWrapper: {
    height: '650px',
  },

  inputHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#FFFFFF',
    fontWeight: 600,
  },

  stdinContainer: {
    padding: '24px',
  },

  textarea: {
    width: '100%',
    background: '#0F172A',
    border: '1px solid #334155',
    borderRadius: '18px',
    padding: '18px',
    color: '#E2E8F0',
    fontSize: '14px',
    fontFamily: 'monospace',
    outline: 'none',
    resize: 'none',
    boxSizing: 'border-box',
  },

  liveStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#64748B',
    fontSize: '13px',
  },

  liveDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#22C55E',
  },

  outputBody: {
    flex: 1,
    padding: '24px',
    overflow: 'auto',
  },

  outputText: {
    color: '#4ADE80',
    fontSize: '14px',
    lineHeight: '1.8',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
    margin: 0,
  },
};