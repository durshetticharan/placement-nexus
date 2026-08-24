import { useState, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getAssessment,
  createAssessment,
  updateAssessment,
  publishAssessment,
  archiveAssessment,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  type Assessment,
  type Question,
  type QuestionType,
  type AssessmentCategory,
  type Difficulty,
  type QuestionPayload,
  type TestCase,
} from '../../services/assessmentService';
import { getErrorMessage } from '../../utils/error';

const INPUT_STYLE =
  'w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500';
const LABEL_STYLE = 'block text-xs font-medium text-slate-300 mb-1';

export default function AssessmentBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [savingMeta, setSavingMeta] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Assessment Meta form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<AssessmentCategory>('APTITUDE');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [durationMins, setDurationMins] = useState<number>(30);
  const [passPercentage, setPassPercentage] = useState<number | ''>('');

  // Question Form State
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [qType, setQType] = useState<QuestionType>('MCQ_SINGLE');
  const [qText, setQText] = useState('');
  const [qTopic, setQTopic] = useState('');
  const [qDifficulty, setQDifficulty] = useState<Difficulty | ''>('');
  const [qMarks, setQMarks] = useState<number>(1);
  const [qStarterCode, setQStarterCode] = useState('');

  // MCQ Options
  const [mcqOptions, setMcqOptions] = useState<Array<{ text: string; isCorrect: boolean }>>([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
  ]);

  // Coding Test Cases
  const [testCases, setTestCases] = useState<TestCase[]>([
    { input: '', expectedOutput: '', isHidden: false },
  ]);

  const fetchAssessmentData = useCallback(async (assessmentId: string) => {
    try {
      setLoading(true);
      setError('');
      const data = await getAssessment(assessmentId);
      setAssessment(data);
      setTitle(data.title);
      setDescription(data.description || '');
      setCategory(data.category);
      setTopic(data.topic);
      setDifficulty(data.difficulty || '');
      setDurationMins(data.durationMins);
      setPassPercentage(data.passPercentage ?? '');
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to load assessment.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isNew && id) {
      fetchAssessmentData(id);
    }
  }, [id, isNew, fetchAssessmentData]);

  // Handle Assessment Meta Save
  const handleSaveMeta = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !topic.trim() || durationMins <= 0) {
      setError('Title, topic, and positive duration are required.');
      return;
    }

    try {
      setSavingMeta(true);
      setError('');
      setSuccessMsg('');

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        category,
        topic: topic.trim(),
        difficulty: difficulty || null,
        durationMins: Number(durationMins),
        passPercentage: passPercentage === '' ? null : Number(passPercentage),
      };

      if (isNew) {
        const created = await createAssessment(payload);
        setSuccessMsg('Assessment created as DRAFT! Now add questions below.');
        navigate(`/officer/assessments/${created.id}`, { replace: true });
      } else if (id) {
        const updated = await updateAssessment(id, payload);
        setAssessment(updated);
        setSuccessMsg('Assessment metadata updated successfully.');
      }
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to save assessment.'));
    } finally {
      setSavingMeta(false);
    }
  };

  // Reset Question Form
  const resetQuestionForm = () => {
    setEditingQuestionId(null);
    setQType('MCQ_SINGLE');
    setQText('');
    setQTopic('');
    setQDifficulty('');
    setQMarks(1);
    setQStarterCode('');
    setMcqOptions([
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
    ]);
    setTestCases([{ input: '', expectedOutput: '', isHidden: false }]);
  };

  // Populate Question Form for Editing
  const startEditQuestion = (q: Question) => {
    setEditingQuestionId(q.id);
    setQType(q.type);
    setQText(q.text);
    setQTopic(q.topic || '');
    setQDifficulty(q.difficulty || '');
    setQMarks(q.marks || 1);
    setQStarterCode(q.starterCode || '');

    if (q.options && q.options.length > 0) {
      setMcqOptions(q.options.map((o) => ({ text: o.text, isCorrect: !!o.isCorrect })));
    } else {
      setMcqOptions([
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
      ]);
    }

    if (q.testCases && q.testCases.length > 0) {
      setTestCases(q.testCases.map((tc) => ({ input: tc.input, expectedOutput: tc.expectedOutput, isHidden: !!tc.isHidden })));
    } else {
      setTestCases([{ input: '', expectedOutput: '', isHidden: false }]);
    }
  };

  // Save (Add or Update) Question
  const handleSaveQuestion = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || isNew) return;

    if (!qText.trim()) {
      setError('Question text is required.');
      return;
    }

    const payload: QuestionPayload = {
      type: qType,
      text: qText.trim(),
      topic: qTopic.trim() || null,
      difficulty: qDifficulty || null,
      marks: Number(qMarks),
    };

    if (qType === 'MCQ_SINGLE' || qType === 'MCQ_MULTIPLE') {
      const validOptions = mcqOptions.filter((o) => o.text.trim() !== '');
      if (validOptions.length < 2) {
        setError('MCQ questions require at least 2 non-empty options.');
        return;
      }
      const correctCount = validOptions.filter((o) => o.isCorrect).length;
      if (qType === 'MCQ_SINGLE' && correctCount !== 1) {
        setError('MCQ_SINGLE must have exactly 1 correct option selected.');
        return;
      }
      if (qType === 'MCQ_MULTIPLE' && correctCount < 1) {
        setError('MCQ_MULTIPLE must have at least 1 correct option selected.');
        return;
      }
      payload.options = validOptions;
    } else if (qType === 'CODING') {
      const validTestCases = testCases.filter((tc) => tc.input !== '' || tc.expectedOutput !== '');
      if (validTestCases.length === 0) {
        setError('CODING questions require at least 1 test case.');
        return;
      }
      payload.starterCode = qStarterCode;
      payload.testCases = validTestCases;
    }

    try {
      setError('');
      setSuccessMsg('');
      if (editingQuestionId) {
        await updateQuestion(editingQuestionId, payload);
        setSuccessMsg('Question updated successfully!');
      } else {
        await addQuestion(id, payload);
        setSuccessMsg('Question added successfully!');
      }
      resetQuestionForm();
      fetchAssessmentData(id);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to save question.'));
    }
  };

  // Delete Question
  const handleDeleteQuestion = async (qId: string) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      setError('');
      await deleteQuestion(qId);
      setSuccessMsg('Question deleted.');
      if (id) fetchAssessmentData(id);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to delete question.'));
    }
  };

  // Publish Assessment
  const handlePublish = async () => {
    if (!id || !assessment) return;
    if ((assessment.questions?.length ?? 0) === 0) {
      setError('Cannot publish an assessment with zero questions.');
      return;
    }
    if (!window.confirm('Are you sure you want to PUBLISH this assessment? Students will immediately be able to take it.')) {
      return;
    }
    try {
      setError('');
      const updated = await publishAssessment(id);
      setAssessment(updated);
      setSuccessMsg('Assessment PUBLISHED successfully!');
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to publish assessment.'));
    }
  };

  // Archive Assessment
  const handleArchive = async () => {
    if (!id || !assessment) return;
    if (!window.confirm('Are you sure you want to ARCHIVE this assessment? Students will no longer see it.')) {
      return;
    }
    try {
      setError('');
      const updated = await archiveAssessment(id);
      setAssessment(updated);
      setSuccessMsg('Assessment ARCHIVED.');
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to archive assessment.'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        Loading assessment builder...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
          <div>
            <Link to="/officer/assessments" className="text-slate-400 hover:text-white text-xs mb-1 block">
              ← Back to Assessments
            </Link>
            <h1 className="text-2xl font-bold text-white">
              {isNew ? 'Create New Assessment' : `Assessment: ${assessment?.title || 'Builder'}`}
            </h1>
            {!isNew && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-400">Status:</span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                    assessment?.status === 'PUBLISHED'
                      ? 'bg-emerald-900/50 text-emerald-300 border-emerald-600'
                      : assessment?.status === 'ARCHIVED'
                      ? 'bg-slate-800 text-slate-400 border-slate-700'
                      : 'bg-amber-900/50 text-amber-300 border-amber-600'
                  }`}
                >
                  {assessment?.status}
                </span>
              </div>
            )}
          </div>

          {!isNew && assessment && (
            <div className="flex items-center gap-3">
              {assessment.status === 'DRAFT' && (
                <button
                  onClick={handlePublish}
                  disabled={(assessment.questions?.length ?? 0) === 0}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors shadow"
                >
                  🚀 Publish Assessment
                </button>
              )}
              {assessment.status === 'PUBLISHED' && (
                <button
                  onClick={handleArchive}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs rounded-lg transition-colors border border-slate-600"
                >
                  📦 Archive Assessment
                </button>
              )}
            </div>
          )}
        </div>

        {/* Global Alerts */}
        {error && (
          <div className="p-4 bg-red-900/40 border border-red-500 rounded-xl text-red-300 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-white ml-4">✕</button>
          </div>
        )}
        {successMsg && (
          <div className="p-4 bg-emerald-900/40 border border-emerald-500 rounded-xl text-emerald-300 text-sm flex items-center justify-between">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-white ml-4">✕</button>
          </div>
        )}

        {/* SECTION 1: Assessment Metadata */}
        <form onSubmit={handleSaveMeta} className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4 shadow-xl">
          <h2 className="text-lg font-bold text-white border-b border-slate-700 pb-2">
            1. Assessment Metadata
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={LABEL_STYLE}>Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Data Structures & Algorithms Qualifier"
                required
                className={INPUT_STYLE}
              />
            </div>

            <div>
              <label className={LABEL_STYLE}>Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AssessmentCategory)}
                className={INPUT_STYLE}
              >
                <option value="APTITUDE">Aptitude</option>
                <option value="TECHNICAL">Technical</option>
                <option value="CODING">Coding</option>
              </select>
            </div>

            <div>
              <label className={LABEL_STYLE}>Topic *</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Trees & Graphs, DBMS, Quantitative"
                required
                className={INPUT_STYLE}
              />
            </div>

            <div>
              <label className={LABEL_STYLE}>Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty | '')}
                className={INPUT_STYLE}
              >
                <option value="">(Optional) None</option>
                <option value="EASY">EASY</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HARD">HARD</option>
              </select>
            </div>

            <div>
              <label className={LABEL_STYLE}>Duration (Minutes) *</label>
              <input
                type="number"
                min={1}
                value={durationMins}
                onChange={(e) => setDurationMins(Number(e.target.value))}
                required
                className={INPUT_STYLE}
              />
            </div>

            <div>
              <label className={LABEL_STYLE}>Pass Percentage (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={passPercentage}
                onChange={(e) => setPassPercentage(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 60"
                className={INPUT_STYLE}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_STYLE}>Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instructions or details for students..."
              className={INPUT_STYLE}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingMeta}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition-colors"
            >
              {savingMeta ? 'Saving...' : isNew ? 'Create Draft & Proceed to Questions →' : 'Update Metadata'}
            </button>
          </div>
        </form>

        {/* SECTION 2: Questions Builder (Only shown for saved assessments) */}
        {!isNew && (
          <div className="space-y-6">
            {/* Question Form */}
            <form onSubmit={handleSaveQuestion} className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <h2 className="text-lg font-bold text-white">
                  {editingQuestionId ? '2. Edit Question' : '2. Add New Question'}
                </h2>
                {editingQuestionId && (
                  <button
                    type="button"
                    onClick={resetQuestionForm}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label className={LABEL_STYLE}>Question Type *</label>
                  <select
                    value={qType}
                    onChange={(e) => setQType(e.target.value as QuestionType)}
                    className={INPUT_STYLE}
                  >
                    <option value="MCQ_SINGLE">MCQ (Single Answer)</option>
                    <option value="MCQ_MULTIPLE">MCQ (Multiple Answer)</option>
                    <option value="CODING">Coding Problem</option>
                    <option value="DESCRIPTIVE">Descriptive Text</option>
                  </select>
                </div>

                <div>
                  <label className={LABEL_STYLE}>Marks *</label>
                  <input
                    type="number"
                    min={1}
                    value={qMarks}
                    onChange={(e) => setQMarks(Number(e.target.value))}
                    required
                    className={INPUT_STYLE}
                  />
                </div>

                <div>
                  <label className={LABEL_STYLE}>Sub-Topic</label>
                  <input
                    type="text"
                    value={qTopic}
                    onChange={(e) => setQTopic(e.target.value)}
                    placeholder="e.g. Binary Trees"
                    className={INPUT_STYLE}
                  />
                </div>

                <div>
                  <label className={LABEL_STYLE}>Difficulty</label>
                  <select
                    value={qDifficulty}
                    onChange={(e) => setQDifficulty(e.target.value as Difficulty | '')}
                    className={INPUT_STYLE}
                  >
                    <option value="">Default</option>
                    <option value="EASY">EASY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HARD">HARD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={LABEL_STYLE}>Question Text *</label>
                <textarea
                  rows={3}
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="Enter problem statement or question..."
                  required
                  className={INPUT_STYLE}
                />
              </div>

              {/* Dynamic Inputs per Type */}
              {(qType === 'MCQ_SINGLE' || qType === 'MCQ_MULTIPLE') && (
                <div className="space-y-3 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                      Options & Correct Selection ({qType === 'MCQ_SINGLE' ? 'Pick exactly 1' : 'Pick at least 1'})
                    </label>
                    <button
                      type="button"
                      onClick={() => setMcqOptions([...mcqOptions, { text: '', isCorrect: false }])}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      + Add Option
                    </button>
                  </div>

                  {mcqOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      {qType === 'MCQ_SINGLE' ? (
                        <input
                          type="radio"
                          name="correctOptionRadio"
                          checked={opt.isCorrect}
                          onChange={() =>
                            setMcqOptions(
                              mcqOptions.map((o, i) => ({ ...o, isCorrect: i === idx }))
                            )
                          }
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                        />
                      ) : (
                        <input
                          type="checkbox"
                          checked={opt.isCorrect}
                          onChange={(e) =>
                            setMcqOptions(
                              mcqOptions.map((o, i) =>
                                i === idx ? { ...o, isCorrect: e.target.checked } : o
                              )
                            )
                          }
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                      )}
                      <input
                        type="text"
                        placeholder={`Option ${idx + 1}...`}
                        value={opt.text}
                        onChange={(e) =>
                          setMcqOptions(
                            mcqOptions.map((o, i) => (i === idx ? { ...o, text: e.target.value } : o))
                          )
                        }
                        className={INPUT_STYLE}
                      />
                      {mcqOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setMcqOptions(mcqOptions.filter((_, i) => i !== idx))}
                          className="text-red-400 hover:text-red-300 text-xs px-2"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {qType === 'CODING' && (
                <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                  <div>
                    <label className={LABEL_STYLE}>Starter Code (Optional)</label>
                    <textarea
                      rows={3}
                      value={qStarterCode}
                      onChange={(e) => setQStarterCode(e.target.value)}
                      placeholder="function solution(arr) { ... }"
                      className={`${INPUT_STYLE} font-mono text-xs`}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                        Test Cases
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setTestCases([...testCases, { input: '', expectedOutput: '', isHidden: false }])
                        }
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        + Add Test Case
                      </button>
                    </div>

                    {testCases.map((tc, idx) => (
                      <div key={idx} className="p-3 bg-slate-800 rounded border border-slate-700 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-400">Test Case #{idx + 1}</span>
                          <div className="flex items-center gap-3">
                            <label className="text-xs text-slate-300 flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={tc.isHidden}
                                onChange={(e) =>
                                  setTestCases(
                                    testCases.map((t, i) =>
                                      i === idx ? { ...t, isHidden: e.target.checked } : t
                                    )
                                  )
                                }
                                className="rounded"
                              />
                              Hidden Test Case
                            </label>
                            {testCases.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setTestCases(testCases.filter((_, i) => i !== idx))}
                                className="text-red-400 hover:text-red-300 text-xs"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                          <input
                            type="text"
                            placeholder="Input..."
                            value={tc.input}
                            onChange={(e) =>
                              setTestCases(
                                testCases.map((t, i) => (i === idx ? { ...t, input: e.target.value } : t))
                              )
                            }
                            className={`${INPUT_STYLE} font-mono text-xs`}
                          />
                          <input
                            type="text"
                            placeholder="Expected Output..."
                            value={tc.expectedOutput}
                            onChange={(e) =>
                              setTestCases(
                                testCases.map((t, i) =>
                                  i === idx ? { ...t, expectedOutput: e.target.value } : t
                                )
                              )
                            }
                            className={`${INPUT_STYLE} font-mono text-xs`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg transition-colors"
                >
                  {editingQuestionId ? 'Update Question' : '+ Add Question'}
                </button>
              </div>
            </form>

            {/* Questions List */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4 shadow-xl">
              <h2 className="text-lg font-bold text-white border-b border-slate-700 pb-2">
                Added Questions ({assessment?.questions?.length || 0})
              </h2>

              {(!assessment?.questions || assessment.questions.length === 0) ? (
                <p className="text-slate-400 text-sm py-4 text-center">
                  No questions added yet. Use the form above to add questions.
                </p>
              ) : (
                <div className="space-y-3">
                  {assessment.questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-4 bg-slate-900/60 rounded-lg border border-slate-700 flex flex-col md:flex-row md:items-start justify-between gap-4"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-bold text-indigo-400 font-mono">Q{idx + 1}</span>
                          <span className="px-2 py-0.5 rounded bg-indigo-900/50 text-indigo-300 border border-indigo-700 font-semibold">
                            {q.type}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                            {q.marks} {q.marks === 1 ? 'mark' : 'marks'}
                          </span>
                          {q.topic && (
                            <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                              Topic: {q.topic}
                            </span>
                          )}
                        </div>

                        <p className="text-slate-200 text-sm font-medium whitespace-pre-wrap">{q.text}</p>

                        {/* Options preview for MCQ */}
                        {q.options && q.options.length > 0 && (
                          <div className="grid gap-1 sm:grid-cols-2 pt-1 text-xs">
                            {q.options.map((opt, oIdx) => (
                              <div
                                key={oIdx}
                                className={`px-2.5 py-1 rounded border ${
                                  opt.isCorrect
                                    ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700 font-medium'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                              >
                                {opt.isCorrect ? '✓ ' : '• '}{opt.text}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-start">
                        <button
                          onClick={() => startEditQuestion(q)}
                          className="px-3 py-1 text-xs text-indigo-300 hover:text-white bg-indigo-900/40 hover:bg-indigo-800/60 rounded border border-indigo-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="px-3 py-1 text-xs text-red-400 hover:text-red-300 bg-red-900/30 hover:bg-red-800/50 rounded border border-red-800 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
