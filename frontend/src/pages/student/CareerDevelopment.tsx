import { useState, useEffect } from 'react';
import * as careerService from '../../services/careerService';
import { getErrorMessage } from '../../utils/error';
import AppLayout from '../../components/layout/AppLayout';
import { PageHeader, LoadingState, ErrorState, Card, Badge, EmptyState, Button, InfoBanner } from '../../components/ui';
import { BookOpen, Target, CheckCircle2, ChevronRight, Bookmark, BrainCircuit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CareerDevelopment() {
  const [careerPaths, setCareerPaths] = useState<careerService.CareerPath[]>([]);
  const [primaryGoal, setPrimaryGoal] = useState<careerService.StudentCareerGoal | null>(null);
  const [learningResources, setLearningResources] = useState<careerService.LearningResource[]>([]);
  const [selectedPath, setSelectedPath] = useState<careerService.CareerPath | null>(null);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [paths, goalRes, resources] = await Promise.all([
        careerService.getCareerPaths(),
        careerService.getMyCareerGoal(),
        careerService.getLearningResources(),
      ]);

      setCareerPaths(paths);
      setPrimaryGoal(goalRes.primaryGoal);
      setLearningResources(resources);

      if (goalRes.primaryGoal) {
        const fullPath = paths.find((p) => p.id === goalRes.primaryGoal?.careerPathId);
        setSelectedPath(fullPath || paths[0] || null);
      } else if (paths.length > 0) {
        setSelectedPath(paths[0]);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectGoal(pathId: string) {
    setActionLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const updatedGoal = await careerService.setMyCareerGoal(pathId);
      setPrimaryGoal(updatedGoal);
      setSuccessMsg(`Your career goal has been set to "${updatedGoal.careerPath.name}".`);

      const fullPath = careerPaths.find((p) => p.id === pathId);
      if (fullPath) setSelectedPath(fullPath);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  function getPriorityVariant(priority: string) {
    switch (priority) {
      case 'CRITICAL': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'brand';
      default: return 'neutral';
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <LoadingState message="Loading Career Intelligence…" />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Career Intelligence & Pathing"
          subtitle="Set your target career track, analyze skill priorities, and access recommended learning resources."
        />

        {error && <ErrorState message={error} onRetry={loadData} />}
        
        {successMsg && (
          <InfoBanner
            type="success"
            title="Goal Updated"
            message={successMsg}
            />
        )}

        {/* Current Active Goal Banner */}
        <Card style={{ 
          background: 'linear-gradient(135deg, var(--surface-2) 0%, var(--surface-1) 100%)',
          borderLeft: '4px solid var(--brand)',
          padding: '2rem'
        }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center space-x-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-brand animate-pulse" style={{ backgroundColor: 'var(--brand)' }}></span>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--brand-light)' }}>Active Target Goal</span>
              </div>
              {primaryGoal ? (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{primaryGoal.careerPath.name}</h2>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {primaryGoal.careerPath.description || 'Target career track active. Aligning skills and readiness analytics.'}
                  </p>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--warning)' }}>No Target Goal Selected</h2>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Select a career path below to customize your skill analysis and learning roadmap.
                  </p>
                </div>
              )}
            </div>

            {primaryGoal && (
              <div className="text-left md:text-right flex flex-col md:items-end justify-center">
                <span className="text-xs uppercase tracking-wider font-bold mb-1" style={{ color: 'var(--text-muted)' }}>Required Skills</span>
                <span className="text-3xl font-black mb-4" style={{ color: 'var(--brand-light)' }}>
                  {primaryGoal.careerPath.skillRequirements?.length || 0}
                </span>
                <Button 
                  variant="primary" 
                  onClick={() => navigate('/student/skill-gap')}
                  leftIcon={<BrainCircuit size={16} />}
                >
                  Analyze Skill Gap
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Main Grid: Path Selector & Path Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="lg:grid-cols-3">
          
          {/* Left Column: Path Selector */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-lg font-bold flex items-center justify-between" style={{ color: 'var(--text-primary)' }}>
              <span>Available Paths</span>
              <Badge variant="neutral">{careerPaths.length}</Badge>
            </h3>

            <div className="space-y-3">
              {careerPaths.map((path) => {
                const isGoal = primaryGoal?.careerPathId === path.id;
                const isSelected = selectedPath?.id === path.id;

                return (
                  <div
                    key={path.id}
                    onClick={() => setSelectedPath(path)}
                    style={{
                      padding: '1.25rem',
                      borderRadius: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      border: isSelected ? '1px solid var(--brand)' : '1px solid var(--border-subtle)',
                      background: isSelected ? 'var(--surface-2)' : 'var(--surface-1)',
                      boxShadow: isSelected ? '0 4px 12px var(--shadow-color)' : 'none'
                    }}
                    className="hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{path.name}</h4>
                      {isGoal && (
                        <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                      )}
                    </div>
                    <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{path.description}</p>
                    
                    <div className="mt-3 pt-3 flex items-center justify-between text-xs" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{path.skillRequirements?.length || 0} Core Skills</span>
                      {!isGoal && (
                        <Button 
                          variant={isSelected ? 'primary' : 'outline'} 
                          size="sm"
                          disabled={actionLoading}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectGoal(path.id);
                          }}
                        >
                          Set Goal
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Path Details & Skill Breakdown */}
          <div className="lg:col-span-2 space-y-6">
            {selectedPath ? (
              <Card style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '2rem', borderBottom: '1px solid var(--border-subtle)' }} className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{selectedPath.name}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{selectedPath.description}</p>
                  </div>
                  {primaryGoal?.careerPathId !== selectedPath.id && (
                    <Button
                      variant="primary"
                      disabled={actionLoading}
                      onClick={() => handleSelectGoal(selectedPath.id)}
                      leftIcon={<Target size={18} />}
                    >
                      {actionLoading ? 'Updating…' : 'Set as Target Goal'}
                    </Button>
                  )}
                </div>

                {/* Required Skills */}
                <div style={{ padding: '2rem', borderBottom: '1px solid var(--border-subtle)' }}>
                  <h4 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
                    Required Skills & Priorities
                  </h4>
                  {selectedPath.skillRequirements && selectedPath.skillRequirements.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                      {selectedPath.skillRequirements.map((req) => (
                        <div
                          key={req.id}
                          style={{
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            background: 'var(--surface-2)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div>
                            <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{req.skill.name}</div>
                            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Target: {req.requiredLevel}</div>
                          </div>
                          <Badge variant={getPriorityVariant(req.priority) as any}>
                            {req.priority}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>No specific skill requirements defined for this path yet.</p>
                  )}
                </div>

                {/* Recommended Resources */}
                <div style={{ padding: '2rem', background: 'var(--surface-2)' }}>
                  <h4 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <BookOpen size={16} /> Recommended Learning
                  </h4>
                  {learningResources.length > 0 ? (
                    <div className="space-y-3">
                      {learningResources.map((res) => (
                        <a
                          key={res.id}
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'block',
                            padding: '1.25rem',
                            borderRadius: '0.5rem',
                            background: 'var(--surface-1)',
                            border: '1px solid var(--border-subtle)',
                            textDecoration: 'none',
                            transition: 'all 0.2s ease'
                          }}
                          className="hover:border-brand hover:shadow-md group"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="brand">{res.resourceType}</Badge>
                                {res.provider && (
                                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>by {res.provider}</span>
                                )}
                              </div>
                              <h5 className="font-bold text-sm mb-1 group-hover:text-brand-light transition-colors" style={{ color: 'var(--text-primary)' }}>{res.title}</h5>
                              {res.description && <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{res.description}</p>}
                            </div>
                            <div style={{ color: 'var(--text-muted)' }} className="group-hover:text-brand-light transition-colors group-hover:translate-x-1">
                              <ChevronRight size={20} />
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>No learning resources cataloged yet.</p>
                  )}
                </div>
              </Card>
            ) : (
              <Card style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                <EmptyState
                  icon={<Bookmark size={48} style={{ color: 'var(--text-muted)' }} />}
                  title="Select a Career Path"
                  description="Choose a career path from the list to view its detailed requirements and learning roadmap."
                />
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
