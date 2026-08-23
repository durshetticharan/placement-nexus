import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  listAssessments,
  deleteAssessment,
  type Assessment,
  type AssessmentCategory,
  type AssessmentStatus,
} from '../../services/assessmentService';
import { getErrorMessage } from '../../utils/error';

const STATUS_BADGE: Record<AssessmentStatus, string> = {
  DRAFT: 'bg-amber-900/50 text-amber-300 border-amber-600',
  PUBLISHED: 'bg-emerald-900/50 text-emerald-300 border-emerald-600',
  ARCHIVED: 'bg-slate-800 text-slate-400 border-slate-700',
};

const CATEGORY_BADGE: Record<AssessmentCategory, string> = {
  APTITUDE: 'bg-blue-900/50 text-blue-300 border-blue-600',
  TECHNICAL: 'bg-purple-900/50 text-purple-300 border-purple-600',
  CODING: 'bg-indigo-900/50 text-indigo-300 border-indigo-600',
};

export default function OfficerAssessmentList() {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<AssessmentCategory | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<AssessmentStatus | ''>('');
  const [searchTopic, setSearchTopic] = useState('');

  const fetchAssessments = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await listAssessments({
        category: selectedCategory || undefined,
        status: selectedStatus || undefined,
        topic: searchTopic || undefined,
      });
      setAssessments(data);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to fetch assessments.'));
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
      setError('');
      await deleteAssessment(id);
      setSuccessMsg(`Assessment "${title}" deleted successfully.`);
      fetchAssessments();
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to delete assessment.'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
          <div>
            <div className="flex items-center gap-2">
              <Link to="/dashboard/officer" className="text-slate-400 hover:text-white text-sm">
                ← Officer Dashboard
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1">Assessment Management</h1>
            <p className="text-slate-400 text-sm">Create, publish, and manage student assessments</p>
          </div>
          <Link
            to="/officer/assessments/new"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow transition-colors text-center whitespace-nowrap"
          >
            + Create New Assessment
          </Link>
        </div>

        {/* Alerts */}
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

        {/* Filters */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as AssessmentCategory | '')}
              className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              <option value="APTITUDE">Aptitude</option>
              <option value="TECHNICAL">Technical</option>
              <option value="CODING">Coding</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as AssessmentStatus | '')}
              className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-slate-400 mb-1">Search Topic</label>
            <input
              type="text"
              placeholder="e.g. DBMS, DSA, Quantitative..."
              value={searchTopic}
              onChange={(e) => setSearchTopic(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Assessment List */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 bg-slate-800/50 rounded-xl border border-slate-700">
            Loading assessments...
          </div>
        ) : assessments.length === 0 ? (
          <div className="p-12 text-center bg-slate-800/50 rounded-xl border border-slate-700 space-y-3">
            <p className="text-slate-400 text-base">No assessments found.</p>
            <Link
              to="/officer/assessments/new"
              className="inline-block text-indigo-400 hover:text-indigo-300 text-sm font-semibold"
            >
              Create your first assessment →
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {assessments.map((item) => (
              <div
                key={item.id}
                className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col justify-between hover:border-slate-600 transition-colors shadow-lg"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg font-bold text-white line-clamp-1">{item.title}</h2>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_BADGE[item.status]}`}
                    >
                      {item.status}
                    </span>
                  </div>

                  {item.description && (
                    <p className="text-slate-400 text-sm line-clamp-2">{item.description}</p>
                  )}

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span
                      className={`px-2 py-0.5 rounded border font-medium ${CATEGORY_BADGE[item.category]}`}
                    >
                      {item.category}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-600">
                      Topic: {item.topic}
                    </span>
                    {item.difficulty && (
                      <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-600">
                        {item.difficulty}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-700/60">
                    <span>⏱ {item.durationMins} mins</span>
                    <span>❓ {item._count?.questions ?? 0} questions</span>
                    <span>✍️ {item._count?.attempts ?? 0} attempts</span>
                    {item.passPercentage !== null && item.passPercentage !== undefined && (
                      <span>🎯 Pass: {item.passPercentage}%</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-700/60">
                  {item.status === 'DRAFT' && (item._count?.attempts ?? 0) === 0 && (
                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded border border-red-800 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/officer/assessments/${item.id}`)}
                    className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
                  >
                    {item.status === 'DRAFT' ? 'Edit / Add Questions' : 'View / Manage'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
