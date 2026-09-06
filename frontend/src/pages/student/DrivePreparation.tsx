import React, { useEffect, useState } from 'react';
import { getDrivePreparation, initDrivePreparation, updateTaskStatus } from '../../services/preparation.service';
import { useParams } from 'react-router-dom';

const DrivePreparation: React.FC = () => {
  const { driveId } = useParams();
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlan();
  }, [driveId]);

  const loadPlan = async () => {
    try {
      let data = await getDrivePreparation(driveId!);
      if (!data.plan) {
        // Init plan if it doesn't exist
        const init = await initDrivePreparation(driveId!);
        data = { plan: init.plan };
      }
      setPlan(data.plan);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'COMPLETED' ? 'NOT_STARTED' : 'COMPLETED';
    try {
      await updateTaskStatus(taskId, newStatus);
      loadPlan(); // reload to get new progressPct
    } catch (err) {
      console.error('Failed to update task', err);
    }
  };

  if (loading) return <div>Loading preparation plan...</div>;
  if (!plan) return <div>Failed to load plan.</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Drive Preparation Plan</h1>
      
      <div className="mb-6 bg-gray-200 rounded-full h-4 overflow-hidden">
        <div 
          className="bg-blue-600 h-full transition-all duration-500" 
          style={{ width: `${plan.progressPct}%` }}
        ></div>
      </div>
      <p className="text-sm text-gray-600 mb-6">{plan.progressPct}% Completed</p>

      <div className="space-y-3">
        {plan.tasks?.map((task: any) => (
          <div key={task.id} className="flex items-center p-3 border rounded bg-white shadow-sm">
            <input 
              type="checkbox" 
              className="w-5 h-5 mr-4 cursor-pointer"
              checked={task.status === 'COMPLETED'}
              onChange={() => handleToggleTask(task.id, task.status)}
            />
            <div className="flex-1">
              <h4 className={`text-lg ${task.status === 'COMPLETED' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                {task.title}
              </h4>
              <p className="text-xs text-gray-500 uppercase">{task.category}</p>
            </div>
            {task.driveResource && (
              <a href={task.driveResource.externalUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">
                View Resource
              </a>
            )}
          </div>
        ))}
        {(!plan.tasks || plan.tasks.length === 0) && (
          <p className="text-gray-500 text-center py-4">No tasks added to your plan yet.</p>
        )}
      </div>
    </div>
  );
};

export default DrivePreparation;
