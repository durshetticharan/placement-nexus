import api from './api';

export const initDrivePreparation = async (driveId: string) => {
  const res = await api.post(`/preparation/drives/${driveId}`);
  return res.data;
};

export const getDrivePreparation = async (driveId: string) => {
  const res = await api.get(`/preparation/drives/${driveId}`);
  return res.data;
};

export const addPreparationTask = async (data: {
  drivePreparationPlanId: string;
  title: string;
  category?: string;
  driveResourceId?: string;
  driveExperienceId?: string;
}) => {
  const res = await api.post('/preparation/tasks', data);
  return res.data;
};

export const updateTaskStatus = async (taskId: string, status: string) => {
  const res = await api.patch(`/preparation/tasks/${taskId}/status`, { status });
  return res.data;
};
