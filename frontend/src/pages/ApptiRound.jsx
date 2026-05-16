import React, { useState } from 'react';
import { Play, CheckCircle, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ApptiRound() {
  const [company, setCompany] = useState('Google');
  const [difficulty, setDifficulty] = useState('Medium');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [evaluation, setEvaluation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    setQuestions([]);
    setAnswers({});
    setEvaluation(null);
    try {
      const response = await fetch(`${API_URL}/api/appti_round/api/generate-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, difficulty }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to generate test');
      
      setQuestions(data.questions);
      toast.success('Test generated successfully!');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionSelect = (questionId, optionKey) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionKey }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== questions.length) {
      toast.error('Please answer all questions before submitting.');
      return;
    }

    setIsLoading(true);
    try {
      const answersPayload = Object.keys(answers).map(qId => ({
        question_id: qId,
        selected_option: answers[qId]
      }));

      const response = await fetch(`${API_URL}/api/evaluations/aptitude`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ difficulty, questions, answers: answersPayload, company }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to evaluate test');
      
      setEvaluation(data);
      toast.success('Test evaluated successfully!');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ marginTop: '80px' }}>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900">Aptitude Test Round</h1>
        <p className="mt-2 text-gray-600">Prepare for company-specific aptitude tests with AI-generated questions.</p>
      </div>

      {!questions.length && !evaluation && (
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 max-w-md mx-auto">
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Company</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Google, Amazon, TCS"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isLoading || !company}
              className="mt-4 w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
              {isLoading ? 'Generating...' : 'Generate Test'}
            </button>
          </div>
        </div>
      )}

      {questions.length > 0 && !evaluation && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <h2 className="text-lg font-semibold">Test Generated for {company} ({difficulty})</h2>
            <p className="text-sm text-gray-500">Answer the following {questions.length} questions.</p>
          </div>
          
          {questions.map((q, index) => (
            <div key={q.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-md font-medium text-gray-900 mb-4">
                <span className="text-blue-600 font-bold mr-2">{index + 1}.</span>
                {q.question_text}
              </h3>
              <div className="space-y-3">
                {Object.entries(q.options).map(([key, value]) => (
                  <label
                    key={key}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                      answers[q.id] === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      value={key}
                      checked={answers[q.id] === key}
                      onChange={() => handleOptionSelect(q.id, key)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-3 font-medium text-gray-700">{key})</span>
                    <span className="ml-2 text-gray-600">{value}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex items-center gap-2 bg-green-600 text-white py-3 px-8 rounded-lg hover:bg-green-700 disabled:opacity-50 shadow-md text-lg font-medium transition"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              {isLoading ? 'Evaluating...' : 'Submit Answers'}
            </button>
          </div>
        </div>
      )}

      {evaluation && (
        <div className="space-y-8 animate-fade-in">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-2">Test Results</h2>
            <div className="text-5xl font-extrabold my-4">
              {evaluation.score} / {evaluation.total}
            </div>
            <p className="text-lg opacity-90">{evaluation.feedback_summary}</p>
            <button
              onClick={() => { setQuestions([]); setEvaluation(null); }}
              className="mt-6 bg-white text-blue-700 px-6 py-2 rounded-full font-semibold hover:bg-blue-50 transition"
            >
              Take Another Test
            </button>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 border-b pb-2">Detailed Review</h3>
            {evaluation.detailed_results.map((res, idx) => (
              <div key={idx} className={`p-6 rounded-xl border-l-4 shadow-sm bg-white ${res.is_correct ? 'border-green-500' : 'border-red-500'}`}>
                <div className="flex items-start justify-between">
                  <h4 className="text-md font-medium text-gray-900 w-4/5">{idx + 1}. {res.question_text}</h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${res.is_correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {res.is_correct ? 'Correct' : 'Incorrect'}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <span className="font-semibold text-gray-700">Your Answer:</span>
                    <p className="mt-1">{res.user_answer}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <span className="font-semibold text-blue-800">Correct Answer:</span>
                    <p className="mt-1 text-blue-900">{res.correct_answer}</p>
                  </div>
                </div>
                <div className="mt-4 bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-sm">
                  <span className="font-bold text-yellow-800">Explanation:</span>
                  <p className="mt-1 text-yellow-900">{res.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
