import React, { useEffect, useState } from 'react';
import { getMentorships, updateMentorshipStatus } from '../../services/mentorship.service';

const MentorshipRequests: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getMentorships();
      setRequests(data.mentorships || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, status: string) => {
    try {
      await updateMentorshipStatus(id, status);
      loadData();
    } catch (err: any) {
      alert('Error updating status: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <div>Loading requests...</div>;

  const pending = requests.filter(r => r.status === 'REQUESTED');
  const active = requests.filter(r => r.status === 'ACCEPTED');

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Mentorship Dashboard</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3 border-b pb-2">Pending Requests ({pending.length})</h2>
        {pending.length === 0 ? <p className="text-gray-500">No pending requests.</p> : (
          <div className="space-y-4">
            {pending.map(r => (
              <div key={r.id} className="p-4 border rounded bg-white shadow-sm flex justify-between items-center">
                <div>
                  <h3 className="font-bold">{r.student?.fullName}</h3>
                  <p className="text-sm text-gray-600">{r.student?.branch}, Class of {r.student?.graduationYear}</p>
                  {r.message && <p className="mt-2 text-sm italic">"{r.message}"</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAction(r.id, 'ACCEPTED')} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Accept</button>
                  <button onClick={() => handleAction(r.id, 'REJECTED')} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Decline</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3 border-b pb-2">Active Mentees ({active.length})</h2>
        {active.length === 0 ? <p className="text-gray-500">No active mentees.</p> : (
          <div className="space-y-4">
            {active.map(r => (
              <div key={r.id} className="p-4 border rounded bg-white shadow-sm flex justify-between items-center">
                <div>
                  <h3 className="font-bold">{r.student?.fullName}</h3>
                  <p className="text-sm text-gray-600">{r.student?.branch}, Class of {r.student?.graduationYear}</p>
                </div>
                <div>
                  <button onClick={() => handleAction(r.id, 'COMPLETED')} className="border border-blue-600 text-blue-600 px-3 py-1 rounded hover:bg-blue-50">Mark Completed</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorshipRequests;
