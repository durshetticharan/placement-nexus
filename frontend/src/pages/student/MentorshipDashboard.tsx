import React, { useEffect, useState } from 'react';
import { getMentorships } from '../../services/mentorship.service';

const MentorshipDashboard: React.FC = () => {
  const [mentorships, setMentorships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getMentorships();
      setMentorships(data.mentorships || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Mentorships</h1>
      {mentorships.length === 0 ? (
        <p className="text-gray-500">You have no active mentorship requests.</p>
      ) : (
        <div className="grid gap-4">
          {mentorships.map(m => (
            <div key={m.id} className="border p-4 rounded bg-white shadow flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg">{m.alumniProfile?.fullName}</h3>
                <p className="text-sm text-gray-500">{m.alumniProfile?.currentDesignation} @ {m.alumniProfile?.currentCompany}</p>
                <p className="text-xs text-gray-400 mt-1">Requested: {new Date(m.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  m.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                  m.status === 'REQUESTED' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {m.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentorshipDashboard;
