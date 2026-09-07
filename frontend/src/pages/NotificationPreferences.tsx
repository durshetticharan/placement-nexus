import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Preferences {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  typeOverrides: Record<string, boolean>;
}

export default function NotificationPreferences() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/notifications/preferences');
        setPrefs(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    if (!prefs) return;
    try {
      setSaving(true);
      await api.patch('/notifications/preferences', prefs);
      navigate(-1);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !prefs) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Loading Preferences...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-slate-100 flex justify-center">
      <div className="max-w-2xl w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold mb-6 text-white">Notification Preferences</h1>
        
        <div className="space-y-6">
          <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-700 flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-lg">In-App Notifications</h2>
              <p className="text-xs text-slate-400">Receive notifications inside the dashboard</p>
            </div>
            <input 
              type="checkbox" 
              className="w-5 h-5 accent-indigo-500" 
              checked={prefs.inAppEnabled}
              onChange={(e) => setPrefs({ ...prefs, inAppEnabled: e.target.checked })}
            />
          </div>

          <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-700 flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-lg">Email Notifications</h2>
              <p className="text-xs text-slate-400">Receive notifications directly to your inbox</p>
            </div>
            <input 
              type="checkbox" 
              className="w-5 h-5 accent-indigo-500" 
              checked={prefs.emailEnabled}
              onChange={(e) => setPrefs({ ...prefs, emailEnabled: e.target.checked })}
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-4 border-t border-slate-700 pt-6">
          <button 
            onClick={() => navigate(-1)} 
            className="px-6 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}
