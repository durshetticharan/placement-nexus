import React, { useEffect, useState } from 'react';
import { getDrivePreparation, initDrivePreparation, updateTaskStatus } from '../../services/preparation.service';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import { PageHeader, Card, Button, LoadingState, ErrorState, Badge } from '../../components/ui';
import { Target, CheckCircle2, Circle, ArrowLeft, ExternalLink, ListTodo } from 'lucide-react';

const DrivePreparation: React.FC = () => {
  const { driveId } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlan();
  }, [driveId]);

  const loadPlan = async () => {
    try {
      setLoading(true);
      setError(null);
      let data = await getDrivePreparation(driveId!);
      if (!data.plan) {
        // Init plan if it doesn't exist
        const init = await initDrivePreparation(driveId!);
        data = { plan: init.plan };
      }
      setPlan(data.plan);
    } catch (err) {
      console.error(err);
      setError('Failed to load preparation plan.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'COMPLETED' ? 'NOT_STARTED' : 'COMPLETED';
    try {
      // Optimistic update
      setPlan((prev: any) => ({
        ...prev,
        tasks: prev.tasks.map((t: any) => 
          t.id === taskId ? { ...t, status: newStatus } : t
        )
      }));
      
      await updateTaskStatus(taskId, newStatus);
      loadPlan(); // reload to get true progressPct
    } catch (err) {
      console.error('Failed to update task', err);
      loadPlan(); // Revert on failure
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingState message="Loading your preparation plan..." />
        </div>
      </AppLayout>
    );
  }

  if (error || !plan) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <ErrorState message={error || 'Failed to load plan.'} onRetry={loadPlan} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <PageHeader
            title="Drive Preparation Plan"
            subtitle="Your personalized roadmap for this placement drive."
            icon={<Target size={32} style={{ color: 'var(--brand)' }} />}
          />
          <Button
            onClick={() => navigate('/student/drives')}
            variant="outline"
            leftIcon={<ArrowLeft size={16} />}
          >
            Back to Drives
          </Button>
        </div>

        <Card className="animate-fade-in">
          <div className="mb-6">
            <div className="flex justify-between items-end mb-2">
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Overall Progress</span>
              <span className="text-2xl font-black" style={{ color: 'var(--brand)' }}>{plan.progressPct}%</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
              <div 
                className="h-full transition-all duration-1000 ease-out" 
                style={{ width: `${plan.progressPct}%`, background: 'var(--brand)' }}
              ></div>
            </div>
          </div>

          <div className="space-y-4">
            {plan.tasks?.length > 0 ? (
              plan.tasks.map((task: any) => (
                <div 
                  key={task.id} 
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${task.status === 'COMPLETED' ? 'opacity-70' : 'hover:border-brand'}`}
                  style={{ 
                    background: task.status === 'COMPLETED' ? 'var(--surface-1)' : 'var(--surface-2)',
                    borderColor: task.status === 'COMPLETED' ? 'var(--border-subtle)' : 'var(--border-subtle)'
                  }}
                >
                  <button 
                    onClick={() => handleToggleTask(task.id, task.status)}
                    className="mt-1 flex-shrink-0 transition-transform hover:scale-110 focus:outline-none"
                    style={{ color: task.status === 'COMPLETED' ? 'var(--success)' : 'var(--text-muted)' }}
                  >
                    {task.status === 'COMPLETED' ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-base font-bold mb-1 transition-all ${task.status === 'COMPLETED' ? 'line-through' : ''}`}
                        style={{ color: task.status === 'COMPLETED' ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                      {task.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="default" className="text-[10px]">
                        {task.category}
                      </Badge>
                      {task.driveResource && (
                        <a 
                          href={task.driveResource.externalUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-xs font-bold flex items-center gap-1 hover:underline"
                          style={{ color: 'var(--brand)' }}
                        >
                          View Resource <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center flex flex-col items-center justify-center">
                <ListTodo size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No Tasks Yet</h3>
                <p style={{ color: 'var(--text-secondary)' }}>No tasks have been added to your preparation plan.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};

export default DrivePreparation;
