import React, { useState } from 'react';
import { updateMentorProfile } from '../../services/mentorship.service';

const MentorSettings: React.FC = () => {
  const [formData, setFormData] = useState({
    isMentor: false,
    mentorBio: '',
    mentorTopics: '',
    maxMentees: 3
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const topics = formData.mentorTopics.split(',').map(t => t.trim()).filter(t => t);
      await updateMentorProfile({
        isMentor: formData.isMentor,
        mentorBio: formData.mentorBio,
        mentorTopics: topics,
        maxMentees: formData.maxMentees
      });
      alert('Settings updated successfully!');
    } catch (err: any) {
      alert('Error updating mentor settings: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Mentorship Settings</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
        
        <div className="flex items-center">
          <input 
            type="checkbox" 
            id="isMentor" 
            checked={formData.isMentor}
            onChange={(e) => setFormData({...formData, isMentor: e.target.checked})}
            className="w-5 h-5 mr-3 cursor-pointer"
          />
          <label htmlFor="isMentor" className="font-semibold text-gray-700">Available as a Mentor</label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mentor Bio</label>
          <textarea 
            className="w-full border rounded p-2"
            rows={4}
            value={formData.mentorBio}
            onChange={(e) => setFormData({...formData, mentorBio: e.target.value})}
            placeholder="Tell students about your experience and how you can help them..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Topics (comma separated)</label>
          <input 
            type="text" 
            className="w-full border rounded p-2"
            value={formData.mentorTopics}
            onChange={(e) => setFormData({...formData, mentorTopics: e.target.value})}
            placeholder="e.g. Mock Interviews, Resume Review, Tech Stack"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Mentees</label>
          <input 
            type="number" 
            min="1" max="10"
            className="w-full border rounded p-2"
            value={formData.maxMentees}
            onChange={(e) => setFormData({...formData, maxMentees: parseInt(e.target.value)})}
          />
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700">
          Save Settings
        </button>

      </form>
    </div>
  );
};

export default MentorSettings;
