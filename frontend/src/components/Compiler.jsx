import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import {
  Play,
  Loader2,
  Terminal,
  Code2,
  FileCode2,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const STARTER_TEMPLATES = {
  python: (fnName) => `# Write your solution here\ndef ${fnName || 'solution'}():\n    pass\n`,
  javascript: (fnName) => `/**\n * @return {*}\n */\nvar ${fnName || 'solution'} = function() {\n    \n};\n`,
  java: () => `public class Main {\n    public static void main(String[] args) {\n        \n    }\n}`,
  cpp: () => `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}`,
  c: () => `#include <stdio.h>\n\nint main() {\n    \n    return 0;\n}`,
};

export default function Compiler({ question, testCases, onTestResults }) {
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [stdin, setStdin] = useState('');
  const [output, setOutput] = useState('⚡ Ready to execute...');
  const [isLoading, setIsLoading] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [activeTab, setActiveTab] = useState('testcases'); // 'testcases' | 'output'

  useEffect(() => {
    const template = STARTER_TEMPLATES[language];
    setCode(template ? template() : '');
  }, [language]);

  const handleRun = async () => {
    setIsLoading(true);
    setOutput('Running...');
    setActiveTab('output');
    try {
      const response = await fetch(`${API_URL}/compiler/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code, stdin }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to run code');
      setOutput(
        [
          `status: ${data.status}`,
          `exit_code: ${data.exit_code}`,
          `duration_ms: ${data.duration_ms}`,
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!testCases || testCases.length === 0) {
      handleRun();
      return;
    }
    setIsRunningTests(true);
    setActiveTab('testcases');
    const results = [];

    for (const tc of testCases) {
      const inputStr = Object.entries(tc.input)
        .map(([, v]) => JSON.stringify(v))
        .join('\n');
      try {
        const response = await fetch(`${API_URL}/compiler/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language, code, stdin: inputStr }),
        });
        const data = await response.json();
        const actualOut = (data.stdout || '').trim();
        const expectedOut = JSON.stringify(tc.output).trim();
        const passed = actualOut === expectedOut ||
          actualOut === String(tc.output) ||
          actualOut.replace(/\s/g, '') === expectedOut.replace(/\s/g, '');
        results.push({ input: tc.input, expected: tc.output, actual: actualOut, passed, status: data.status });
      } catch {
        results.push({ input: tc.input, expected: tc.output, actual: 'Error', passed: false, status: 'error' });
      }
    }

    setTestResults(results);
    const passed = results.filter(r => r.passed).length;
    if (onTestResults) onTestResults(passed, results.length);
    setIsRunningTests(false);
  };

  const getExtension = () => {
    const map = { python: 'py', javascript: 'js', java: 'java', cpp: 'cpp', c: 'c' };
    return map[language] || language;
  };

  const monacoLang = language === 'c' ? 'cpp' : language;

  return (
    <div style={styles.wrapper}>
      {/* Top bar */}
      <div style={styles.topBar}>
        <div style={styles.topLeft}>
          <div style={styles.dots}>
            <span style={{ ...styles.dot, background: '#EF4444' }} />
            <span style={{ ...styles.dot, background: '#F59E0B' }} />
            <span style={{ ...styles.dot, background: '#22C55E' }} />
          </div>
          <div style={styles.fileInfo}>
            <FileCode2 size={15} color="#60A5FA" />
            <span>main.{getExtension()}</span>
          </div>
        </div>
        <div style={styles.topRight}>
          <div style={styles.langBox}>
            <FileCode2 size={14} color="#94A3B8" />
            <select value={language} onChange={e => setLanguage(e.target.value)} style={styles.select}>
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="c">C</option>
            </select>
          </div>
          <button onClick={handleRun} disabled={isLoading || isRunningTests} style={styles.runBtn}>
            {isLoading ? <Loader2 size={15} className="spin" /> : <Play size={15} />}
            Run
          </button>
          <button onClick={handleSubmit} disabled={isLoading || isRunningTests} style={styles.submitBtn}>
            {isRunningTests ? <Loader2 size={15} className="spin" /> : <CheckCircle size={15} />}
            Submit
          </button>
        </div>
      </div>

      {/* Editor */}
      <div style={styles.editorArea}>
        <Editor
          height="100%"
          language={monacoLang}
          theme="vs-dark"
          value={code}
          onChange={v => setCode(v)}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            smoothScrolling: true,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 16 },
            lineNumbers: 'on',
            renderLineHighlight: 'all',
          }}
        />
      </div>

      {/* Bottom panel */}
      <div style={styles.bottomPanel}>
        <div style={styles.tabRow}>
          <button
            style={{ ...styles.tab, ...(activeTab === 'testcases' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('testcases')}
          >
            <Terminal size={13} /> Test Cases
          </button>
          <button
            style={{ ...styles.tab, ...(activeTab === 'output' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('output')}
          >
            <Code2 size={13} /> Output
          </button>
        </div>

        <div style={styles.panelBody}>
          {activeTab === 'output' && (
            <div style={styles.outputSection}>
              <div style={styles.stdinLabel}>
                <Terminal size={13} color="#60A5FA" /> Custom Input
              </div>
              <textarea
                rows={2}
                value={stdin}
                onChange={e => setStdin(e.target.value)}
                placeholder="stdin..."
                style={styles.stdinArea}
              />
              <div style={styles.stdinLabel}>
                <Terminal size={13} color="#4ADE80" /> Output
              </div>
              <pre style={styles.outputPre}>{output}</pre>
            </div>
          )}

          {activeTab === 'testcases' && (
            <div style={styles.tcSection}>
              {testResults.length > 0 ? (
                <>
                  <div style={styles.tcSummary}>
                    <span style={{ color: '#4ADE80', fontWeight: 700 }}>
                      {testResults.filter(r => r.passed).length}/{testResults.length} passed
                    </span>
                    <div style={styles.tcBar}>
                      {testResults.map((r, i) => (
                        <div
                          key={i}
                          style={{
                            ...styles.tcBarSlice,
                            background: r.passed ? '#22C55E' : '#EF4444',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  {testResults.map((r, i) => (
                    <div key={i} style={{ ...styles.tcRow, borderColor: r.passed ? '#1A3A2A' : '#3A1A1A' }}>
                      <div style={styles.tcRowHeader}>
                        {r.passed
                          ? <CheckCircle size={15} color="#4ADE80" />
                          : <XCircle size={15} color="#EF4444" />}
                        <span style={{ color: r.passed ? '#4ADE80' : '#EF4444', fontWeight: 600 }}>
                          Case {i + 1} — {r.passed ? 'Accepted' : 'Wrong Answer'}
                        </span>
                      </div>
                      <div style={styles.tcDetail}>
                        <span style={styles.tcLabel}>Input:</span>
                        <span style={styles.tcValue}>{JSON.stringify(r.input)}</span>
                      </div>
                      <div style={styles.tcDetail}>
                        <span style={styles.tcLabel}>Expected:</span>
                        <span style={styles.tcValue}>{JSON.stringify(r.expected)}</span>
                      </div>
                      <div style={styles.tcDetail}>
                        <span style={styles.tcLabel}>Got:</span>
                        <span style={{ ...styles.tcValue, color: r.passed ? '#4ADE80' : '#F87171' }}>
                          {r.actual}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div style={styles.tcEmpty}>
                  {testCases && testCases.length > 0 ? (
                    <>
                      <Terminal size={22} color="#334155" />
                      <p style={{ color: '#475569', margin: '8px 0 0' }}>
                        Click <strong style={{ color: '#60A5FA' }}>Submit</strong> to run test cases
                      </p>
                      <div style={{ marginTop: 12 }}>
                        {testCases.slice(0, 3).map((tc, i) => (
                          <div key={i} style={styles.tcPreview}>
                            <span style={styles.tcLabel}>Case {i + 1}:</span>
                            <span style={styles.tcValue}>{JSON.stringify(tc.input)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <Terminal size={22} color="#334155" />
                      <p style={{ color: '#475569', margin: '8px 0 0' }}>No test cases available</p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#111827',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid #1E293B',
  },
  topBar: {
    height: '52px',
    background: '#0B1220',
    borderBottom: '1px solid #1E293B',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 16px',
    flexShrink: 0,
  },
  topLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  dots: {
    display: 'flex',
    gap: '6px',
  },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#CBD5E1',
    fontSize: '13px',
    fontWeight: 500,
  },
  topRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  langBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: '#0F172A',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '5px 10px',
  },
  select: {
    background: 'transparent',
    border: 'none',
    color: '#E2E8F0',
    fontSize: '13px',
    outline: 'none',
    cursor: 'pointer',
  },
  runBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: '#1E293B',
    color: '#E2E8F0',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: '#2563EB',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
  },
  editorArea: {
    flex: 1,
    minHeight: 0,
    height: '420px',
  },
  bottomPanel: {
    height: '220px',
    borderTop: '1px solid #1E293B',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  tabRow: {
    display: 'flex',
    gap: '2px',
    background: '#0B1220',
    borderBottom: '1px solid #1E293B',
    padding: '0 12px',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748B',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    transition: 'color 0.2s',
  },
  tabActive: {
    color: '#60A5FA',
    borderBottomColor: '#2563EB',
  },
  panelBody: {
    flex: 1,
    overflow: 'auto',
    padding: '12px',
  },
  outputSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  stdinLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#64748B',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  stdinArea: {
    width: '100%',
    background: '#0F172A',
    border: '1px solid #1E293B',
    borderRadius: '8px',
    padding: '8px 12px',
    color: '#E2E8F0',
    fontSize: '13px',
    fontFamily: 'monospace',
    outline: 'none',
    resize: 'none',
    boxSizing: 'border-box',
  },
  outputPre: {
    color: '#4ADE80',
    fontSize: '13px',
    lineHeight: '1.7',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
    margin: 0,
    background: '#0F172A',
    border: '1px solid #1E293B',
    borderRadius: '8px',
    padding: '8px 12px',
  },
  tcSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  tcSummary: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '4px',
  },
  tcBar: {
    flex: 1,
    display: 'flex',
    gap: '2px',
    height: '6px',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  tcBarSlice: {
    flex: 1,
    borderRadius: '2px',
  },
  tcRow: {
    background: '#0B1220',
    border: '1px solid #1E293B',
    borderRadius: '8px',
    padding: '8px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  tcRowHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '4px',
  },
  tcDetail: {
    display: 'flex',
    gap: '8px',
    fontSize: '12px',
  },
  tcLabel: {
    color: '#64748B',
    fontWeight: 600,
    minWidth: '64px',
    fontFamily: 'monospace',
  },
  tcValue: {
    color: '#CBD5E1',
    fontFamily: 'monospace',
    wordBreak: 'break-all',
  },
  tcEmpty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    color: '#334155',
    fontSize: '13px',
  },
  tcPreview: {
    display: 'flex',
    gap: '8px',
    fontSize: '12px',
    padding: '4px 8px',
    background: '#0B1220',
    borderRadius: '6px',
    marginTop: '4px',
  },
};
