import { useState, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/error';
import * as studentService from '../../services/studentService';
import NotificationCenter from '../../components/NotificationCenter';
import type {
  StudentProfile,
  AcademicData,
  SkillItem,
  ProjectItem,
  InternshipItem,
  CertificationItem,
  AchievementItem,
  ResumeItem,
  ProfessionalProfileItem,
  CodingProfileItem,
  ProficiencyLevel,
} from '../../services/studentService';

type Tab = 'academics' | 'skills' | 'projects' | 'internships' | 'certifications' | 'achievements' | 'profiles';

const RATING_COLORS: Record<ProficiencyLevel, string> = {
  BEGINNER: 'bg-slate-700 text-slate-300 border-slate-600',
  INTERMEDIATE: 'bg-blue-900/60 text-blue-300 border-blue-600',
  ADVANCED: 'bg-indigo-900/60 text-indigo-300 border-indigo-500',
  EXPERT: 'bg-emerald-900/60 text-emerald-300 border-emerald-500',
};

const INPUT_STYLE =
  'w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500';
const LABEL_STYLE = 'block text-xs font-medium text-slate-300 mb-1';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('academics');

  // Active modal state
  const [modalType, setModalType] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<any>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setError('');
      const data = await studentService.getProfile();
      setProfile(data);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to load profile.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const closeModal = () => {
    setModalType(null);
    setEditItem(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 text-sm">
        Loading profile…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header bar */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-2xl font-bold text-white shadow-inner">
              🎓
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{profile?.fullName || user?.email}</h1>
              <p className="text-slate-400 text-sm">
                Roll No: <span className="text-indigo-400 font-mono font-medium">{profile?.rollNumber || 'N/A'}</span> • {user?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Completion Bar */}
            <div className="w-48 bg-slate-700/60 rounded-xl p-3 border border-slate-600/50">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-slate-400 font-medium">Profile Completion</span>
                <span className="text-indigo-400 font-bold font-mono">{profile?.profileCompletionPct ?? 0}%</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${profile?.profileCompletionPct ?? 0}%` }}
                />
              </div>
            </div>

            <NotificationCenter />

            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-900/40 hover:bg-red-800/60 border border-red-700 text-red-200 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              Log out
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-900/40 border border-red-500 rounded-xl text-red-300 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-white ml-4">✕</button>
          </div>
        )}

        {/* Career Intelligence Quick Access Banner */}
        <div className="bg-gradient-to-r from-purple-900/60 via-indigo-900/40 to-slate-800 rounded-xl border border-purple-700/60 p-4 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-2xl">
              🎯
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Career Development & Pathing</h2>
              <p className="text-slate-300 text-xs sm:text-sm">Set your target career path, analyze required skills, and view learning resources</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/student/career')}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-colors shadow whitespace-nowrap"
          >
            🎯 Career Intelligence →
          </button>
        </div>

        {/* Assessment Engine Quick Access Banner */}
        <div className="bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-800 rounded-xl border border-indigo-700/60 p-4 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-2xl">
              📝
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Assessment Engine</h2>
              <p className="text-slate-300 text-xs sm:text-sm">Take aptitude, technical, and coding tests to demonstrate your readiness</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/student/assessments/history')}
              className="px-4 py-2 bg-slate-700/80 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
            >
              📜 Past Attempts
            </button>
            <button
              onClick={() => navigate('/student/assessments')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors shadow whitespace-nowrap"
            >
              🚀 View Assessments →
            </button>
          </div>
        </div>

        {/* Phase 9: Placement Readiness Quick Access Banner */}
        <div className="bg-gradient-to-r from-emerald-900/60 via-teal-900/40 to-slate-800 rounded-xl border border-emerald-700/60 p-4 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center text-2xl">
              🌟
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Placement Readiness</h2>
              <p className="text-slate-300 text-xs sm:text-sm">Check your overall readiness score and get personalized recommendations</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/student/readiness')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors shadow whitespace-nowrap"
          >
            📊 Check Readiness →
          </button>
        </div>

        {/* Phase 18: Analytics Quick Access Banner */}
        <div className="bg-gradient-to-r from-blue-900/60 via-cyan-900/40 to-slate-800 rounded-xl border border-blue-700/60 p-4 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-2xl">
              📈
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Placement Analytics</h2>
              <p className="text-slate-300 text-xs sm:text-sm">Track your application funnel and skill gap progress</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/student/analytics')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors shadow whitespace-nowrap"
          >
            📊 View Analytics →
          </button>
        </div>

        {/* Phase 12: Placement Drives Quick Access Banner */}
        <div className="bg-gradient-to-r from-orange-900/60 via-amber-900/40 to-slate-800 rounded-xl border border-orange-700/60 p-4 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-600/30 border border-orange-500/50 flex items-center justify-center text-2xl">
              💼
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Placement Drives</h2>
              <p className="text-slate-300 text-xs sm:text-sm">Browse open placement drives, check eligibility, and submit your applications</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/student/applications')}
              className="px-4 py-2 bg-slate-700/80 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
            >
              📋 My Applications
            </button>
            <button
              onClick={() => navigate('/student/drives')}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition-colors shadow whitespace-nowrap"
            >
              🚀 Browse Drives →
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-700 overflow-x-auto">
          {(['academics', 'skills', 'projects', 'internships', 'certifications', 'achievements', 'profiles'] as Tab[]).map((tab) => {
            const counts: Record<Tab, number> = {
              academics: profile?.academics ? 1 : 0,
              skills: profile?.skills.length || 0,
              projects: profile?.projects.length || 0,
              internships: profile?.internships.length || 0,
              certifications: profile?.certifications.length || 0,
              achievements: profile?.achievements.length || 0,
              profiles: (profile?.resumes?.length || 0) + (profile?.professionalProfiles?.length || 0) + (profile?.codingProfiles?.length || 0),
            };
            const label = tab === 'profiles' ? 'Resume & Profiles' : tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px capitalize whitespace-nowrap flex items-center gap-2 ${activeTab === tab
                    ? 'border-indigo-500 text-indigo-400 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
              >
                <span>{label}</span>
                {counts[tab] > 0 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-slate-700 text-slate-300 font-mono">
                    {counts[tab]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-xl">
          {activeTab === 'academics' && (
            <AcademicsSection academics={profile?.academics} onEdit={() => setModalType('academics')} />
          )}

          {activeTab === 'skills' && (
            <SkillsSection
              skills={profile?.skills || []}
              onAdd={() => setModalType('addSkill')}
              onEdit={(item) => {
                setEditItem(item);
                setModalType('editSkill');
              }}
              onDelete={async (id) => {
                await studentService.deleteSkill(id);
                fetchProfile();
              }}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsSection
              projects={profile?.projects || []}
              onAdd={() => setModalType('addProject')}
              onEdit={(item) => {
                setEditItem(item);
                setModalType('editProject');
              }}
              onDelete={async (id) => {
                await studentService.deleteProject(id);
                fetchProfile();
              }}
            />
          )}

          {activeTab === 'internships' && (
            <InternshipsSection
              internships={profile?.internships || []}
              onAdd={() => setModalType('addInternship')}
              onEdit={(item) => {
                setEditItem(item);
                setModalType('editInternship');
              }}
              onDelete={async (id) => {
                await studentService.deleteInternship(id);
                fetchProfile();
              }}
            />
          )}

          {activeTab === 'certifications' && (
            <CertificationsSection
              certifications={profile?.certifications || []}
              onAdd={() => setModalType('addCertification')}
              onEdit={(item) => {
                setEditItem(item);
                setModalType('editCertification');
              }}
              onDelete={async (id) => {
                await studentService.deleteCertification(id);
                fetchProfile();
              }}
            />
          )}

          {activeTab === 'achievements' && (
            <AchievementsSection
              achievements={profile?.achievements || []}
              onAdd={() => setModalType('addAchievement')}
              onEdit={(item) => {
                setEditItem(item);
                setModalType('editAchievement');
              }}
              onDelete={async (id) => {
                await studentService.deleteAchievement(id);
                fetchProfile();
              }}
            />
          )}

          {activeTab === 'profiles' && (
            <ProfilesAndResumesSection
              resumes={profile?.resumes || []}
              professionalProfiles={profile?.professionalProfiles || []}
              codingProfiles={profile?.codingProfiles || []}
              onRefresh={fetchProfile}
              onAddProf={() => setModalType('addProfProfile')}
              onEditProf={(item) => {
                setEditItem(item);
                setModalType('editProfProfile');
              }}
              onAddCoding={() => setModalType('addCodingProfile')}
              onEditCoding={(item) => {
                setEditItem(item);
                setModalType('editCodingProfile');
              }}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {modalType === 'academics' && (
        <AcademicModal
          initialData={profile?.academics}
          onClose={closeModal}
          onSaved={() => {
            closeModal();
            fetchProfile();
          }}
        />
      )}

      {(modalType === 'addSkill' || modalType === 'editSkill') && (
        <SkillModal
          initialData={editItem}
          onClose={closeModal}
          onSaved={() => {
            closeModal();
            fetchProfile();
          }}
        />
      )}

      {(modalType === 'addProject' || modalType === 'editProject') && (
        <ProjectModal
          initialData={editItem}
          onClose={closeModal}
          onSaved={() => {
            closeModal();
            fetchProfile();
          }}
        />
      )}

      {(modalType === 'addInternship' || modalType === 'editInternship') && (
        <InternshipModal
          initialData={editItem}
          onClose={closeModal}
          onSaved={() => {
            closeModal();
            fetchProfile();
          }}
        />
      )}

      {(modalType === 'addCertification' || modalType === 'editCertification') && (
        <CertificationModal
          initialData={editItem}
          onClose={closeModal}
          onSaved={() => {
            closeModal();
            fetchProfile();
          }}
        />
      )}

      {(modalType === 'addAchievement' || modalType === 'editAchievement') && (
        <AchievementModal
          initialData={editItem}
          onClose={closeModal}
          onSaved={() => {
            closeModal();
            fetchProfile();
          }}
        />
      )}

      {(modalType === 'addProfProfile' || modalType === 'editProfProfile') && (
        <ProfessionalProfileModal
          initialData={editItem}
          onClose={closeModal}
          onSaved={() => {
            closeModal();
            fetchProfile();
          }}
        />
      )}

      {(modalType === 'addCodingProfile' || modalType === 'editCodingProfile') && (
        <CodingProfileModal
          initialData={editItem}
          onClose={closeModal}
          onSaved={() => {
            closeModal();
            fetchProfile();
          }}
        />
      )}
    </div>
  );
}

// ─── Sub-Sections ─────────────────────────────────────────────────────────────

function AcademicsSection({ academics, onEdit }: { academics?: AcademicData | null; onEdit: () => void }) {
  if (!academics) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="text-4xl">📚</div>
        <p className="text-slate-400 text-sm">No academic details added yet.</p>
        <button
          onClick={onEdit}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg transition-colors"
        >
          Add Academic Info
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-700 pb-4">
        <h2 className="text-lg font-bold text-white">Academic Details</h2>
        <button
          onClick={onEdit}
          className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-indigo-400 text-sm font-semibold rounded-lg transition-colors"
        >
          ✎ Edit
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-700/40 p-4 rounded-xl border border-slate-700">
          <span className="text-xs text-slate-400 block">Degree & Branch</span>
          <span className="text-white font-semibold text-base">{academics.degree} — {academics.branch}</span>
        </div>
        <div className="bg-slate-700/40 p-4 rounded-xl border border-slate-700">
          <span className="text-xs text-slate-400 block">College</span>
          <span className="text-white font-semibold text-base">{academics.collegeName}</span>
        </div>
        <div className="bg-slate-700/40 p-4 rounded-xl border border-slate-700">
          <span className="text-xs text-slate-400 block">Graduation Year</span>
          <span className="text-white font-semibold text-base">{academics.graduationYear}</span>
        </div>
        <div className="bg-slate-700/40 p-4 rounded-xl border border-slate-700">
          <span className="text-xs text-slate-400 block">CGPA</span>
          <span className="text-emerald-400 font-bold text-lg font-mono">{academics.cgpa} / 10.0</span>
        </div>
        <div className="bg-slate-700/40 p-4 rounded-xl border border-slate-700">
          <span className="text-xs text-slate-400 block">Active Backlogs</span>
          <span className={`font-bold text-lg font-mono ${academics.backlogs > 0 ? 'text-red-400' : 'text-slate-300'}`}>
            {academics.backlogs}
          </span>
        </div>
      </div>
    </div>
  );
}

function SkillsSection({
  skills,
  onAdd,
  onEdit,
  onDelete,
}: {
  skills: SkillItem[];
  onAdd: () => void;
  onEdit: (item: SkillItem) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-700 pb-4">
        <h2 className="text-lg font-bold text-white">Skills & Competencies</h2>
        <button
          onClick={onAdd}
          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          + Add Skill
        </button>
      </div>

      {skills.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">No skills added yet. Click above to add skills.</div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {skills.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-3.5 py-2 rounded-xl border text-sm font-medium ${RATING_COLORS[item.selfRating]
                }`}
            >
              <div>
                <span className="font-semibold text-white">{item.skill.name}</span>
                <span className="text-xs block opacity-80 font-normal">{item.selfRating}</span>
              </div>
              <div className="flex items-center gap-1.5 ml-2 border-l border-slate-600/40 pl-2">
                <button
                  onClick={() => onEdit(item)}
                  className="hover:text-white transition-colors text-xs"
                  title="Edit Rating"
                >
                  ✎
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="hover:text-red-300 transition-colors text-xs ml-1"
                  title="Remove Skill"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectsSection({
  projects,
  onAdd,
  onEdit,
  onDelete,
}: {
  projects: ProjectItem[];
  onAdd: () => void;
  onEdit: (item: ProjectItem) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-700 pb-4">
        <h2 className="text-lg font-bold text-white">Projects</h2>
        <button
          onClick={onAdd}
          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          + Add Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">No projects added yet. Click above to add one.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {projects.map((proj) => (
            <div key={proj.id} className="bg-slate-700/40 rounded-xl border border-slate-700 p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white">{proj.title}</h3>
                  <p className="text-slate-300 text-sm mt-1 whitespace-pre-wrap">{proj.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(proj)}
                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(proj.id)}
                    className="px-3 py-1 bg-red-900/40 hover:bg-red-800/60 border border-red-700 text-red-300 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Tech Stack */}
              <div className="flex flex-wrap gap-2 pt-2">
                {proj.techStack.map((tech, idx) => (
                  <span key={idx} className="px-2.5 py-0.5 text-xs font-medium bg-slate-800 text-indigo-300 rounded-md border border-slate-600">
                    {tech}
                  </span>
                ))}
              </div>

              {/* Links */}
              {(proj.repoUrl || proj.liveUrl) && (
                <div className="flex items-center gap-4 text-xs pt-2 border-t border-slate-700/60">
                  {proj.repoUrl && (
                    <a href={proj.repoUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
                      🔗 Code Repository
                    </a>
                  )}
                  {proj.liveUrl && (
                    <a href={proj.liveUrl} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">
                      🚀 Live Demo
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InternshipsSection({
  internships,
  onAdd,
  onEdit,
  onDelete,
}: {
  internships: InternshipItem[];
  onAdd: () => void;
  onEdit: (item: InternshipItem) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-700 pb-4">
        <h2 className="text-lg font-bold text-white">Work Experience & Internships</h2>
        <button
          onClick={onAdd}
          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          + Add Internship
        </button>
      </div>

      {internships.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">No internship experiences added yet.</div>
      ) : (
        <div className="space-y-4">
          {internships.map((item) => (
            <div key={item.id} className="bg-slate-700/40 rounded-xl border border-slate-700 p-5 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold text-white">{item.role}</h3>
                    <span className="text-indigo-400 text-sm font-medium">@ {item.companyName}</span>
                    {item.isOngoing && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-900/50 text-emerald-300 border border-emerald-600">
                        Ongoing
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(item.startDate).toLocaleDateString()} —{' '}
                    {item.isOngoing ? 'Present' : item.endDate ? new Date(item.endDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(item)}
                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="px-3 py-1 bg-red-900/40 hover:bg-red-800/60 border border-red-700 text-red-300 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {item.description && <p className="text-sm text-slate-300 pt-1">{item.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CertificationsSection({
  certifications,
  onAdd,
  onEdit,
  onDelete,
}: {
  certifications: CertificationItem[];
  onAdd: () => void;
  onEdit: (item: CertificationItem) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-700 pb-4">
        <h2 className="text-lg font-bold text-white">Certifications</h2>
        <button
          onClick={onAdd}
          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          + Add Certification
        </button>
      </div>

      {certifications.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">No certifications added yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certifications.map((cert) => (
            <div key={cert.id} className="bg-slate-700/40 rounded-xl border border-slate-700 p-5 space-y-3 flex flex-col justify-between">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white">{cert.title}</h3>
                  <p className="text-slate-300 text-sm font-medium">{cert.issuingOrg}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Issued: {new Date(cert.issueDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(cert)}
                    className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(cert.id)}
                    className="px-2.5 py-1 bg-red-900/40 hover:bg-red-800/60 border border-red-700 text-red-300 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {cert.credentialUrl && (
                <a href={cert.credentialUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:underline pt-2 border-t border-slate-700">
                  📜 Verify Credential ↗
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AchievementsSection({
  achievements,
  onAdd,
  onEdit,
  onDelete,
}: {
  achievements: AchievementItem[];
  onAdd: () => void;
  onEdit: (item: AchievementItem) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-700 pb-4">
        <h2 className="text-lg font-bold text-white">Honors & Achievements</h2>
        <button
          onClick={onAdd}
          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          + Add Achievement
        </button>
      </div>

      {achievements.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">No honors or achievements added yet.</div>
      ) : (
        <div className="space-y-4">
          {achievements.map((ach) => (
            <div key={ach.id} className="bg-slate-700/40 rounded-xl border border-slate-700 p-5 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold text-white">{ach.title}</h3>
                    {ach.category && (
                      <span className="px-2 py-0.5 text-xs rounded-md bg-indigo-900/60 text-indigo-300 border border-indigo-600">
                        {ach.category}
                      </span>
                    )}
                  </div>
                  {ach.date && (
                    <p className="text-xs text-slate-400 mt-1">Date: {new Date(ach.date).toLocaleDateString()}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(ach)}
                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(ach.id)}
                    className="px-3 py-1 bg-red-900/40 hover:bg-red-800/60 border border-red-700 text-red-300 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {ach.description && <p className="text-sm text-slate-300">{ach.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Modal Dialogs ────────────────────────────────────────────────────────────

function ModalWrapper({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-lg bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function AcademicModal({ initialData, onClose, onSaved }: { initialData?: AcademicData | null; onClose: () => void; onSaved: () => void }) {
  const [degree, setDegree] = useState(initialData?.degree || '');
  const [branch, setBranch] = useState(initialData?.branch || '');
  const [collegeName, setCollegeName] = useState(initialData?.collegeName || '');
  const [graduationYear, setGraduationYear] = useState(initialData?.graduationYear ? String(initialData.graduationYear) : '');
  const [cgpa, setCgpa] = useState(initialData?.cgpa !== undefined ? String(initialData.cgpa) : '');
  const [backlogs, setBacklogs] = useState(initialData?.backlogs !== undefined ? String(initialData.backlogs) : '0');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const parsedCgpa = parseFloat(cgpa);
    if (isNaN(parsedCgpa) || parsedCgpa < 0 || parsedCgpa > 10) {
      setError('CGPA must be a number between 0 and 10.');
      return;
    }
    const parsedBacklogs = parseInt(backlogs, 10);
    if (isNaN(parsedBacklogs) || parsedBacklogs < 0) {
      setError('Backlogs cannot be negative.');
      return;
    }

    setLoading(true);
    try {
      await studentService.updateAcademics({
        degree,
        branch,
        collegeName,
        graduationYear: parseInt(graduationYear, 10),
        cgpa: parsedCgpa,
        backlogs: parsedBacklogs,
      });
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save academic info.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper title={initialData ? 'Edit Academic Details' : 'Add Academic Details'} onClose={onClose}>
      {error && <div className="p-3 bg-red-900/40 border border-red-500 rounded-lg text-red-300 text-xs">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL_STYLE}>Degree *</label>
            <input value={degree} onChange={(e) => setDegree(e.target.value)} required placeholder="B.Tech" className={INPUT_STYLE} />
          </div>
          <div>
            <label className={LABEL_STYLE}>Branch *</label>
            <input value={branch} onChange={(e) => setBranch(e.target.value)} required placeholder="CSE" className={INPUT_STYLE} />
          </div>
        </div>

        <div>
          <label className={LABEL_STYLE}>College Name *</label>
          <input value={collegeName} onChange={(e) => setCollegeName(e.target.value)} required placeholder="CMR Technical Campus" className={INPUT_STYLE} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={LABEL_STYLE}>Graduation Year *</label>
            <input type="number" value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} required placeholder="2027" className={INPUT_STYLE} />
          </div>
          <div>
            <label className={LABEL_STYLE}>CGPA (0-10) *</label>
            <input type="number" step="0.01" value={cgpa} onChange={(e) => setCgpa(e.target.value)} required placeholder="8.5" className={INPUT_STYLE} />
          </div>
          <div>
            <label className={LABEL_STYLE}>Backlogs *</label>
            <input type="number" value={backlogs} onChange={(e) => setBacklogs(e.target.value)} required placeholder="0" className={INPUT_STYLE} />
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-700 text-white rounded-lg text-xs font-medium hover:bg-slate-600">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-500 disabled:opacity-50">
            {loading ? 'Saving…' : 'Save Academics'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

function SkillModal({ initialData, onClose, onSaved }: { initialData?: SkillItem | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(initialData?.skill.name || '');
  const [category, setCategory] = useState(initialData?.skill.category || '');
  const [rating, setRating] = useState<ProficiencyLevel>(initialData?.selfRating || 'BEGINNER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (initialData) {
        await studentService.updateSkill(initialData.id, { selfRating: rating });
      } else {
        await studentService.addSkill({ name, category: category || undefined, selfRating: rating });
      }
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save skill.'));
    } finally {
      setLoading(false);
    }
  };
  return (
    <ModalWrapper title={initialData ? `Edit Skill: ${initialData.skill.name}` : 'Add New Skill'} onClose={onClose}>
      {error && <div className="p-3 bg-red-900/40 border border-red-500 rounded-lg text-red-300 text-xs">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {!initialData && (
          <>
            <div>
              <label className={LABEL_STYLE}>Skill Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. React, Python, SQL" className={INPUT_STYLE} />
            </div>
            <div>
              <label className={LABEL_STYLE}>Category (Optional)</label>
              <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Frontend, Database" className={INPUT_STYLE} />
            </div>
          </>
        )}

        <div>
          <label className={LABEL_STYLE}>Self Rating *</label>
          <select value={rating} onChange={(e) => setRating(e.target.value as ProficiencyLevel)} className={INPUT_STYLE}>
            <option value="BEGINNER">BEGINNER</option>
            <option value="INTERMEDIATE">INTERMEDIATE</option>
            <option value="ADVANCED">ADVANCED</option>
            <option value="EXPERT">EXPERT</option>
          </select>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-700 text-white rounded-lg text-xs font-medium hover:bg-slate-600">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-500 disabled:opacity-50">
            {loading ? 'Saving…' : 'Save Skill'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

function ProjectModal({ initialData, onClose, onSaved }: { initialData?: ProjectItem | null; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [techStackStr, setTechStackStr] = useState(initialData?.techStack ? initialData.techStack.join(', ') : '');
  const [repoUrl, setRepoUrl] = useState(initialData?.repoUrl || '');
  const [liveUrl, setLiveUrl] = useState(initialData?.liveUrl || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const techStack = techStackStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (techStack.length === 0) {
      setError('Please provide at least one tech stack item.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title,
        description,
        techStack,
        repoUrl: repoUrl || undefined,
        liveUrl: liveUrl || undefined,
      };

      if (initialData) {
        await studentService.updateProject(initialData.id, payload);
      } else {
        await studentService.addProject(payload);
      }
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save project.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper title={initialData ? 'Edit Project' : 'Add New Project'} onClose={onClose}>
      {error && <div className="p-3 bg-red-900/40 border border-red-500 rounded-lg text-red-300 text-xs">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={LABEL_STYLE}>Project Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Placement Nexus Portal" className={INPUT_STYLE} />
        </div>

        <div>
          <label className={LABEL_STYLE}>Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={3}
            placeholder="Describe what you built and key features…"
            className={`${INPUT_STYLE} resize-none`}
          />
        </div>

        <div>
          <label className={LABEL_STYLE}>Tech Stack (Comma-separated) *</label>
          <input value={techStackStr} onChange={(e) => setTechStackStr(e.target.value)} required placeholder="React, Node.js, PostgreSQL" className={INPUT_STYLE} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL_STYLE}>Repository URL</label>
            <input value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://github.com/..." className={INPUT_STYLE} />
          </div>
          <div>
            <label className={LABEL_STYLE}>Live Demo URL</label>
            <input value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} placeholder="https://myproject.com" className={INPUT_STYLE} />
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-700 text-white rounded-lg text-xs font-medium hover:bg-slate-600">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-500 disabled:opacity-50">
            {loading ? 'Saving…' : 'Save Project'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

function InternshipModal({ initialData, onClose, onSaved }: { initialData?: InternshipItem | null; onClose: () => void; onSaved: () => void }) {
  const [companyName, setCompanyName] = useState(initialData?.companyName || '');
  const [role, setRole] = useState(initialData?.role || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [startDate, setStartDate] = useState(initialData?.startDate ? initialData.startDate.slice(0, 10) : '');
  const [endDate, setEndDate] = useState(initialData?.endDate ? initialData.endDate.slice(0, 10) : '');
  const [isOngoing, setIsOngoing] = useState(initialData?.isOngoing || false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        companyName,
        role,
        description: description || undefined,
        startDate,
        endDate: isOngoing ? undefined : endDate || undefined,
        isOngoing,
      };

      if (initialData) {
        await studentService.updateInternship(initialData.id, payload);
      } else {
        await studentService.addInternship(payload);
      }
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save internship.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper title={initialData ? 'Edit Internship' : 'Add Internship'} onClose={onClose}>
      {error && <div className="p-3 bg-red-900/40 border border-red-500 rounded-lg text-red-300 text-xs">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL_STYLE}>Company Name *</label>
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required placeholder="Google" className={INPUT_STYLE} />
          </div>
          <div>
            <label className={LABEL_STYLE}>Role *</label>
            <input value={role} onChange={(e) => setRole(e.target.value)} required placeholder="SDE Intern" className={INPUT_STYLE} />
          </div>
        </div>

        <div>
          <label className={LABEL_STYLE}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Key responsibilities and achievements…"
            className={`${INPUT_STYLE} resize-none`}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL_STYLE}>Start Date *</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className={INPUT_STYLE} />
          </div>
          <div>
            <label className={LABEL_STYLE}>End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={isOngoing} className={`${INPUT_STYLE} disabled:opacity-50`} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="ongoing"
            checked={isOngoing}
            onChange={(e) => setIsOngoing(e.target.checked)}
            className="rounded border-slate-600 bg-slate-700 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="ongoing" className="text-xs text-slate-300">Currently working here (Ongoing)</label>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-700 text-white rounded-lg text-xs font-medium hover:bg-slate-600">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-500 disabled:opacity-50">
            {loading ? 'Saving…' : 'Save Experience'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

function CertificationModal({ initialData, onClose, onSaved }: { initialData?: CertificationItem | null; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [issuingOrg, setIssuingOrg] = useState(initialData?.issuingOrg || '');
  const [issueDate, setIssueDate] = useState(initialData?.issueDate ? initialData.issueDate.slice(0, 10) : '');
  const [credentialUrl, setCredentialUrl] = useState(initialData?.credentialUrl || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        title,
        issuingOrg,
        issueDate,
        credentialUrl: credentialUrl || undefined,
      };

      if (initialData) {
        await studentService.updateCertification(initialData.id, payload);
      } else {
        await studentService.addCertification(payload);
      }
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save certification.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper title={initialData ? 'Edit Certification' : 'Add Certification'} onClose={onClose}>
      {error && <div className="p-3 bg-red-900/40 border border-red-500 rounded-lg text-red-300 text-xs">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={LABEL_STYLE}>Certification Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="AWS Certified Solutions Architect" className={INPUT_STYLE} />
        </div>

        <div>
          <label className={LABEL_STYLE}>Issuing Organization *</label>
          <input value={issuingOrg} onChange={(e) => setIssuingOrg(e.target.value)} required placeholder="Amazon Web Services" className={INPUT_STYLE} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL_STYLE}>Issue Date *</label>
            <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required className={INPUT_STYLE} />
          </div>
          <div>
            <label className={LABEL_STYLE}>Credential URL</label>
            <input value={credentialUrl} onChange={(e) => setCredentialUrl(e.target.value)} placeholder="https://aws.amazon.com/verify/..." className={INPUT_STYLE} />
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-700 text-white rounded-lg text-xs font-medium hover:bg-slate-600">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-500 disabled:opacity-50">
            {loading ? 'Saving…' : 'Save Certification'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

function AchievementModal({ initialData, onClose, onSaved }: { initialData?: AchievementItem | null; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [date, setDate] = useState(initialData?.date ? initialData.date.slice(0, 10) : '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        title,
        category: category || undefined,
        description: description || undefined,
        date: date || undefined,
      };

      if (initialData) {
        await studentService.updateAchievement(initialData.id, payload);
      } else {
        await studentService.addAchievement(payload);
      }
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save achievement.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper title={initialData ? 'Edit Achievement' : 'Add Achievement'} onClose={onClose}>
      {error && <div className="p-3 bg-red-900/40 border border-red-500 rounded-lg text-red-300 text-xs">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={LABEL_STYLE}>Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Hackathon 1st Winner" className={INPUT_STYLE} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL_STYLE}>Category</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Hackathon, Award" className={INPUT_STYLE} />
          </div>
          <div>
            <label className={LABEL_STYLE}>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={INPUT_STYLE} />
          </div>
        </div>

        <div>
          <label className={LABEL_STYLE}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Details about the honor or rank secured…"
            className={`${INPUT_STYLE} resize-none`}
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-700 text-white rounded-lg text-xs font-medium hover:bg-slate-600">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-500 disabled:opacity-50">
            {loading ? 'Saving…' : 'Save Achievement'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

// ─── Phase 5: Resumes & Profiles Sub-Sections & Modals ────────────────────────

function ProfilesAndResumesSection({
  resumes,
  professionalProfiles,
  codingProfiles,
  onRefresh,
  onAddProf,
  onEditProf,
  onAddCoding,
  onEditCoding,
}: {
  resumes: ResumeItem[];
  professionalProfiles: ProfessionalProfileItem[];
  codingProfiles: CodingProfileItem[];
  onRefresh: () => void;
  onAddProf: () => void;
  onEditProf: (item: ProfessionalProfileItem) => void;
  onAddCoding: () => void;
  onEditCoding: (item: CodingProfileItem) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [resumeError, setResumeError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleUploadResume = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setResumeError('Please select a PDF file to upload.');
      return;
    }
    try {
      setResumeError('');
      setUploading(true);
      await studentService.uploadResume(selectedFile);
      setSelectedFile(null);
      const fileInput = document.getElementById('resumeFileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      onRefresh();
    } catch (err: any) {
      setResumeError(getErrorMessage(err, 'Failed to upload resume.'));
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      setResumeError('');
      await studentService.setPrimaryResume(id);
      onRefresh();
    } catch (err: any) {
      setResumeError(getErrorMessage(err, 'Failed to set primary resume.'));
    }
  };

  const handleDeleteResume = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;
    try {
      setResumeError('');
      await studentService.deleteResume(id);
      onRefresh();
    } catch (err: any) {
      setResumeError(getErrorMessage(err, 'Failed to delete resume.'));
    }
  };

  const handleDeleteProf = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this professional profile?')) return;
    try {
      await studentService.deleteProfessionalProfile(id);
      onRefresh();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to delete professional profile.'));
    }
  };

  const handleDeleteCoding = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this coding profile?')) return;
    try {
      await studentService.deleteCodingProfile(id);
      onRefresh();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to delete coding profile.'));
    }
  };

  return (
    <div className="space-y-8">
      {/* ── Section 1: Resumes ──────────────────────────────────── */}
      <div className="space-y-4">
        <div className="border-b border-slate-700 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>📄</span> Resumes
            </h2>
            <p className="text-xs text-slate-400">Upload your PDF resumes. Maximum 5MB per file.</p>
          </div>
        </div>

        {resumeError && (
          <div className="p-3 bg-red-900/40 border border-red-500 rounded-lg text-red-300 text-xs flex items-center justify-between">
            <span>{resumeError}</span>
            <button onClick={() => setResumeError('')} className="text-red-400 hover:text-white ml-2">✕</button>
          </div>
        )}

        {/* Upload form */}
        <form onSubmit={handleUploadResume} className="bg-slate-700/30 p-4 rounded-xl border border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            id="resumeFileInput"
            type="file"
            accept=".pdf"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setSelectedFile(e.target.files[0]);
                setResumeError('');
              }
            }}
            className="block w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-indigo-300 hover:file:bg-slate-600 cursor-pointer"
          />
          <button
            type="submit"
            disabled={uploading || !selectedFile}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors whitespace-nowrap flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <span className="animate-spin">⏳</span> Uploading…
              </>
            ) : (
              'Upload Resume'
            )}
          </button>
        </form>

        {/* Resumes list */}
        {resumes.length === 0 ? (
          <div className="text-center py-6 bg-slate-800/40 rounded-xl border border-dashed border-slate-700 text-slate-400 text-xs">
            No resumes uploaded yet. Upload a PDF resume above.
          </div>
        ) : (
          <div className="space-y-2">
            {resumes.map((r) => (
              <div
                key={r.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-700/40 rounded-xl border border-slate-700 gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-red-900/30 text-red-400 flex items-center justify-center font-bold text-xs shrink-0 border border-red-800/50">
                    PDF
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm truncate">{r.fileName}</span>
                      {r.isPrimary && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-500/60 uppercase tracking-wider">
                          Primary
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 block">
                      Uploaded on {new Date(r.uploadedAt).toLocaleDateString()} • {(r.fileSizeBytes / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!r.isPrimary && (
                    <button
                      onClick={() => handleSetPrimary(r.id)}
                      className="px-2.5 py-1 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-indigo-300 rounded-lg transition-colors"
                    >
                      Set as Primary
                    </button>
                  )}
                  <a
                    href={r.fileUrl.startsWith('http') ? r.fileUrl : `http://localhost:5000${r.fileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 text-xs font-semibold bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-300 border border-indigo-700/60 rounded-lg transition-colors flex items-center gap-1"
                  >
                    View ↗
                  </a>
                  <button
                    onClick={() => handleDeleteResume(r.id)}
                    className="px-2 py-1 text-xs font-semibold bg-red-900/30 hover:bg-red-800/50 text-red-300 border border-red-700/40 rounded-lg transition-colors"
                    title="Delete resume"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Section 2: Professional Profiles ────────────────────── */}
      <div className="space-y-4 pt-4 border-t border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>💼</span> Professional Profiles
            </h2>
            <p className="text-xs text-slate-400">Link your LinkedIn or portfolio profiles.</p>
          </div>
          <button
            onClick={onAddProf}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            + Add Profile
          </button>
        </div>

        {professionalProfiles.length === 0 ? (
          <div className="text-center py-6 bg-slate-800/40 rounded-xl border border-dashed border-slate-700 text-slate-400 text-xs">
            No professional profiles added yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {professionalProfiles.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3.5 bg-slate-700/40 rounded-xl border border-slate-700"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl">💼</span>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-indigo-400 uppercase tracking-wider block">{p.platform}</span>
                    <a
                      href={p.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-200 hover:text-white truncate block underline underline-offset-2"
                    >
                      {p.profileUrl}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onEditProf(p)}
                    className="p-1 text-slate-300 hover:text-white transition-colors text-xs"
                    title="Edit profile"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => handleDeleteProf(p.id)}
                    className="p-1 text-red-400 hover:text-red-300 transition-colors text-xs"
                    title="Delete profile"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Section 3: Coding Profiles ──────────────────────────── */}
      <div className="space-y-4 pt-4 border-t border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>💻</span> Coding Profiles
            </h2>
            <p className="text-xs text-slate-400">Showcase your GitHub, LeetCode, or competitive coding profiles.</p>
          </div>
          <button
            onClick={onAddCoding}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            + Add Coding Profile
          </button>
        </div>

        {codingProfiles.length === 0 ? (
          <div className="text-center py-6 bg-slate-800/40 rounded-xl border border-dashed border-slate-700 text-slate-400 text-xs">
            No coding profiles added yet.
          </div>
        ) : (
          <div className="space-y-3">
            {codingProfiles.map((cp) => (
              <div
                key={cp.id}
                className="p-4 bg-slate-700/40 rounded-xl border border-slate-700 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {cp.platform === 'GITHUB' ? '🐙' : cp.platform === 'LEETCODE' ? '🧩' : '💻'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{cp.platform}</span>
                        <span className="text-xs text-indigo-300 font-mono">@{cp.username}</span>
                        <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-400 rounded-full border border-slate-600">
                          {cp.syncStatus}
                        </span>
                      </div>
                      <a
                        href={cp.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-slate-400 hover:text-slate-200 block truncate"
                      >
                        {cp.profileUrl}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEditCoding(cp)}
                      className="px-2.5 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-indigo-300 rounded-lg transition-colors"
                    >
                      ✎ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCoding(cp.id)}
                      className="px-2.5 py-1 text-xs bg-red-900/30 hover:bg-red-800/50 text-red-300 rounded-lg transition-colors"
                    >
                      ✕ Delete
                    </button>
                  </div>
                </div>

                {/* Key stats pills */}
                {cp.statistics && typeof cp.statistics === 'object' && Object.keys(cp.statistics).length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-700/60">
                    {Object.entries(cp.statistics).map(([key, val]) => (
                      <span
                        key={key}
                        className="px-2.5 py-1 bg-slate-800/80 border border-slate-600/80 rounded-lg text-xs font-mono text-slate-300"
                      >
                        <span className="text-indigo-400 font-semibold">{key}:</span> {String(val)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfessionalProfileModal({
  initialData,
  onClose,
  onSaved,
}: {
  initialData?: ProfessionalProfileItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [platform, setPlatform] = useState(initialData?.platform || 'LINKEDIN');
  const [profileUrl, setProfileUrl] = useState(initialData?.profileUrl || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!initialData;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      if (isEdit) {
        await studentService.updateProfessionalProfile(initialData.id, { profileUrl });
      } else {
        await studentService.addProfessionalProfile({ platform, profileUrl });
      }
      onSaved();
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to save professional profile.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper title={isEdit ? 'Edit Professional Profile' : 'Add Professional Profile'} onClose={onClose}>
      {error && <div className="p-3 bg-red-900/40 border border-red-500 rounded-lg text-red-300 text-xs">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={LABEL_STYLE}>Platform</label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            disabled={isEdit}
            className={INPUT_STYLE}
          >
            <option value="LINKEDIN">LinkedIn</option>
            <option value="PORTFOLIO">Portfolio / Personal Website</option>
            <option value="TWITTER">Twitter / X</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div>
          <label className={LABEL_STYLE}>Profile URL *</label>
          <input
            type="url"
            required
            placeholder="https://linkedin.com/in/yourname"
            value={profileUrl}
            onChange={(e) => setProfileUrl(e.target.value)}
            className={INPUT_STYLE}
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-700 text-white rounded-lg text-xs font-medium hover:bg-slate-600">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-500 disabled:opacity-50">
            {loading ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

function CodingProfileModal({
  initialData,
  onClose,
  onSaved,
}: {
  initialData?: CodingProfileItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [platform, setPlatform] = useState(initialData?.platform || 'GITHUB');
  const [username, setUsername] = useState(initialData?.username || '');
  const [profileUrl, setProfileUrl] = useState(initialData?.profileUrl || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [statRows, setStatRows] = useState<Array<{ key: string; value: string }>>(() => {
    if (initialData?.statistics && typeof initialData.statistics === 'object') {
      const entries = Object.entries(initialData.statistics);
      if (entries.length > 0) {
        return entries.map(([k, v]) => ({ key: k, value: String(v) }));
      }
    }
    return [{ key: '', value: '' }];
  });

  const isEdit = !!initialData;

  const handleAddStatRow = () => {
    setStatRows((prev) => [...prev, { key: '', value: '' }]);
  };

  const handleRemoveStatRow = (index: number) => {
    setStatRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStatChange = (index: number, field: 'key' | 'value', val: string) => {
    setStatRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);

      const statistics: Record<string, any> = {};
      for (const row of statRows) {
        const k = row.key.trim();
        const v = row.value.trim();
        if (k) {
          statistics[k] = !isNaN(Number(v)) && v !== '' ? Number(v) : v;
        }
      }

      if (isEdit) {
        await studentService.updateCodingProfile(initialData.id, {
          username,
          profileUrl,
          statistics,
        });
      } else {
        await studentService.addCodingProfile({
          platform,
          username,
          profileUrl,
          statistics,
        });
      }
      onSaved();
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to save coding profile.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper title={isEdit ? 'Edit Coding Profile' : 'Add Coding Profile'} onClose={onClose}>
      {error && <div className="p-3 bg-red-900/40 border border-red-500 rounded-lg text-red-300 text-xs">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={LABEL_STYLE}>Platform</label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            disabled={isEdit}
            className={INPUT_STYLE}
          >
            <option value="GITHUB">GitHub</option>
            <option value="LEETCODE">LeetCode</option>
            <option value="CODECHEF">CodeChef</option>
            <option value="HACKERRANK">HackerRank</option>
            <option value="CODEFORCES">Codeforces</option>
            <option value="GEEKSFORGEEKS">GeeksforGeeks</option>
          </select>
        </div>

        <div>
          <label className={LABEL_STYLE}>Username *</label>
          <input
            type="text"
            required
            placeholder="e.g. octocat"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={INPUT_STYLE}
          />
        </div>

        <div>
          <label className={LABEL_STYLE}>Profile URL *</label>
          <input
            type="url"
            required
            placeholder="https://github.com/octocat"
            value={profileUrl}
            onChange={(e) => setProfileUrl(e.target.value)}
            className={INPUT_STYLE}
          />
        </div>

        {/* Statistics Key-Value Pairs */}
        <div className="space-y-2 pt-2 border-t border-slate-700">
          <div className="flex justify-between items-center">
            <label className={LABEL_STYLE}>Statistics (Key-Value Pairs)</label>
            <button
              type="button"
              onClick={handleAddStatRow}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              + Add Stat Row
            </button>
          </div>

          {statRows.map((row, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Key (e.g. repos)"
                value={row.key}
                onChange={(e) => handleStatChange(idx, 'key', e.target.value)}
                className={`${INPUT_STYLE} text-xs py-1.5`}
              />
              <input
                type="text"
                placeholder="Value (e.g. 42)"
                value={row.value}
                onChange={(e) => handleStatChange(idx, 'value', e.target.value)}
                className={`${INPUT_STYLE} text-xs py-1.5`}
              />
              {statRows.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveStatRow(idx)}
                  className="p-1 text-red-400 hover:text-red-300 text-xs shrink-0"
                  title="Remove stat"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-700 text-white rounded-lg text-xs font-medium hover:bg-slate-600">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-500 disabled:opacity-50">
            {loading ? 'Saving…' : 'Save Coding Profile'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

