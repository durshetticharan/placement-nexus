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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        Initializing assessment exam...
      </div>
    );
  }

  if (error && !attempt) {
    return (
      <div className="min-h-screen bg-slate-900 p-8 flex flex-col items-center justify-center space-y-4">
        <div className="p-4 bg-red-900/40 border border-red-500 rounded-xl text-red-300 text-sm max-w-md w-full">
          {error}
        </div>
        <button
          onClick={() => navigate('/student/assessments')}
          className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700"
        >
          Return to Assessment List
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const totalQ = questions.length;
  const currentAnswer = currentQ ? answers[currentQ.id] : undefined;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Header bar with timer and title */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-lg">
        <div>
          <h1 className="text-lg font-bold text-white line-clamp-1">
            {attempt?.assessment.title}
          </h1>
          <p className="text-slate-400 text-xs">
            Category: {attempt?.assessment.category} • Topic: {attempt?.assessment.topic}
          </p>
        </div>

        <div className="flex items-center gap-6">
          {/* Timer display */}
          <div
            className={`px-4 py-2 rounded-xl font-mono text-lg font-bold border flex items-center gap-2 ${
              (remainingSecs ?? 0) < 300
                ? 'bg-red-900/50 text-red-300 border-red-600 animate-pulse'
                : 'bg-slate-700 text-emerald-400 border-slate-600'
            }`}
          >
            <span>⏱</span>
            <span>{formatTimer(remainingSecs)}</span>
          </div>

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to submit your assessment now?')) {
                handleSubmit();
              }
            }}
            disabled={submitting}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm rounded-lg shadow transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Assessment'}
          </button>
        </div>
      </header>

      {error && (
        <div className="p-4 m-4 bg-red-900/40 border border-red-500 rounded-xl text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Main content grid */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 grid gap-6 md:grid-cols-4">
        {/* Left 3 cols: Question view */}
        <div className="md:col-span-3 bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col justify-between shadow-xl">
          {currentQ ? (
            <div className="space-y-6">
              {/* Question metadata header */}
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-indigo-900/60 text-indigo-300 border border-indigo-700 font-mono text-xs font-bold rounded-full">
                    Question {currentIndex + 1} of {totalQ}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    {currentQ.marks} {currentQ.marks === 1 ? 'mark' : 'marks'}
                  </span>
                </div>

                <div className="text-xs">
                  {savingStatus[currentQ.id] === 'saving' && (
                    <span className="text-amber-400">Saving...</span>
                  )}
                  {savingStatus[currentQ.id] === 'saved' && (
                    <span className="text-emerald-400">✓ Saved</span>
                  )}
                  {savingStatus[currentQ.id] === 'error' && (
                    <span className="text-red-400">⚠️ Save failed</span>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <div className="text-base text-slate-100 font-medium whitespace-pre-wrap leading-relaxed">
                {currentQ.text}
              </div>

              {/* MCQ_SINGLE Input */}
              {currentQ.type === 'MCQ_SINGLE' && (
                <div className="space-y-3 pt-2">
                  {currentQ.options.map((opt) => {
                    const isSelected = currentAnswer?.selectedOptionId === opt.id;
                    return (
                      <label
                        key={opt.id}
                        className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-indigo-900/40 border-indigo-500 text-white font-medium shadow-md'
                            : 'bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-700/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q_${currentQ.id}`}
                          checked={isSelected}
                          onChange={() => opt.id && handleMcqSingleSelect(currentQ.id, opt.id)}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm">{opt.text}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* MCQ_MULTIPLE Input */}
              {currentQ.type === 'MCQ_MULTIPLE' && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">
                    Select all correct choices:
                  </p>
                  {currentQ.options.map((opt) => {
                    const selectedIds = currentAnswer?.selectedOptionIds || [];
                    const isSelected = opt.id ? selectedIds.includes(opt.id) : false;
                    return (
                      <label
                        key={opt.id}
                        className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-indigo-900/40 border-indigo-500 text-white font-medium shadow-md'
                            : 'bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-700/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => opt.id && handleMcqMultipleToggle(currentQ.id, opt.id)}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm">{opt.text}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* CODING Input */}
              {currentQ.type === 'CODING' && (
                <div className="space-y-4 pt-2">
                  {currentQ.starterCode && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        Starter Template / Signature
                      </label>
                      <pre className="p-3 bg-slate-900 border border-slate-700 rounded-lg font-mono text-xs text-emerald-400 overflow-x-auto">
                        {currentQ.starterCode}
                      </pre>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Write your solution code below:
                    </label>
                    <textarea
                      rows={10}
                      value={currentAnswer?.freeTextAnswer || ''}
                      onChange={(e) => handleFreeTextChange(currentQ.id, e.target.value)}
                      placeholder="// Type code solution here..."
                      className="w-full p-4 bg-slate-950 border border-slate-700 rounded-xl text-emerald-300 font-mono text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* DESCRIPTIVE Input */}
              {currentQ.type === 'DESCRIPTIVE' && (
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Response:
                  </label>
                  <textarea
                    rows={6}
                    value={currentAnswer?.freeTextAnswer || ''}
                    onChange={(e) => handleFreeTextChange(currentQ.id, e.target.value)}
                    placeholder="Type your explanation or response..."
                    className="w-full p-4 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-8">No question selected.</p>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-700">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-200 text-sm font-semibold rounded-lg transition-colors"
            >
              ← Previous
            </button>

            <span className="text-xs text-slate-400">
              {currentIndex + 1} / {totalQ}
            </span>

            <button
              onClick={() => setCurrentIndex((prev) => Math.min(totalQ - 1, prev + 1))}
              disabled={currentIndex === totalQ - 1}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-200 text-sm font-semibold rounded-lg transition-colors"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Right 1 col: Question Palette */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col justify-between shadow-xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider border-b border-slate-700 pb-2">
              Question Palette
            </h3>
            <div className="grid grid-cols-5 gap-2">
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
                    className={`h-9 w-full rounded-lg font-mono text-xs font-bold transition-all ${
                      isCurrent
                        ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-800 scale-105'
                        : ''
                    } ${
                      hasAnswer
                        ? 'bg-emerald-700 text-white hover:bg-emerald-600'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-700 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-3 h-3 rounded bg-emerald-700 inline-block" />
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-3 h-3 rounded bg-slate-700 inline-block" />
              <span>Unanswered</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
