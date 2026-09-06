import React, { useEffect, useState } from 'react';
import { getMentorDirectory } from '../../services/mentorship.service';

const MentorDirectory: React.FC = () => {
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMentors();
  }, []);

  const loadMentors = async () => {
    try {
      const data = await getMentorDirectory();
      setMentors(data.mentors || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading mentors...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Mentor Directory</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mentors.map(mentor => (
          <div key={mentor.id} className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold">{mentor.fullName}</h2>
            <p className="text-gray-600">{mentor.currentDesignation} at {mentor.currentCompany}</p>
            <p className="text-sm mt-2">{mentor.mentorBio}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {mentor.mentorTopics?.map((topic: string) => (
                <span key={topic} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {topic}
                </span>
              ))}
            </div>
            <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
              Request Mentorship
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MentorDirectory;
