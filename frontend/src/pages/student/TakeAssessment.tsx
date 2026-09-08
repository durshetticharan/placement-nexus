import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  startAttempt,
  saveAnswer,
  submitAttempt,
  type AssessmentAttempt,
  type Question,
  type SaveAnswerPayload,
} from '../../services/assessmentService';
import { getErrorMessage } from '../../utils/error';
import AppLayout from '../../components/layout/AppLayout';
import { LoadingState, ErrorState, Card, Button } from '../../components/ui';
import { Clock, Send, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface AnswerState {
  selectedOptionId?: string | null;
  selectedOptionIds?: string[];
  freeTextAnswer?: string | null;
}

export default function TakeAssessment() {
  const { id: assessmentId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingStatus, setSavingStatus] = useState<Record<string, 'saving' | 'saved' | 'error'>>({});
  const [error, setError] = useState('');
  const [remainingSecs, setRemainingSecs] = useState<number | null>(null);

  const submittingRef = useRef(false);

  // Initialize attempt
  const init = useCallback(async (aId: string) => {
    try {
      setLoading(true);
      setError('');
      const data = await startAttempt(aId);
      setAttempt(data.attempt);
      setQuestions(data.questions);

      // Populate existing answers if resuming
      const initialAnswers: Record<string, AnswerState> = {};
      if (data.attempt.answers && data.attempt.answers.length > 0) {
        for (const ans of data.attempt.answers) {
          const q = data.questions.find((item) => item.id === ans.questionId);
          if (q) {
            if (q.type === 'MCQ_MULTIPLE' && ans.freeTextAnswer) {
              try {
                const parsed = JSON.parse(ans.freeTextAnswer);
                initialAnswers[ans.questionId] = { selectedOptionIds: Array.isArray(parsed) ? parsed : [] };
              } catch {
                initialAnswers[ans.questionId] = { selectedOptionIds: [] };
              }
            } else {
              initialAnswers[ans.questionId] = {
                selectedOptionId: ans.selectedOptionId ?? null,
                freeTextAnswer: ans.freeTextAnswer ?? null,
              };
            }
          }
        }
      }
      setAnswers(initialAnswers);

      // Compute remaining duration
      const durationMins = data.attempt.assessment?.durationMins || 30;
      const startedAt = new Date(data.attempt.startedAt).getTime();
      const now = Date.now();
      const elapsedSecs = Math.floor((now - startedAt) / 1000);
      const totalSecs = durationMins * 60;
      const left = Math.max(0, totalSecs - elapsedSecs);
      setRemainingSecs(left);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to start assessment.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (assessmentId) {
      init(assessmentId);
    }
  }, [assessmentId, init]);

  // Submit Handler
  const handleSubmit = useCallback(async () => {
    if (!attempt || submittingRef.current) return;
    try {
      submittingRef.current = true;
      setSubmitting(true);
      setError('');
      await submitAttempt(attempt.id);
      navigate(`/student/attempts/${attempt.id}/result`, { replace: true });
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to submit assessment.'));
      setSubmitting(false);
      submittingRef.current = false;
    }
  }, [attempt, navigate]);

  // Countdown timer
  useEffect(() => {
    if (remainingSecs === null || submitting) return;

    if (remainingSecs <= 0) {
      alert('Time limit expired! Auto-submitting your assessment.');
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setRemainingSecs((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSecs, submitting, handleSubmit]);

  // Auto-Save Answer
  const triggerAutoSave = async (questionId: string, answerState: AnswerState) => {
    if (!attempt) return;
    try {
      setSavingStatus((prev) => ({ ...prev, [questionId]: 'saving' }));
      const payload: SaveAnswerPayload = { questionId };

      if (answerState.selectedOptionId !== undefined) {
        payload.selectedOptionId = answerState.selectedOptionId;
      }
      if (answerState.selectedOptionIds !== undefined) {
        payload.selectedOptionIds = answerState.selectedOptionIds;
      }
      if (answerState.freeTextAnswer !== undefined) {
        payload.freeTextAnswer = answerState.freeTextAnswer;
      }

      await saveAnswer(attempt.id, payload);
      setSavingStatus((prev) => ({ ...prev, [questionId]: 'saved' }));
    } catch (err: any) {
      setSavingStatus((prev) => ({ ...prev, [questionId]: 'error' }));
    }
  };

  // Input Handlers
  const handleMcqSingleSelect = (questionId: string, optionId: string) => {
    const updated = { ...answers, [questionId]: { selectedOptionId: optionId } };
    setAnswers(updated);
    triggerAutoSave(questionId, { selectedOptionId: optionId });
  };

  const handleMcqMultipleToggle = (questionId: string, optionId: string) => {
    const current = answers[questionId]?.selectedOptionIds || [];
    const updatedIds = current.includes(optionId)
      ? current.filter((id) => id !== optionId)
      : [...current, optionId];

    const updated = { ...answers, [questionId]: { selectedOptionIds: updatedIds } };
    setAnswers(updated);
    triggerAutoSave(questionId, { selectedOptionIds: updatedIds });
  };

  const handleFreeTextChange = (questionId: string, text: string) => {
    const updated = { ...answers, [questionId]: { freeTextAnswer: text } };
    setAnswers(updated);
    triggerAutoSave(questionId, { freeTextAnswer: text });
  };

  const formatTimer = (totalSecs: number | null) => {
    if (totalSecs === null) return '--:--';
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <AppLayout>
        <LoadingState message="Initializing assessment exam…" />
      </AppLayout>
    );
  }

  if (error && !attempt) {
    return (
      <AppLayout>
        <ErrorState message={error} />
        <div className="mt-4 flex justify-center">
          <Button onClick={() => navigate('/student/assessments')} variant="outline">
            Return to Assessment List
          </Button>
        </div>
      </AppLayout>
    );
  }

  const currentQ = questions[currentIndex];
  const totalQ = questions.length;
  const currentAnswer = currentQ ? answers[currentQ.id] : undefined;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header bar with timer and title */}
        <Card style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="text-lg font-bold line-clamp-1" style={{ color: 'var(--text-primary)' }}>
              {attempt?.assessment.title}
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Category: {attempt?.assessment.category} • Topic: {attempt?.assessment.topic}
            </p>
          </div>

          <div className="flex items-center gap-6">
            {/* Timer display */}
            <div
              className={`px-4 py-2 rounded-xl font-mono text-lg font-bold border flex items-center gap-2 ${
                (remainingSecs ?? 0) < 300
                  ? 'bg-red-900/50 text-red-300 border-red-600 animate-pulse'
                  : ''
              }`}
              style={(remainingSecs ?? 0) >= 300 ? { 
                background: 'var(--surface-2)', 
                color: 'var(--brand-light)', 
                borderColor: 'var(--border-subtle)' 
              } : {}}
            >
              <Clock size={20} />
              <span>{formatTimer(remainingSecs)}</span>
            </div>

            <Button
              onClick={() => {
                if (window.confirm('Are you sure you want to submit your assessment now?')) {
                  handleSubmit();
                }
              }}
              disabled={submitting}
              variant="primary"
              leftIcon={<Send size={16} />}
            >
              {submitting ? 'Submitting...' : 'Submit Assessment'}
            </Button>
          </div>
        </Card>

        {error && <ErrorState message={error} />}

        {/* Main content grid */}
        <div className="grid gap-6 md:grid-cols-4">
          {/* Left 3 cols: Question view */}
          <div className="md:col-span-3">
            <Card style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '500px' }}>
              {currentQ ? (
                <div className="flex-1 flex flex-col">
                  {/* Question metadata header */}
                  <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-2)' }}>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 font-mono text-xs font-bold rounded-full" style={{ background: 'var(--brand)', color: 'white' }}>
                        Question {currentIndex + 1} of {totalQ}
                      </span>
                      <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                        {currentQ.marks} {currentQ.marks === 1 ? 'mark' : 'marks'}
                      </span>
                    </div>

                    <div className="text-xs font-medium flex items-center gap-1">
                      {savingStatus[currentQ.id] === 'saving' && (
                        <><Clock size={14} style={{ color: 'var(--warning)' }} /> <span style={{ color: 'var(--warning)' }}>Saving...</span></>
                      )}
                      {savingStatus[currentQ.id] === 'saved' && (
                        <><CheckCircle2 size={14} style={{ color: 'var(--success)' }} /> <span style={{ color: 'var(--success)' }}>Saved</span></>
                      )}
                      {savingStatus[currentQ.id] === 'error' && (
                        <><AlertCircle size={14} style={{ color: 'var(--error)' }} /> <span style={{ color: 'var(--error)' }}>Save failed</span></>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="p-6">
                    <div className="text-lg font-medium whitespace-pre-wrap leading-relaxed mb-6" style={{ color: 'var(--text-primary)' }}>
                      {currentQ.text}
                    </div>

                    {/* MCQ_SINGLE Input */}
                    {currentQ.type === 'MCQ_SINGLE' && (
                      <div className="space-y-3">
                        {currentQ.options.map((opt) => {
                          const isSelected = currentAnswer?.selectedOptionId === opt.id;
                          return (
                            <label
                              key={opt.id}
                              className="flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors"
                              style={{
                                background: isSelected ? 'var(--surface-2)' : 'var(--surface-1)',
                                borderColor: isSelected ? 'var(--brand)' : 'var(--border-subtle)',
                              }}
                            >
                              <input
                                type="radio"
                                name={`q_${currentQ.id}`}
                                checked={isSelected}
                                onChange={() => opt.id && handleMcqSingleSelect(currentQ.id, opt.id)}
                                className="w-5 h-5"
                                style={{ accentColor: 'var(--brand)' }}
                              />
                              <span className="text-base" style={{ color: 'var(--text-primary)', fontWeight: isSelected ? 600 : 400 }}>{opt.text}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* MCQ_MULTIPLE Input */}
                    {currentQ.type === 'MCQ_MULTIPLE' && (
                      <div className="space-y-3">
                        <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                          Select all correct choices:
                        </p>
                        {currentQ.options.map((opt) => {
                          const selectedIds = currentAnswer?.selectedOptionIds || [];
                          const isSelected = opt.id ? selectedIds.includes(opt.id) : false;
                          return (
                            <label
                              key={opt.id}
                              className="flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors"
                              style={{
                                background: isSelected ? 'var(--surface-2)' : 'var(--surface-1)',
                                borderColor: isSelected ? 'var(--brand)' : 'var(--border-subtle)',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => opt.id && handleMcqMultipleToggle(currentQ.id, opt.id)}
                                className="w-5 h-5 rounded"
                                style={{ accentColor: 'var(--brand)' }}
                              />
                              <span className="text-base" style={{ color: 'var(--text-primary)', fontWeight: isSelected ? 600 : 400 }}>{opt.text}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* CODING Input */}
                    {currentQ.type === 'CODING' && (
                      <div className="space-y-4">
                        {currentQ.starterCode && (
                          <div>
                            <label className="block text-xs font-bold uppercase mb-2" style={{ color: 'var(--text-muted)' }}>
                              Starter Template / Signature
                            </label>
                            <pre className="p-4 rounded-xl font-mono text-sm overflow-x-auto" style={{ background: '#0f172a', border: '1px solid #1e293b', color: '#34d399' }}>
                              {currentQ.starterCode}
                            </pre>
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-bold uppercase mb-2" style={{ color: 'var(--text-muted)' }}>
                            Write your solution code below:
                          </label>
                          <textarea
                            rows={10}
                            value={currentAnswer?.freeTextAnswer || ''}
                            onChange={(e) => handleFreeTextChange(currentQ.id, e.target.value)}
                            placeholder="// Type code solution here..."
                            className="w-full p-4 rounded-xl font-mono text-sm focus:outline-none focus:ring-2"
                            style={{ 
                              background: '#020617', 
                              border: '1px solid #1e293b', 
                              color: '#34d399',
                              outlineColor: 'var(--brand)'
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* DESCRIPTIVE Input */}
                    {currentQ.type === 'DESCRIPTIVE' && (
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase mb-2" style={{ color: 'var(--text-muted)' }}>
                          Your Response:
                        </label>
                        <textarea
                          rows={8}
                          value={currentAnswer?.freeTextAnswer || ''}
                          onChange={(e) => handleFreeTextChange(currentQ.id, e.target.value)}
                          placeholder="Type your explanation or response..."
                          className="w-full p-4 rounded-xl text-base focus:outline-none focus:ring-2"
                          style={{ 
                            background: 'var(--surface-1)', 
                            border: '1px solid var(--border-subtle)', 
                            color: 'var(--text-primary)',
                            outlineColor: 'var(--brand)'
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8">
                  <p className="text-center" style={{ color: 'var(--text-muted)' }}>No question selected.</p>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="px-6 py-4 flex items-center justify-between mt-auto" style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--surface-2)' }}>
                <Button
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  variant="outline"
                  leftIcon={<ChevronLeft size={16} />}
                >
                  Previous
                </Button>

                <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>
                  {currentIndex + 1} / {totalQ}
                </span>

                <Button
                  onClick={() => setCurrentIndex((prev) => Math.min(totalQ - 1, prev + 1))}
                  disabled={currentIndex === totalQ - 1}
                  variant="outline"
                  rightIcon={<ChevronRight size={16} />}
                >
                  Next
                </Button>
              </div>
            </Card>
          </div>

          {/* Right 1 col: Question Palette */}
          <div>
            <Card className="sticky top-24" style={{ padding: '1.5rem' }}>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-4 pb-2" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
                Question Palette
              </h3>
              <div className="grid grid-cols-5 gap-2 mb-6">
                {questions.map((q, idx) => {
                  const ans = answers[q.id];
                  const hasAnswer =
                    ans?.selectedOptionId ||
                    (ans?.selectedOptionIds && ans.selectedOptionIds.length > 0) ||
                    (ans?.freeTextAnswer && ans.freeTextAnswer.trim() !== '');

                  const isCurrent = idx === currentIndex;

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className="h-10 w-full rounded-lg font-mono text-sm font-bold transition-all flex items-center justify-center"
                      style={{
                        background: hasAnswer ? 'var(--success)' : (isCurrent ? 'var(--surface-2)' : 'var(--surface-1)'),
                        color: hasAnswer ? 'white' : 'var(--text-primary)',
                        border: isCurrent && !hasAnswer ? '2px solid var(--brand)' : '1px solid var(--border-subtle)',
                        boxShadow: isCurrent ? '0 0 0 2px var(--surface-1), 0 0 0 4px var(--brand)' : 'none',
                        zIndex: isCurrent ? 1 : 0
                      }}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-3 pt-4 border-t text-sm font-medium" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded" style={{ background: 'var(--success)' }} />
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded border" style={{ background: 'var(--surface-1)', borderColor: 'var(--border-subtle)' }} />
                  <span>Unanswered</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded border-2" style={{ background: 'var(--surface-1)', borderColor: 'var(--brand)' }} />
                  <span>Current Question</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
