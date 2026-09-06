import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';

interface Round {
  id: string;
  roundNumber: number;
  roundType: string;
  topics: string[];
  difficulty?: string;
  questionsAsked?: string;
  tips?: string;
}

interface Experience {
  id: string;
  companyName: string;
  role: string;
  driveYear: number;
  difficulty?: string;
  outcome: string;
  overallRating?: number;
  isAnonymous: boolean;
  narrative?: string;
  overallTips?: string;
  rounds: Round[];
  alumniProfile?: { id: string; fullName: string; graduationYear: number; currentCompany?: string } | null;
  student?: { id: string; fullName: string } | null;
  placementDrive?: { id: string; title: string; jobTitle: string } | null;
  createdAt: string;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: 'text-emerald-400 bg-emerald-900/30 border-emerald-800',
  MEDIUM: 'text-amber-400 bg-amber-900/30 border-amber-800',
  HARD: 'text-orange-400 bg-orange-900/30 border-orange-800',
  VERY_HARD: 'text-red-400 bg-red-900/30 border-red-800',
};

const ROUND_TYPE_ICONS: Record<string, string> = {
  APTITUDE: '🧮',
  TECHNICAL: '💻',
  CODING: '⌨️',
  HR: '🤝',
  MANAGERIAL: '📊',
  OTHER: '📋',
};

export default function DriveExperienceDetail() {
  const { id } = useParams<{ id: string }>();
  const [exp, setExp] = useState<Experience | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetch() {
      try {
        const res = await api.get(`/experiences/${id}`);
        setExp(res.data.data);
      } catch {
        setError('Experience not found or not yet approved.');
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Loading...</div>;
  if (error || !exp) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-red-400">
      {error || 'Experience not found.'}
    </div>
  );

  const authorName = exp.isAnonymous ? 'Anonymous' : (exp.alumniProfile?.fullName || exp.student?.fullName || 'Unknown');

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Back */}
        <Link to="/student/experiences" className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
          ← Back to Experiences
        </Link>

        {/* Header Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">{exp.companyName}</h1>
              <p className="text-slate-400 mt-1">{exp.role} · {exp.driveYear}</p>
              {exp.placementDrive && (
                <p className="text-indigo-400 text-sm mt-1">Drive: {exp.placementDrive.title}</p>
              )}
            </div>
            {exp.overallRating && (
              <div className="text-center">
                <div className="text-amber-400 text-2xl font-bold">{exp.overallRating}/5</div>
                <div className="text-amber-400 text-sm">{'★'.repeat(exp.overallRating)}{'☆'.repeat(5 - exp.overallRating)}</div>
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            {exp.difficulty && (
              <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${DIFFICULTY_COLORS[exp.difficulty]}`}>
                {exp.difficulty.replace('_', ' ')}
              </span>
            )}
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
              exp.outcome === 'SELECTED' ? 'text-emerald-400 bg-emerald-900/30 border-emerald-800' :
              exp.outcome === 'REJECTED' ? 'text-red-400 bg-red-900/30 border-red-800' :
              exp.outcome === 'WAITLISTED' ? 'text-amber-400 bg-amber-900/30 border-amber-800' :
              'text-slate-400 bg-slate-700/30 border-slate-700'
            }`}>
              {exp.outcome.replace(/_/g, ' ')}
            </span>
          </div>

          {/* Contributor */}
          <div className="mt-4 flex items-center gap-3 text-sm text-slate-500 border-t border-slate-700 pt-4">
            <span>Shared by: <span className="text-slate-300">{authorName}</span></span>
            {!exp.isAnonymous && exp.alumniProfile && (
              <span className="text-indigo-400">Alumni · {exp.alumniProfile.graduationYear}</span>
            )}
            <span className="ml-auto">{new Date(exp.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Narrative */}
        {exp.narrative && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3">Experience Summary</h2>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{exp.narrative}</p>
          </div>
        )}

        {/* Rounds */}
        {exp.rounds.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Interview Rounds ({exp.rounds.length})</h2>
            {exp.rounds.map(round => (
              <div key={round.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{ROUND_TYPE_ICONS[round.roundType] || '📋'}</span>
                  <div>
                    <span className="text-white font-semibold">Round {round.roundNumber}</span>
                    <span className="text-slate-400 text-sm ml-2">{round.roundType}</span>
                    {round.difficulty && <span className="text-xs ml-2 text-slate-500">· {round.difficulty}</span>}
                  </div>
                </div>

                {round.topics.length > 0 && (
                  <div className="mb-3">
                    <p className="text-slate-500 text-xs mb-1.5">Topics Covered</p>
                    <div className="flex flex-wrap gap-1.5">
                      {round.topics.map(t => (
                        <span key={t} className="text-xs px-2 py-0.5 bg-indigo-900/30 text-indigo-300 border border-indigo-800/50 rounded-full">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {round.questionsAsked && (
                  <div className="mb-3">
                    <p className="text-slate-500 text-xs mb-1">Questions/Topics Asked</p>
                    <p className="text-slate-300 text-sm whitespace-pre-wrap">{round.questionsAsked}</p>
                  </div>
                )}

                {round.tips && (
                  <div className="mt-3 p-3 bg-amber-900/20 border border-amber-800/40 rounded-lg">
                    <p className="text-amber-400 text-xs font-semibold mb-1">💡 Tips for this Round</p>
                    <p className="text-slate-300 text-sm">{round.tips}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Overall Tips */}
        {exp.overallTips && (
          <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-700/50 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-2">💡 Preparation Advice</h2>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{exp.overallTips}</p>
          </div>
        )}
      </div>
    </div>
  );
}
