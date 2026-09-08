import { useState } from 'react';
import {
  generateInterviewQuestions,
  evaluateAnswer,
  type InterviewQuestion,
  type InterviewSessionResult,
  type EvaluationResult,
} from '../../services/ai.service';
import AppLayout from '../../components/layout/AppLayout';
import { PageHeader, Card, Button, Badge, InfoBanner, ErrorState } from '../../components/ui';
import { Mic, Sparkles, AlertTriangle, Settings, Send, ChevronLeft, ChevronRight, Eye, EyeOff, CheckCircle, Lightbulb } from 'lucide-react';

const DIFF_COLOR: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  Easy: 'success',
  Medium: 'warning',
  Hard: 'error',
};

const TOPIC_COLOR: Record<string, 'brand' | 'primary' | 'secondary' | 'default'> = {
  Technical: 'brand',
  Behavioral: 'primary',
  HR: 'secondary',
  Aptitude: 'default',
  General: 'default',
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
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <PageHeader
          title="AI Interview Practice"
          subtitle="Practice questions and get AI feedback — advisory only, not a real interview"
          icon={<Mic size={32} style={{ color: 'var(--brand)' }} />}
        />

        <InfoBanner
          type="warning"
          title="Practice Only"
          message="AI-generated questions are for preparation. These are not actual company interview questions. AI feedback is advisory and not a professional hiring assessment."
          icon={<AlertTriangle size={20} />}
        />

        {/* Config */}
        <Card>
          <div className="flex items-center gap-2 mb-4 pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <Settings size={20} style={{ color: 'var(--brand)' }} />
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Configure Practice Session</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                Target Role <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <input
                id="interview-role-input"
                value={role}
                onChange={e => setRole(e.target.value)}
                placeholder="e.g. Software Engineer, Data Analyst"
                className="w-full rounded-xl text-sm focus:outline-none focus:ring-2"
                style={{
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  padding: '0.75rem 1rem',
                  outlineColor: 'var(--brand)'
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                Interview Type
              </label>
              <select
                value={interviewType}
                onChange={e => setInterviewType(e.target.value)}
                className="w-full rounded-xl text-sm focus:outline-none focus:ring-2"
                style={{
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  padding: '0.75rem 1rem',
                  outlineColor: 'var(--brand)'
                }}
              >
                {['Mixed', 'Technical', 'Behavioral', 'HR', 'Aptitude'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl" style={{ background: 'var(--surface-2)' }}>
            <div className="flex-1 w-full">
              <div className="flex justify-between mb-2">
                <label className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Questions Count</label>
                <span className="text-sm font-mono font-bold" style={{ color: 'var(--brand)' }}>{count}</span>
              </div>
              <input 
                type="range" 
                min={1} 
                max={10} 
                value={count} 
                onChange={e => setCount(Number(e.target.value))} 
                className="w-full"
                style={{ accentColor: 'var(--brand)' }}
              />
            </div>
            <Button
              id="generate-questions-btn"
              onClick={handleGenerate}
              disabled={generating}
              variant="primary"
              leftIcon={<Sparkles size={16} />}
              isLoading={generating}
              loadingText="Generating…"
              className="w-full sm:w-auto"
            >
              Start Session
            </Button>
          </div>
          {genError && <div className="mt-4"><ErrorState message={genError} /></div>}
        </Card>

        {/* Session */}
        {session && currentQuestion && (
          <div className="space-y-6 animate-fade-in">
            {/* Progress */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                Question {currentQ + 1} of {session.questions.length}
              </span>
              <div className="flex-1 flex gap-1 h-2">
                {session.questions.map((_, i) => (
                  <div 
                    key={i} 
                    className="flex-1 rounded-full transition-all"
                    style={{ 
                      background: i === currentQ ? 'var(--brand)' : i < currentQ ? 'var(--success)' : 'var(--surface-2)' 
                    }} 
                  />
                ))}
              </div>
            </div>

            {/* Question Card */}
            <Card style={{ padding: '2rem' }}>
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex gap-2 flex-wrap">
                  <Badge variant={TOPIC_COLOR[currentQuestion.topic] || 'default'}>
                    {currentQuestion.topic}
                  </Badge>
                  <Badge variant={DIFF_COLOR[currentQuestion.difficulty] || 'default'}>
                    {currentQuestion.difficulty}
                  </Badge>
                </div>
              </div>
              
              <p className="text-xl font-bold leading-relaxed mb-6" style={{ color: 'var(--text-primary)' }}>
                {currentQuestion.question}
              </p>
              
              {currentQuestion.hint && (
                <div className="mb-6">
                  <button 
                    onClick={() => setShowHint(!showHint)} 
                    className="text-sm font-medium flex items-center gap-2 hover:opacity-80 transition-opacity"
                    style={{ color: 'var(--brand)' }}
                  >
                    {showHint ? <><EyeOff size={16} /> Hide hint</> : <><Eye size={16} /> Show hint</>}
                  </button>
                  {showHint && (
                    <div className="mt-3 p-4 rounded-xl border animate-fade-in text-sm leading-relaxed" style={{ background: 'var(--brand-light)', borderColor: 'var(--brand)', color: 'var(--text-primary)' }}>
                      <strong>💡 Hint: </strong> {currentQuestion.hint}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3 mb-6">
                <label className="block text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Your Answer</label>
                <textarea
                  id="answer-input"
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  rows={6}
                  placeholder="Type your answer here…"
                  className="w-full rounded-xl text-base focus:outline-none focus:ring-2 transition-all"
                  style={{
                    background: 'var(--surface-1)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    padding: '1rem',
                    outlineColor: 'var(--brand)'
                  }}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <Button 
                  onClick={handlePrev} 
                  disabled={currentQ === 0} 
                  variant="outline"
                  leftIcon={<ChevronLeft size={16} />}
                  className="flex-1 sm:flex-none justify-center"
                >
                  Prev
                </Button>
                <Button
                  id="evaluate-answer-btn"
                  onClick={handleEvaluate}
                  disabled={evaluating || !answer.trim()}
                  variant="primary"
                  leftIcon={<Send size={16} />}
                  isLoading={evaluating}
                  loadingText="Evaluating…"
                  className="flex-1 justify-center"
                >
                  Evaluate Answer
                </Button>
                <Button 
                  onClick={handleNext} 
                  disabled={currentQ === session.questions.length - 1} 
                  variant="outline"
                  rightIcon={<ChevronRight size={16} />}
                  className="flex-1 sm:flex-none justify-center"
                >
                  Next
                </Button>
              </div>
              
              {evalError && <div className="mt-4"><ErrorState message={evalError} /></div>}
            </Card>

            {/* Evaluation Result */}
            {evalResult && (
              <Card className="animate-fade-in" style={{ border: '2px solid var(--brand)', padding: '2rem' }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Sparkles size={20} style={{ color: 'var(--brand)' }} />
                    AI Feedback
                  </h2>
                  <Badge variant="brand">AI Advisory</Badge>
                </div>
                
                <p className="text-xs italic mb-6 p-3 rounded-lg bg-surface-2 text-text-muted" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                  {evalResult.disclaimer}
                </p>

                {/* Score Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                  {[
                    { label: 'Relevance', val: evalResult.evaluation.relevance },
                    { label: 'Clarity', val: evalResult.evaluation.clarity },
                    { label: 'Tech Depth', val: evalResult.evaluation.technicalDepth },
                    { label: 'Completeness', val: evalResult.evaluation.completeness },
                    { label: 'Overall', val: evalResult.evaluation.overall },
                  ].map(({ label, val }) => (
                    <div key={label} className="rounded-xl p-4 text-center border" style={{ background: 'var(--surface-1)', borderColor: 'var(--border-subtle)' }}>
                      <div className="text-3xl font-black font-mono mb-1" style={{ color: val >= 8 ? 'var(--success)' : val >= 5 ? 'var(--warning)' : 'var(--error)' }}>
                        {val}
                      </div>
                      <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl p-6 mb-8 border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border-subtle)' }}>
                  <p className="text-base leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    {evalResult.evaluation.feedback}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-base font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--success)' }}>
                      <CheckCircle size={18} /> Strengths
                    </h3>
                    <ul className="space-y-3">
                      {evalResult.evaluation.strengths.map((s, i) => (
                        <li key={i} className="text-sm flex gap-3 items-start" style={{ color: 'var(--text-secondary)' }}>
                          <span style={{ color: 'var(--success)', marginTop: '2px' }}>•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-base font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--warning)' }}>
                      <Lightbulb size={18} /> Improvements
                    </h3>
                    <ul className="space-y-3">
                      {evalResult.evaluation.improvements.map((s, i) => (
                        <li key={i} className="text-sm flex gap-3 items-start" style={{ color: 'var(--text-secondary)' }}>
                          <span style={{ color: 'var(--warning)', marginTop: '2px' }}>•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
