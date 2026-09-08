import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  listAssessments,
  deleteAssessment,
  type Assessment,
  type AssessmentCategory,
  type AssessmentStatus,
} from '../../services/assessmentService';
import { getErrorMessage } from '../../utils/error';
import AppLayout from '../../components/layout/AppLayout';
import { PageHeader, Card, Button, Badge, LoadingState } from '../../components/ui';
import { FileText, Plus, Search, Filter, CheckCircle, XCircle, Trash2, Edit2, Eye, Clock, HelpCircle, Users as UsersIcon, Target, X as CloseIcon } from 'lucide-react';

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

let toastCounter = 0;

export default function AssessmentList() {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<AssessmentCategory | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<AssessmentStatus | ''>('');
  const [searchTopic, setSearchTopic] = useState('');

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const dismissToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const fetchAssessments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listAssessments({
        category: selectedCategory || undefined,
        status: selectedStatus || undefined,
        topic: searchTopic || undefined,
      });
      setAssessments(data);
    } catch (err: any) {
      addToast('error', getErrorMessage(err, 'Failed to fetch assessments.'));
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedStatus, searchTopic]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the draft assessment "${title}"?`)) return;
    try {
      await deleteAssessment(id);
      addToast('success', `Assessment "${title}" deleted successfully.`);
      fetchAssessments();
    } catch (err: any) {
      addToast('error', getErrorMessage(err, 'Failed to delete assessment.'));
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto relative">
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
          title="Assessment Management"
          subtitle="Create, publish, and manage student assessments"
          icon={<FileText size={32} style={{ color: 'var(--brand)' }} />}
          action={
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate('/officer')}
                variant="outline"
              >
                Back to Dashboard
              </Button>
              <Button
                onClick={() => navigate('/officer/assessments/new')}
                variant="primary"
                leftIcon={<Plus size={16} />}
              >
                Create New Assessment
              </Button>
            </div>
          }
        />

        {/* Filters */}
        <Card className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-80 relative group">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors" />
            <input
              type="text"
              placeholder="Search by topic (e.g. DBMS, DSA)..."
              value={searchTopic}
              onChange={(e) => setSearchTopic(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-sm transition-all focus:outline-none focus:ring-2"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
            />
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <div className="relative group">
              <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as AssessmentCategory | '')}
                className="pl-9 pr-8 py-2 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 transition-all cursor-pointer"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
              >
                <option value="">All Categories</option>
                <option value="APTITUDE">Aptitude</option>
                <option value="TECHNICAL">Technical</option>
                <option value="CODING">Coding</option>
              </select>
            </div>

            <div className="relative group">
              <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as AssessmentStatus | '')}
                className="pl-9 pr-8 py-2 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 transition-all cursor-pointer"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Assessment List */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <LoadingState message="Loading assessments..." />
          </div>
        ) : assessments.length === 0 ? (
          <Card className="text-center py-20 flex flex-col items-center justify-center border-dashed">
            <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 text-slate-500">
              <FileText size={32} />
            </div>
            <p className="text-lg font-bold text-white mb-1">No assessments found</p>
            <p className="text-sm text-slate-400 mb-6">Create your first assessment to start evaluating students.</p>
            <Button
              onClick={() => navigate('/officer/assessments/new')}
              variant="primary"
              leftIcon={<Plus size={16} />}
            >
              Create Assessment
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {assessments.map((item) => (
              <Card
                key={item.id}
                className="p-6 flex flex-col group hover:border-slate-600 transition-colors h-full"
              >
                <div className="space-y-4 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-inner shrink-0 mt-0.5">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white group-hover:text-brand transition-colors line-clamp-2" title={item.title}>{item.title}</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={item.status === 'PUBLISHED' ? 'success' : item.status === 'DRAFT' ? 'warning' : 'secondary'}>
                            {item.status}
                          </Badge>
                          <Badge variant={item.category === 'APTITUDE' ? 'primary' : item.category === 'TECHNICAL' ? 'brand' : 'warning'}>
                            {item.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed bg-slate-800/30 p-3 rounded-lg">{item.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-300 p-2 rounded-lg" style={{ background: 'var(--surface-2)' }}>
                      <Target size={14} className="text-brand" />
                      <span className="truncate" title={item.topic}>{item.topic}</span>
                    </div>
                    {item.difficulty && (
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-300 p-2 rounded-lg" style={{ background: 'var(--surface-2)' }}>
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.difficulty === 'HARD' ? 'var(--error)' : item.difficulty === 'MEDIUM' ? 'var(--warning)' : 'var(--success)' }}></span>
                        {item.difficulty}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 pt-4 mt-4 border-t border-slate-700/50 text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock size={14} />
                      <span><strong className="text-white">{item.durationMins}</strong> min</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <HelpCircle size={14} />
                      <span><strong className="text-white">{item._count?.questions ?? 0}</strong> Qs</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <UsersIcon size={14} />
                      <span><strong className="text-white">{item._count?.attempts ?? 0}</strong> tries</span>
                    </div>
                    {item.passPercentage !== null && item.passPercentage !== undefined && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <CheckCircle size={14} className="text-success" />
                        <span><strong className="text-white">{item.passPercentage}%</strong> pass</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  {item.status === 'DRAFT' && (item._count?.attempts ?? 0) === 0 && (
                    <Button
                      onClick={() => handleDelete(item.id, item.title)}
                      variant="outline"
                      className="flex-1 justify-center border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                      leftIcon={<Trash2 size={16} />}
                    >
                      Delete
                    </Button>
                  )}
                  <Button
                    onClick={() => navigate(`/officer/assessments/${item.id}`)}
                    variant={item.status === 'DRAFT' ? "primary" : "secondary"}
                    className={item.status === 'DRAFT' && (item._count?.attempts ?? 0) === 0 ? "flex-1 justify-center" : "w-full justify-center"}
                    leftIcon={item.status === 'DRAFT' ? <Edit2 size={16} /> : <Eye size={16} />}
                  >
                    {item.status === 'DRAFT' ? 'Edit Questions' : 'View Details'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
