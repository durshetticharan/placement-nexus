import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import {
  triggerSkillGapAnalysis,
  getSkillGapAnalysis,
  type SkillGapResult,
  type SavedSkillGap,
  type GapSummary,
  type ComputeGapResponse,
} from '../../services/skillGapService';

// ── Gap level config ──────────────────────────────────────────────────────────

const GAP_CONFIG = {
  STRONG: {
    label: 'Strong',
    emoji: '✅',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.10)',
    border: 'rgba(34,197,94,0.30)',
    badge: '#15803d',
    badgeBg: 'rgba(34,197,94,0.15)',
    barColor: '#22c55e',
    description: 'Well demonstrated — keep it up!',
  },
  MODERATE: {
    label: 'Moderate',
    emoji: '🟡',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.10)',
    border: 'rgba(245,158,11,0.30)',
    badge: '#92400e',
    badgeBg: 'rgba(245,158,11,0.15)',
    barColor: '#f59e0b',
    description: 'Some evidence — room for growth',
  },
  WEAK: {
    label: 'Weak',
    emoji: '🔴',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.10)',
    border: 'rgba(239,68,68,0.30)',
    badge: '#7f1d1d',
    badgeBg: 'rgba(239,68,68,0.15)',
    barColor: '#ef4444',
    description: 'Needs focused practice',
  },
  MISSING: {
    label: 'Missing',
    emoji: '⚫',
    color: '#6b7280',
    bg: 'rgba(107,114,128,0.10)',
    border: 'rgba(107,114,128,0.25)',
    badge: '#374151',
    badgeBg: 'rgba(107,114,128,0.15)',
    barColor: '#4b5563',
    description: 'No evidence found — start here',
  },
} as const;

const PRIORITY_CONFIG = {
  CRITICAL: { label: 'Critical', color: '#ef4444' },
  HIGH: { label: 'High', color: '#f59e0b' },
  MEDIUM: { label: 'Medium', color: '#3b82f6' },
  LOW: { label: 'Low', color: '#6b7280' },
} as const;

// ── Sub-components ────────────────────────────────────────────────────────────

function ScoreBar({ score, color }: { score: number; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(score), 100);
    return () => clearTimeout(t);
  }, [score]);

  return (
    <div style={{
      width: '100%',
      height: '8px',
      borderRadius: '4px',
      background: 'rgba(255,255,255,0.08)',
      overflow: 'hidden',
    }}>
      <div style={{
        width: `${width}%`,
        height: '100%',
        borderRadius: '4px',
        background: color,
        transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: `0 0 8px ${color}66`,
      }} />
    </div>
  );
}

function SummaryCard({ label, count, level }: { label: string; count: number; level: keyof typeof GAP_CONFIG }) {
  const cfg = GAP_CONFIG[level];
  return (
    <div style={{
      flex: '1 1 120px',
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: '14px',
      padding: '16px',
      textAlign: 'center',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{ fontSize: '28px', fontWeight: 800, color: cfg.color, lineHeight: 1 }}>{count}</div>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
    </div>
  );
}

interface GapCardProps {
  gap: SkillGapResult | SavedSkillGap;
  isFresh: boolean;
}

function GapCard({ gap, isFresh }: GapCardProps) {
  const [open, setOpen] = useState(false);
  const cfg = GAP_CONFIG[gap.gapLevel];
  const priCfg = PRIORITY_CONFIG[gap.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.MEDIUM;

  // Normalise: fresh results have `evidence`, saved results have `contributingFactors`
  const evidence = isFresh ? (gap as SkillGapResult).evidence : null;
  const factors = !isFresh ? (gap as SavedSkillGap).contributingFactors : null;
  const resources = !isFresh ? (gap as SavedSkillGap).suggestedResources : [];

  const skillName = isFresh
    ? (gap as SkillGapResult).skillName
    : (gap as SavedSkillGap).skill.name;

  const skillCategory = isFresh
    ? (gap as SkillGapResult).skillCategory
    : (gap as SavedSkillGap).skill.category;

  return (
    <div style={{
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: '18px',
      overflow: 'hidden',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px ${cfg.color}22`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      {/* Header row */}
      <div style={{ padding: '20px 24px', cursor: 'pointer' }} onClick={() => setOpen((o) => !o)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: `${cfg.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', flexShrink: 0,
          }}>
            {cfg.emoji}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>{skillName}</span>
              {skillCategory && (
                <span style={{
                  fontSize: '11px', color: 'rgba(255,255,255,0.40)', background: 'rgba(255,255,255,0.06)',
                  borderRadius: '6px', padding: '2px 8px',
                }}>{skillCategory}</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '12px', fontWeight: 600, color: cfg.color,
                background: cfg.badgeBg, borderRadius: '8px', padding: '2px 10px',
              }}>{cfg.label}</span>
              <span style={{
                fontSize: '12px', color: priCfg.color, background: `${priCfg.color}18`,
                borderRadius: '8px', padding: '2px 10px', fontWeight: 600,
              }}>{priCfg.label} Priority</span>
              <span style={{
                fontSize: '12px', color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.06)',
                borderRadius: '8px', padding: '2px 10px',
              }}>Requires: {(gap as SkillGapResult).requiredLevel ?? gap.priority}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '26px', fontWeight: 800, color: cfg.color }}>{gap.evidenceScore}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>/ 100</div>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '18px', flexShrink: 0 }}>
            {open ? '▲' : '▼'}
          </div>
        </div>
        <ScoreBar score={gap.evidenceScore} color={cfg.barColor} />
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.40)', marginTop: '6px' }}>{cfg.description}</div>
      </div>

      {/* Expandable evidence */}
      {open && (
        <div style={{
          borderTop: `1px solid ${cfg.border}`,
          padding: '20px 24px',
          display: 'flex', flexDirection: 'column', gap: '16px',
        }}>
          {/* Fresh computation: show full evidence */}
          {isFresh && evidence && (
            <>
              <h4 style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.60)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Evidence Breakdown</h4>

              {/* Weights row */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <EvidenceChip
                  label="Assessment"
                  score={evidence.assessmentScore}
                  weight={evidence.weightsUsed.assessment}
                  available={evidence.assessmentAvailable}
                  color="#818cf8"
                />
                <EvidenceChip
                  label="Self-rating"
                  score={evidence.selfRatingScore}
                  weight={evidence.weightsUsed.selfRating}
                  available={evidence.selfRatingAvailable}
                  color="#34d399"
                  extra={evidence.selfRatingLevel ?? undefined}
                />
                <EvidenceChip
                  label="Coding Activity"
                  score={evidence.codingScore}
                  weight={evidence.weightsUsed.coding}
                  available={evidence.codingAvailable}
                  color="#fb923c"
                />
              </div>

              {/* Assessment details */}
              {evidence.assessmentDetails.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginBottom: '8px' }}>Matched Assessments</div>
                  {evidence.assessmentDetails.map((det, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', marginBottom: '6px',
                    }}>
                      <div>
                        <span style={{ fontSize: '13px', color: '#f8fafc' }}>{det.title}</span>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginLeft: '8px' }}>({det.matchType} match)</span>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: det.percentage >= 75 ? '#22c55e' : det.percentage >= 50 ? '#f59e0b' : '#ef4444' }}>
                        {Math.round(det.percentage)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Coding details */}
              {evidence.codingDetails.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginBottom: '8px' }}>Coding Profiles</div>
                  {evidence.codingDetails.map((det, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', marginBottom: '6px',
                    }}>
                      <div>
                        <span style={{ fontSize: '13px', color: '#f8fafc' }}>{det.platform}</span>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginLeft: '8px' }}>@{det.username} · {det.signal}</span>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#fb923c' }}>{det.mappedScore}</span>
                    </div>
                  ))}
                </div>
              )}

              {!evidence.assessmentAvailable && !evidence.selfRatingAvailable && !evidence.codingAvailable && (
                <div style={{
                  padding: '14px', background: 'rgba(107,114,128,0.10)', borderRadius: '10px',
                  fontSize: '13px', color: 'rgba(255,255,255,0.45)', textAlign: 'center',
                }}>
                  No evidence found for this skill. Add it to your profile, take assessments, or link a coding platform.
                </div>
              )}
            </>
          )}

          {/* Saved results: show contributing factors */}
          {!isFresh && factors && (
            <>
              <h4 style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.60)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Contributing Factors</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <FactorRow label="Assessment Score" value={factors.assessmentPct != null ? `${factors.assessmentPct}%` : 'N/A'} />
                <FactorRow label="Self-Rating" value={String(factors.selfRating ?? 'Not set')} />
                <FactorRow label="Coding Activity" value={String(factors.codingActivity ?? 'None')} />
              </div>
              {Array.isArray(factors.matchedAssessments) && factors.matchedAssessments.length > 0 && (
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.40)' }}>
                  Assessments used: {(factors.matchedAssessments as string[]).join(', ')}
                </div>
              )}
            </>
          )}

          {/* Learning resources */}
          {!isFresh && resources.length > 0 && gap.gapLevel !== 'STRONG' && (
            <div>
              <h4 style={{ margin: '0 0 10px', fontSize: '13px', color: 'rgba(255,255,255,0.60)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                📚 Suggested Resources
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {resources.map((r) => (
                  <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 14px', background: 'rgba(99,102,241,0.10)',
                    border: '1px solid rgba(99,102,241,0.20)', borderRadius: '10px',
                    textDecoration: 'none', transition: 'background 0.2s',
                  }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(99,102,241,0.18)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(99,102,241,0.10)'; }}
                  >
                    <span style={{ fontSize: '18px' }}>
                      {r.resourceType === 'VIDEO' ? '🎬' : r.resourceType === 'COURSE' ? '🎓' : r.resourceType === 'ARTICLE' ? '📄' : '🔗'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#c7d2fe', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                      {r.provider && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>{r.provider}</div>}
                    </div>
                    <span style={{ fontSize: '12px', color: 'rgba(99,102,241,0.70)' }}>↗</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EvidenceChip({
  label, score, weight, available, color, extra,
}: {
  label: string; score: number | null; weight: number; available: boolean; color: string; extra?: string;
}) {
  return (
    <div style={{
      flex: '1 1 120px',
      background: available ? `${color}15` : 'rgba(255,255,255,0.04)',
      border: `1px solid ${available ? `${color}30` : 'rgba(255,255,255,0.08)'}`,
      borderRadius: '10px', padding: '12px', minWidth: '120px',
    }}>
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginBottom: '4px' }}>{label}</div>
      {available && score !== null ? (
        <>
          <div style={{ fontSize: '20px', fontWeight: 800, color }}>{score}</div>
          {extra && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>{extra}</div>}
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.30)', marginTop: '2px' }}>weight: {Math.round(weight * 100)}%</div>
        </>
      ) : (
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginTop: '4px' }}>No data</div>
      )}
    </div>
  );
}

function FactorRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '10px 12px' }}>
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.40)' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc', marginTop: '2px' }}>{value}</div>
    </div>
  );
}

// ── Radar SVG chart ───────────────────────────────────────────────────────────

function SkillRadarChart({ gaps }: { gaps: Array<{ skillName: string; score: number; gapLevel: string }> }) {
  if (gaps.length < 3) return null; // Need at least 3 points for a meaningful radar

  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 110;
  const n = Math.min(gaps.length, 8); // cap at 8 spokes for readability
  const displayGaps = gaps.slice(0, n);

  const angleStep = (2 * Math.PI) / n;
  const getPoint = (i: number, r: number) => ({
    x: cx + r * Math.sin(i * angleStep),
    y: cy - r * Math.cos(i * angleStep),
  });

  // Grid circles
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  // Data polygon
  const dataPoints = displayGaps.map((g, i) => getPoint(i, (g.score / 100) * maxR));
  const polyPoints = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', borderRadius: '20px',
      border: '1px solid rgba(255,255,255,0.08)', padding: '24px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: 'rgba(255,255,255,0.70)', fontWeight: 600, textAlign: 'center' }}>
        Skill Coverage Radar
      </h3>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid */}
        {gridLevels.map((level) =>
          <polygon key={level}
            points={Array.from({ length: n }, (_, i) => {
              const p = getPoint(i, level * maxR);
              return `${p.x},${p.y}`;
            }).join(' ')}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="1"
          />
        )}
        {/* Spokes */}
        {displayGaps.map((_, i) => {
          const outer = getPoint(i, maxR);
          return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y}
            stroke="rgba(255,255,255,0.07)" strokeWidth="1" />;
        })}
        {/* Data polygon */}
        <polygon
          points={polyPoints}
          fill="rgba(99,102,241,0.20)"
          stroke="#818cf8"
          strokeWidth="2"
        />
        {/* Data dots */}
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4}
            fill={GAP_CONFIG[displayGaps[i].gapLevel as keyof typeof GAP_CONFIG]?.barColor ?? '#6366f1'}
            stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"
          />
        ))}
        {/* Labels */}
        {displayGaps.map((g, i) => {
          const labelR = maxR + 22;
          const p = getPoint(i, labelR);
          return (
            <text key={i} x={p.x} y={p.y}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="10" fill="rgba(255,255,255,0.50)"
              style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              {g.skillName.length > 12 ? g.skillName.slice(0, 11) + '…' : g.skillName}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SkillGapAnalysis() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [freshResult, setFreshResult] = useState<ComputeGapResponse | null>(null);
  const [savedResult, setSavedResult] = useState<{ gaps: SavedSkillGap[]; summary: GapSummary; hasBeenComputed: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [activeView, setActiveView] = useState<'fresh' | 'saved'>('saved');

  // Fetch saved gaps on mount
  const fetchSaved = useCallback(async () => {
    try {
      setIsFetching(true);
      setError(null);
      const data = await getSkillGapAnalysis();
      setSavedResult(data);
    } catch {
      // No gaps yet — that's OK
      setSavedResult({ gaps: [], summary: { STRONG: 0, MODERATE: 0, WEAK: 0, MISSING: 0 }, hasBeenComputed: false });
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => { fetchSaved(); }, [fetchSaved]);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await triggerSkillGapAnalysis();
      setFreshResult(result);
      setActiveView('fresh');
      // Also refresh saved
      await fetchSaved();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Failed to compute skill gap analysis.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const displaySummary: GapSummary = freshResult?.summary ?? savedResult?.summary ?? { STRONG: 0, MODERATE: 0, WEAK: 0, MISSING: 0 };
  const displayGaps = activeView === 'fresh' && freshResult
    ? freshResult.gaps
    : (savedResult?.gaps ?? []);

  const filteredGaps = filterLevel === 'ALL'
    ? displayGaps
    : displayGaps.filter((g) => g.gapLevel === filterLevel);

  const hasData = activeView === 'fresh'
    ? (freshResult?.gaps.length ?? 0) > 0
    : (savedResult?.hasBeenComputed ?? false);

  const careerPathName = activeView === 'fresh' && freshResult
    ? freshResult.careerPath.name
    : null;

  const computedAt = activeView === 'fresh' && freshResult
    ? freshResult.computedAt
    : null;

  // Prepare radar data
  const radarGaps = displayGaps.map((g) => ({
    skillName: activeView === 'fresh'
      ? (g as SkillGapResult).skillName
      : (g as SavedSkillGap).skill.name,
    score: g.evidenceScore,
    gapLevel: g.gapLevel,
  }));

  return (
    <AppLayout>
      <div style={{
        position: 'relative',
        minHeight: '100%',
        color: '#f8fafc',
        overflow: 'hidden'
      }}>
        {/* Animated background blobs */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
          <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', top: '-100px', left: '-100px' }} />
          <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', bottom: '-80px', right: '-80px' }} />
          <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)', top: '40%', right: '20%' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '900px', margin: '0 auto', padding: '0 0 64px' }}>

          {/* Back nav */}
          <button
            onClick={() => navigate('/dashboard/student')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: '10px', padding: '8px 16px', color: 'rgba(255,255,255,0.65)',
              cursor: 'pointer', fontSize: '13px', marginBottom: '32px', transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { (e.currentTarget).style.background = 'rgba(255,255,255,0.10)'; }}
            onMouseLeave={(e) => { (e.currentTarget).style.background = 'rgba(255,255,255,0.06)'; }}
          >
            ← Back to Dashboard
          </button>

          {/* Hero header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: '100px', padding: '6px 18px', marginBottom: '20px',
            }}>
              <span style={{ fontSize: '16px' }}>🧠</span>
              <span style={{ fontSize: '13px', color: '#a5b4fc', fontWeight: 600, letterSpacing: '0.04em' }}>
                Phase 8 — Skill Gap Analysis
              </span>
            </div>
            <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 800, background: 'linear-gradient(135deg, #f8fafc 30%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Skill Gap Analysis
            </h1>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.50)', maxWidth: '520px', margin: '0 auto' }}>
              Evidence-based analysis of your skills against your career path requirements. Every score is explainable.
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.30)',
              borderRadius: '14px', padding: '16px 20px', marginBottom: '24px',
              display: 'flex', alignItems: 'flex-start', gap: '12px',
            }}>
              <span style={{ fontSize: '20px' }}>⚠️</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#fca5a5', marginBottom: '4px' }}>Analysis Failed</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>{error}</div>
              </div>
            </div>
          )}

          {/* Trigger button */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <button
              id="analyze-skill-gap-btn"
              onClick={handleAnalyze}
              disabled={isLoading}
              style={{
                padding: '14px 40px',
                background: isLoading ? 'rgba(99,102,241,0.30)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none', borderRadius: '14px',
                color: '#ffffff', fontSize: '15px', fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                boxShadow: isLoading ? 'none' : '0 8px 32px rgba(99,102,241,0.35)',
                transition: 'all 0.25s',
                display: 'inline-flex', alignItems: 'center', gap: '10px',
              }}
              onMouseEnter={(e) => { if (!isLoading) (e.currentTarget).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { (e.currentTarget).style.transform = 'translateY(0)'; }}
            >
              {isLoading ? (
                <>
                  <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Analyzing…
                </>
              ) : (
                <>🔍 {savedResult?.hasBeenComputed ? 'Re-analyze Skill Gaps' : 'Analyze My Skill Gaps'}</>
              )}
            </button>
            {savedResult?.hasBeenComputed && (
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.30)', marginTop: '10px' }}>
                Showing {activeView === 'fresh' ? 'latest analysis' : 'saved results'}.
                {activeView === 'saved' && (
                  <button
                    onClick={() => setActiveView('fresh')}
                    style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: '12px', marginLeft: '6px', padding: 0 }}
                  >
                    {freshResult ? 'Switch to latest →' : ''}
                  </button>
                )}
                {activeView === 'fresh' && savedResult?.hasBeenComputed && (
                  <button
                    onClick={() => setActiveView('saved')}
                    style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: '12px', marginLeft: '6px', padding: 0 }}
                  >
                    View saved →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Loading state for initial fetch */}
          {isFetching && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.40)' }}>
              <div style={{ width: '36px', height: '36px', border: '3px solid rgba(255,255,255,0.10)', borderTopColor: '#6366f1', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
              Loading saved analysis…
            </div>
          )}

          {/* Results */}
          {!isFetching && hasData && (
            <>
              {/* Career path label & timestamp */}
              {(careerPathName || computedAt) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                  {careerPathName && (
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>
                      Career Path: <span style={{ color: '#a5b4fc', fontWeight: 600 }}>{careerPathName}</span>
                    </div>
                  )}
                  {computedAt && (
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.30)' }}>
                      Computed: {new Date(computedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              {/* Summary cards */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '28px' }}>
                <SummaryCard label="Strong" count={displaySummary.STRONG} level="STRONG" />
                <SummaryCard label="Moderate" count={displaySummary.MODERATE} level="MODERATE" />
                <SummaryCard label="Weak" count={displaySummary.WEAK} level="WEAK" />
                <SummaryCard label="Missing" count={displaySummary.MISSING} level="MISSING" />
              </div>

              {/* Radar chart */}
              {radarGaps.length >= 3 && (
                <div style={{ marginBottom: '28px' }}>
                  <SkillRadarChart gaps={radarGaps} />
                </div>
              )}

              {/* Filter tabs */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {['ALL', 'MISSING', 'WEAK', 'MODERATE', 'STRONG'].map((level) => {
                  const active = filterLevel === level;
                  const cfg = level !== 'ALL' ? GAP_CONFIG[level as keyof typeof GAP_CONFIG] : null;
                  return (
                    <button
                      key={level}
                      onClick={() => setFilterLevel(level)}
                      style={{
                        padding: '7px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                        border: active ? `1px solid ${cfg?.color ?? '#6366f1'}` : '1px solid rgba(255,255,255,0.10)',
                        background: active ? (cfg ? cfg.bg : 'rgba(99,102,241,0.15)') : 'rgba(255,255,255,0.04)',
                        color: active ? (cfg?.color ?? '#a5b4fc') : 'rgba(255,255,255,0.50)',
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      {level === 'ALL' ? 'All Skills' : GAP_CONFIG[level as keyof typeof GAP_CONFIG].label}
                      {level !== 'ALL' && (
                        <span style={{ marginLeft: '6px', opacity: 0.7 }}>
                          {displaySummary[level as keyof GapSummary]}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Gap cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {filteredGaps.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.35)', fontSize: '14px' }}>
                    No skills in this category.
                  </div>
                ) : (
                  filteredGaps.map((gap) => (
                    <GapCard
                      key={gap.skillId ?? (gap as SavedSkillGap).skill?.id}
                      gap={gap}
                      isFresh={activeView === 'fresh'}
                    />
                  ))
                )}
              </div>
            </>
          )}

          {/* Empty state: never analyzed */}
          {!isFetching && !hasData && !isLoading && (
            <div style={{
              textAlign: 'center', padding: '64px 24px',
              background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)',
              borderRadius: '24px',
            }}>
              <div style={{ fontSize: '56px', marginBottom: '20px' }}>🧭</div>
              <h2 style={{ margin: '0 0 12px', fontSize: '22px', fontWeight: 700, color: '#f8fafc' }}>
                {error?.includes('career goal') ? 'No Career Goal Selected' : 'No Analysis Yet'}
              </h2>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.45)', maxWidth: '400px', margin: '0 auto 24px' }}>
                Select a target career to generate your personalized skill gap.
              </p>
              <button
                onClick={() => navigate('/student/career')}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(99,102,241,0.15)',
                  border: '1px solid rgba(99,102,241,0.3)',
                  borderRadius: '10px',
                  color: '#a5b4fc',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { (e.currentTarget).style.background = 'rgba(99,102,241,0.25)'; }}
                onMouseLeave={(e) => { (e.currentTarget).style.background = 'rgba(99,102,241,0.15)'; }}
              >
                Choose Career
              </button>
            </div>
          )}
        </div>

        {/* CSS animation */}
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </AppLayout>
  );
}
