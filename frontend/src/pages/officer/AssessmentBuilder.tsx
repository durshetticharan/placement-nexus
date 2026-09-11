import { useState, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import AppLayout from '../../components/layout/AppLayout';
import { PageHeader, Card, Button, Badge, LoadingState } from '../../components/ui';
import { FileText, Save, ArrowRight, XCircle, CheckCircle, Trash2, Rocket, Archive, Plus, List as ListIcon, X as CloseIcon } from 'lucide-react';

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

let toastCounter = 0;

export default function AssessmentBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [savingMeta, setSavingMeta] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

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

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const dismissToast = (toastId: number) => setToasts((prev) => prev.filter((t) => t.id !== toastId));

  const fetchAssessmentData = useCallback(async (assessmentId: string) => {
    try {
      setLoading(true);
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
      addToast('error', getErrorMessage(err, 'Failed to load assessment.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isNew && id) {
      const timer = setTimeout(() => {
        fetchAssessmentData(id);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [id, isNew, fetchAssessmentData]);

  // Handle Assessment Meta Save
  const handleSaveMeta = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !topic.trim() || durationMins <= 0) {
      addToast('error', 'Title, topic, and positive duration are required.');
      return;
    }

    try {
      setSavingMeta(true);

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
        addToast('success', 'Assessment created as DRAFT! Now add questions below.');
        navigate(`/officer/assessments/${created.id}`, { replace: true });
      } else if (id) {
        const updated = await updateAssessment(id, payload);
        setAssessment(updated);
        addToast('success', 'Assessment metadata updated successfully.');
      }
    } catch (err: any) {
      addToast('error', getErrorMessage(err, 'Failed to save assessment.'));
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
    
    // Scroll to form
    document.getElementById('question-builder')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Save (Add or Update) Question
  const handleSaveQuestion = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || isNew) return;

    if (!qText.trim()) {
      addToast('error', 'Question text is required.');
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
        addToast('error', 'MCQ questions require at least 2 non-empty options.');
        return;
      }
      const correctCount = validOptions.filter((o) => o.isCorrect).length;
      if (qType === 'MCQ_SINGLE' && correctCount !== 1) {
        addToast('error', 'MCQ_SINGLE must have exactly 1 correct option selected.');
        return;
      }
      if (qType === 'MCQ_MULTIPLE' && correctCount < 1) {
        addToast('error', 'MCQ_MULTIPLE must have at least 1 correct option selected.');
        return;
      }
      payload.options = validOptions;
    } else if (qType === 'CODING') {
      const validTestCases = testCases.filter((tc) => tc.input !== '' || tc.expectedOutput !== '');
      if (validTestCases.length === 0) {
        addToast('error', 'CODING questions require at least 1 test case.');
        return;
      }
      payload.starterCode = qStarterCode;
      payload.testCases = validTestCases;
    }

    try {
      if (editingQuestionId) {
        await updateQuestion(editingQuestionId, payload);
        addToast('success', 'Question updated successfully!');
      } else {
        await addQuestion(id, payload);
        addToast('success', 'Question added successfully!');
      }
      resetQuestionForm();
      fetchAssessmentData(id);
    } catch (err: any) {
      addToast('error', getErrorMessage(err, 'Failed to save question.'));
    }
  };

  // Delete Question
  const handleDeleteQuestion = async (qId: string) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await deleteQuestion(qId);
      addToast('success', 'Question deleted.');
      if (id) fetchAssessmentData(id);
    } catch (err: any) {
      addToast('error', getErrorMessage(err, 'Failed to delete question.'));
    }
  };

  // Publish Assessment
  const handlePublish = async () => {
    if (!id || !assessment) return;
    if ((assessment.questions?.length ?? 0) === 0) {
      addToast('error', 'Cannot publish an assessment with zero questions.');
      return;
    }
    if (!window.confirm('Are you sure you want to PUBLISH this assessment? Students will immediately be able to take it.')) {
      return;
    }
    try {
      const updated = await publishAssessment(id);
      setAssessment(updated);
      addToast('success', 'Assessment PUBLISHED successfully!');
    } catch (err: any) {
      addToast('error', getErrorMessage(err, 'Failed to publish assessment.'));
    }
  };

  // Archive Assessment
  const handleArchive = async () => {
    if (!id || !assessment) return;
    if (!window.confirm('Are you sure you want to ARCHIVE this assessment? Students will no longer see it.')) {
      return;
    }
    try {
      const updated = await archiveAssessment(id);
      setAssessment(updated);
      addToast('success', 'Assessment ARCHIVED.');
    } catch (err: any) {
      addToast('error', getErrorMessage(err, 'Failed to archive assessment.'));
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingState message="Loading assessment builder..." />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto relative">
        {/* Toast notifications */}
        <div className="fixed top-4 right-4 z-[100] space-y-2 w-80 animate-fade-in">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`flex items-start gap-3 p-4 rounded-xl shadow-2xl border text-sm backdrop-blur-md ${
                t.type === 'success'
                  ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-100'
                  : 'bg-red-950/90 border-red-500/30 text-red-100'
              }`}
            >
              <span className="mt-0.5">{t.type === 'success' ? <CheckCircle size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-red-500" />}</span>
              <p className="flex-1 font-medium">{t.message}</p>
              <button onClick={() => dismissToast(t.id)} className="text-white/50 hover:text-white transition-colors ml-2">
                <CloseIcon size={16} />
              </button>
            </div>
          ))}
        </div>

        <PageHeader
          title={isNew ? 'Create New Assessment' : `Assessment: ${assessment?.title || 'Builder'}`}
          subtitle="Configure assessment details, rules, and questions"
          icon={<FileText size={32} style={{ color: 'var(--brand)' }} />}
          action={
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
              <Button
                onClick={() => navigate('/officer/assessments')}
                variant="outline"
              >
                Back to Assessments
              </Button>
              {!isNew && assessment && (
                <>
                  {assessment.status === 'DRAFT' && (
                    <Button
                      onClick={handlePublish}
                      disabled={(assessment.questions?.length ?? 0) === 0}
                      variant="success"
                      leftIcon={<Rocket size={16} />}
                    >
                      Publish Assessment
                    </Button>
                  )}
                  {assessment.status === 'PUBLISHED' && (
                    <Button
                      onClick={handleArchive}
                      variant="secondary"
                      leftIcon={<Archive size={16} />}
                    >
                      Archive Assessment
                    </Button>
                  )}
                </>
              )}
            </div>
          }
        />

        {!isNew && (
          <div className="flex items-center gap-2 -mt-4 mb-4 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
            <span className="text-sm font-medium text-slate-400">Current Status:</span>
            <Badge variant={assessment?.status === 'PUBLISHED' ? 'success' : assessment?.status === 'ARCHIVED' ? 'secondary' : 'warning'}>
              {assessment?.status || 'DRAFT'}
            </Badge>
          </div>
        )}

        {/* SECTION 1: Assessment Metadata */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-700/50">
            <div className="w-8 h-8 rounded-full bg-brand/20 text-brand flex items-center justify-center font-bold text-sm">1</div>
            <h2 className="text-xl font-bold text-white">Assessment Metadata</h2>
          </div>

          <form onSubmit={handleSaveMeta} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Data Structures & Algorithms Qualifier"
                  required
                  className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as AssessmentCategory)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 appearance-none cursor-pointer"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                >
                  <option value="APTITUDE">Aptitude</option>
                  <option value="TECHNICAL">Technical</option>
                  <option value="CODING">Coding</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Topic *</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Trees & Graphs, DBMS, Quantitative"
                  required
                  className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty | '')}
                  className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 appearance-none cursor-pointer"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                >
                  <option value="">(Optional) None</option>
                  <option value="EASY">EASY</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HARD">HARD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Duration (Minutes) *</label>
                <input
                  type="number"
                  min={1}
                  value={durationMins}
                  onChange={(e) => setDurationMins(Number(e.target.value))}
                  required
                  className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Pass Percentage (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={passPercentage}
                  onChange={(e) => setPassPercentage(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 60"
                  className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Instructions or details for students..."
                className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 resize-none"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-700/50">
              <Button
                type="submit"
                disabled={savingMeta}
                variant="primary"
                leftIcon={savingMeta ? <div className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full" /> : <Save size={16} />}
                rightIcon={isNew && !savingMeta ? <ArrowRight size={16} /> : undefined}
              >
                {savingMeta ? 'Saving...' : isNew ? 'Create Draft & Proceed to Questions' : 'Update Metadata'}
              </Button>
            </div>
          </form>
        </Card>

        {/* SECTION 2: Questions Builder (Only shown for saved assessments) */}
        {!isNew && (
          <div className="space-y-6">
            {/* Question Form */}
            <Card className="p-6" id="question-builder">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-brand/20 text-brand flex items-center justify-center font-bold text-sm">2</div>
                  <h2 className="text-xl font-bold text-white">
                    {editingQuestionId ? 'Edit Question' : 'Add New Question'}
                  </h2>
                </div>
                {editingQuestionId && (
                  <Button
                    onClick={resetQuestionForm}
                    variant="outline"
                    size="sm"
                    leftIcon={<CloseIcon size={14} />}
                  >
                    Cancel Edit
                  </Button>
                )}
              </div>

              <form onSubmit={handleSaveQuestion} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Question Type *</label>
                    <select
                      value={qType}
                      onChange={(e) => setQType(e.target.value as QuestionType)}
                      className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 appearance-none cursor-pointer"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                    >
                      <option value="MCQ_SINGLE">MCQ (Single Answer)</option>
                      <option value="MCQ_MULTIPLE">MCQ (Multiple Answer)</option>
                      <option value="CODING">Coding Problem</option>
                      <option value="DESCRIPTIVE">Descriptive Text</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Marks *</label>
                    <input
                      type="number"
                      min={1}
                      value={qMarks}
                      onChange={(e) => setQMarks(Number(e.target.value))}
                      required
                      className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Sub-Topic</label>
                    <input
                      type="text"
                      value={qTopic}
                      onChange={(e) => setQTopic(e.target.value)}
                      placeholder="e.g. Binary Trees"
                      className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Difficulty</label>
                    <select
                      value={qDifficulty}
                      onChange={(e) => setQDifficulty(e.target.value as Difficulty | '')}
                      className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 appearance-none cursor-pointer"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                    >
                      <option value="">Default</option>
                      <option value="EASY">EASY</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HARD">HARD</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Question Text *</label>
                  <textarea
                    rows={4}
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                    placeholder="Enter problem statement or question..."
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 resize-none"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                  />
                </div>

                {/* Dynamic Inputs per Type */}
                {(qType === 'MCQ_SINGLE' || qType === 'MCQ_MULTIPLE') && (
                  <div className="space-y-4 p-5 rounded-xl border border-indigo-500/30 bg-indigo-500/5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                        Options & Correct Selection ({qType === 'MCQ_SINGLE' ? 'Pick exactly 1' : 'Pick at least 1'})
                      </label>
                      <Button
                        type="button"
                        onClick={() => setMcqOptions([...mcqOptions, { text: '', isCorrect: false }])}
                        variant="secondary"
                        size="sm"
                        leftIcon={<Plus size={14} />}
                      >
                        Add Option
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {mcqOptions.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 border border-slate-700">
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
                                className="w-4 h-4 text-brand focus:ring-brand border-slate-600 bg-slate-700"
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
                                className="w-4 h-4 text-brand rounded focus:ring-brand border-slate-600 bg-slate-700"
                              />
                            )}
                          </div>
                          <input
                            type="text"
                            placeholder={`Option ${idx + 1}...`}
                            value={opt.text}
                            onChange={(e) =>
                              setMcqOptions(
                                mcqOptions.map((o, i) => (i === idx ? { ...o, text: e.target.value } : o))
                              )
                            }
                            className="flex-1 px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2"
                            style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                          />
                          {mcqOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => setMcqOptions(mcqOptions.filter((_, i) => i !== idx))}
                              className="w-10 h-10 flex items-center justify-center rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors shrink-0 border border-transparent hover:border-red-500/20"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {qType === 'CODING' && (
                  <div className="space-y-6 p-5 rounded-xl border border-indigo-500/30 bg-indigo-500/5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Starter Code (Optional)</label>
                      <textarea
                        rows={4}
                        value={qStarterCode}
                        onChange={(e) => setQStarterCode(e.target.value)}
                        placeholder="function solution(arr) { ... }"
                        className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 resize-none font-mono"
                        style={{ background: '#1e1e2e', border: '1px solid var(--border-subtle)', color: '#cdd6f4', outlineColor: 'var(--brand)' }}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                          Test Cases
                        </label>
                        <Button
                          type="button"
                          onClick={() =>
                            setTestCases([...testCases, { input: '', expectedOutput: '', isHidden: false }])
                          }
                          variant="secondary"
                          size="sm"
                          leftIcon={<Plus size={14} />}
                        >
                          Add Test Case
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {testCases.map((tc, idx) => (
                          <div key={idx} className="p-4 rounded-xl border" style={{ background: 'var(--surface-1)', borderColor: 'var(--border-subtle)' }}>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-800 px-2 py-1 rounded-md">Test Case #{idx + 1}</span>
                              <div className="flex items-center gap-4">
                                <label className="text-sm font-medium text-slate-300 flex items-center gap-2 cursor-pointer">
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
                                    className="rounded w-4 h-4 text-brand focus:ring-brand border-slate-600 bg-slate-700"
                                  />
                                  Hidden from student
                                </label>
                                {testCases.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => setTestCases(testCases.filter((_, i) => i !== idx))}
                                    className="text-red-400 hover:text-red-300 text-sm font-medium flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded-md"
                                  >
                                    <Trash2 size={14} /> Remove
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Input</label>
                                <input
                                  type="text"
                                  placeholder="e.g. [1, 2, 3]"
                                  value={tc.input}
                                  onChange={(e) =>
                                    setTestCases(
                                      testCases.map((t, i) => (i === idx ? { ...t, input: e.target.value } : t))
                                    )
                                  }
                                  className="w-full px-3 py-2 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 font-mono"
                                  style={{ background: '#1e1e2e', border: '1px solid var(--border-subtle)', color: '#cdd6f4', outlineColor: 'var(--brand)' }}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Expected Output</label>
                                <input
                                  type="text"
                                  placeholder="e.g. 6"
                                  value={tc.expectedOutput}
                                  onChange={(e) =>
                                    setTestCases(
                                      testCases.map((t, i) => (i === idx ? { ...t, expectedOutput: e.target.value } : t))
                                    )
                                  }
                                  className="w-full px-3 py-2 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 font-mono"
                                  style={{ background: '#1e1e2e', border: '1px solid var(--border-subtle)', color: '#cdd6f4', outlineColor: 'var(--brand)' }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t border-slate-700/50">
                  <Button
                    type="submit"
                    variant="brand"
                    leftIcon={editingQuestionId ? <Save size={16} /> : <Plus size={16} />}
                  >
                    {editingQuestionId ? 'Update Question' : 'Add Question to Assessment'}
                  </Button>
                </div>
              </form>
            </Card>

            {/* Questions List */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-700/50">
                <div className="w-8 h-8 rounded-full bg-brand/20 text-brand flex items-center justify-center font-bold text-sm">3</div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  Question Bank 
                  <Badge variant="primary" className="ml-2">
                    {assessment?.questions?.length || 0} Total
                  </Badge>
                </h2>
              </div>

              {(!assessment?.questions || assessment.questions.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-slate-700/50 rounded-xl bg-slate-800/20">
                  <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center mb-4 text-slate-500">
                    <ListIcon size={32} />
                  </div>
                  <p className="text-lg font-bold text-slate-300 mb-1">No questions yet</p>
                  <p className="text-sm text-slate-500 text-center max-w-sm">
                    Use the builder above to add questions to this assessment. You need at least one question to publish.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assessment.questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-5 rounded-xl border flex flex-col md:flex-row md:items-start justify-between gap-6 group hover:border-slate-500 transition-colors bg-slate-800/30"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="w-7 h-7 flex items-center justify-center font-bold text-white bg-brand rounded-md font-mono">Q{idx + 1}</span>
                          <Badge variant="brand">{q.type.replace('_', ' ')}</Badge>
                          <Badge variant="secondary">{q.marks} {q.marks === 1 ? 'mark' : 'marks'}</Badge>
                          {q.topic && <Badge variant="outline">Topic: {q.topic}</Badge>}
                          {q.difficulty && <Badge variant={q.difficulty === 'HARD' ? 'error' : q.difficulty === 'MEDIUM' ? 'warning' : 'success'}>{q.difficulty}</Badge>}
                        </div>

                        <p className="text-slate-200 text-base font-medium whitespace-pre-wrap leading-relaxed">{q.text}</p>

                        {/* Options preview for MCQ */}
                        {q.options && q.options.length > 0 && (
                          <div className="grid gap-2 sm:grid-cols-2 pt-2">
                            {q.options.map((opt, oIdx) => (
                              <div
                                key={oIdx}
                                className={`px-3 py-2 rounded-lg border text-sm flex items-center gap-2 ${
                                  opt.isCorrect
                                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 font-medium'
                                    : 'bg-slate-800/50 text-slate-400 border-slate-700/50'
                                }`}
                              >
                                {opt.isCorrect ? <CheckCircle size={16} className="text-emerald-500 shrink-0" /> : <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0" />}
                                <span className="line-clamp-2">{opt.text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Preview for Coding */}
                        {q.type === 'CODING' && q.testCases && q.testCases.length > 0 && (
                          <div className="mt-3 text-sm flex items-center gap-2 text-slate-400 bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700/50 inline-flex">
                            <span className="font-semibold text-slate-300">{q.testCases.length}</span> Test Case{q.testCases.length > 1 ? 's' : ''} configured
                            {q.starterCode && <><span className="mx-1">•</span> <span className="text-indigo-400">Starter code provided</span></>}
                          </div>
                        )}
                      </div>

                      <div className="flex md:flex-col items-center gap-2 self-end md:self-start shrink-0">
                        <Button
                          onClick={() => startEditQuestion(q)}
                          variant="secondary"
                          size="sm"
                          className="w-full justify-center"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDeleteQuestion(q.id)}
                          variant="outline"
                          size="sm"
                          className="w-full justify-center border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
