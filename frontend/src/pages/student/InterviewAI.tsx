import { useState } from 'react';
import {
  generateInterviewQuestions,
  evaluateAnswer,
  type InterviewQuestion,
  type InterviewSessionResult,
  type EvaluationResult,
} from '../../services/ai.service';

const DIFF_COLOR: Record<string, string> = {
  Easy: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
  Medium: 'bg-amber-900/40 text-amber-300 border-amber-700/50',
  Hard: 'bg-rose-900/40 text-rose-300 border-rose-700/50',
};

const TOPIC_COLOR: Record<string, string> = {
  Technical: 'bg-blue-900/40 text-blue-300 border-blue-700/50',
  Behavioral: 'bg-purple-900/40 text-purple-300 border-purple-700/50',
  HR: 'bg-pink-900/40 text-pink-300 border-pink-700/50',
  Aptitude: 'bg-orange-900/40 text-orange-300 border-orange-700/50',
  General: 'bg-slate-800 text-slate-400 border-slate-600',
};

export default function InterviewAI() {
  const [role, setRole] = useState('');
  const [interviewType, setInterviewType] = useState('Mixed');
  const [count, setCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [session, setSession] = useState<InterviewSessionResult | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  async function handleGenerate() {
    if (!role.trim()) { setGenError('Role is required.'); return; }
    setGenerating(true);
    setGenError(null);
    setSession(null);
    setCurrentQ(0);
    setEvalResult(null);
    try {
      const res = await generateInterviewQuestions({ role, interview_type: interviewType, count });
      setSession(res);
    } catch (e: any) {
      setGenError(e?.response?.data?.error?.message || 'Failed to generate questions.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleEvaluate() {
    if (!session || !answer.trim()) { setEvalError('Please provide an answer first.'); return; }
    const q = session.questions[currentQ];
    setEvaluating(true);
    setEvalError(null);
    try {
      const res = await evaluateAnswer({
        session_id: session.sessionId,
        question: q.question,
        answer,
        role,
        topic: q.topic,
      });
      setEvalResult(res);
    } catch (e: any) {
      setEvalError(e?.response?.data?.error?.message || 'Evaluation failed.');
    } finally {
      setEvaluating(false);
    }
  }

  function handleNext() {
    if (!session) return;
    setCurrentQ(q => Math.min(q + 1, session.questions.length - 1));
    setAnswer('');
    setEvalResult(null);
    setShowHint(false);
    setEvalError(null);
  }

  function handlePrev() {
    setCurrentQ(q => Math.max(q - 1, 0));
    setAnswer('');
    setEvalResult(null);
    setShowHint(false);
    setEvalError(null);
  }

  const currentQuestion: InterviewQuestion | undefined = session?.questions[currentQ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center text-xl">🎤</div>
          <div>
            <h1 className="text-2xl font-bold text-white">AI Interview Practice</h1>
            <p className="text-sm text-slate-400">Practice questions and get AI feedback — advisory only, not a real interview</p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-rose-900/20 border border-rose-700/40 rounded-xl p-4 text-sm text-rose-300 flex gap-2">
          <span>⚠️</span>
          <span><strong>Practice Only:</strong> AI-generated questions are for preparation. These are not actual company interview questions. AI feedback is advisory and not a professional hiring assessment.</span>
        </div>

        {/* Config */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-white">Configure Practice Session</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Target Role *</label>
              <input
                id="interview-role-input"
                value={role}
                onChange={e => setRole(e.target.value)}
                placeholder="e.g. Software Engineer, Data Analyst"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Interview Type</label>
              <select
                value={interviewType}
                onChange={e => setInterviewType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500"
              >
                {['Mixed', 'Technical', 'Behavioral', 'HR', 'Aptitude'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Questions: {count}</label>
              <input type="range" min={1} max={10} value={count} onChange={e => setCount(Number(e.target.value))} className="w-32 accent-rose-500" />
            </div>
            <button
              id="generate-questions-btn"
              onClick={handleGenerate}
              disabled={generating}
              className="ml-auto px-6 py-2.5 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold text-white transition-all"
            >
              {generating ? '⏳ Generating…' : '🚀 Start Session'}
            </button>
          </div>
          {genError && <p className="text-sm text-red-400">{genError}</p>}
        </div>

        {/* Session */}
        {session && currentQuestion && (
          <div className="space-y-4">
            {/* Progress */}
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>Question {currentQ + 1} of {session.questions.length}</span>
              <div className="flex gap-1">
                {session.questions.map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i === currentQ ? 'bg-rose-500' : i < currentQ ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                ))}
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex gap-2 shrink-0 flex-wrap">
                  <span className={`px-2 py-0.5 border rounded text-xs font-medium ${TOPIC_COLOR[currentQuestion.topic] || TOPIC_COLOR.General}`}>
                    {currentQuestion.topic}
                  </span>
                  <span className={`px-2 py-0.5 border rounded text-xs font-medium ${DIFF_COLOR[currentQuestion.difficulty] || ''}`}>
                    {currentQuestion.difficulty}
                  </span>
                </div>
              </div>
              <p className="text-white font-medium leading-relaxed">{currentQuestion.question}</p>
              {currentQuestion.hint && (
                <div>
                  <button onClick={() => setShowHint(!showHint)} className="text-xs text-slate-500 hover:text-slate-300">
                    {showHint ? '🙈 Hide hint' : '💡 Show hint'}
                  </button>
                  {showHint && <p className="mt-2 text-sm text-slate-400 italic">{currentQuestion.hint}</p>}
                </div>
              )}

              <textarea
                id="answer-input"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                rows={5}
                placeholder="Type your answer here…"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 resize-none"
              />

              <div className="flex gap-3">
                <button onClick={handlePrev} disabled={currentQ === 0} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 rounded-lg text-sm text-slate-300 transition-all">← Prev</button>
                <button
                  id="evaluate-answer-btn"
                  onClick={handleEvaluate}
                  disabled={evaluating || !answer.trim()}
                  className="flex-1 py-2 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold text-white transition-all"
                >
                  {evaluating ? '⏳ Evaluating…' : '📊 Evaluate Answer'}
                </button>
                <button onClick={handleNext} disabled={currentQ === session.questions.length - 1} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 rounded-lg text-sm text-slate-300 transition-all">Next →</button>
              </div>
              {evalError && <p className="text-sm text-red-400">{evalError}</p>}
            </div>

            {/* Evaluation Result */}
            {evalResult && (
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-white">AI Feedback</h2>
                  <span className="text-xs px-2 py-0.5 bg-rose-900/40 text-rose-300 border border-rose-700/50 rounded">AI Advisory</span>
                </div>
                <p className="text-xs text-slate-500 italic">{evalResult.disclaimer}</p>

                {/* Score Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { label: 'Relevance', val: evalResult.evaluation.relevance },
                    { label: 'Clarity', val: evalResult.evaluation.clarity },
                    { label: 'Tech Depth', val: evalResult.evaluation.technicalDepth },
                    { label: 'Completeness', val: evalResult.evaluation.completeness },
                    { label: 'Overall', val: evalResult.evaluation.overall },
                  ].map(({ label, val }) => (
                    <div key={label} className="bg-slate-800 rounded-lg p-3 text-center">
                      <div className={`text-2xl font-bold ${val >= 8 ? 'text-emerald-400' : val >= 5 ? 'text-amber-400' : 'text-rose-400'}`}>{val}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-800/60 rounded-lg p-4">
                  <p className="text-sm text-slate-300">{evalResult.evaluation.feedback}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-emerald-400 mb-2">✅ Strengths</h3>
                    <ul className="space-y-1">{evalResult.evaluation.strengths.map((s, i) => <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="shrink-0">•</span>{s}</li>)}</ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-amber-400 mb-2">💡 Improve</h3>
                    <ul className="space-y-1">{evalResult.evaluation.improvements.map((s, i) => <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="shrink-0">•</span>{s}</li>)}</ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
