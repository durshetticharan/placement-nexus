import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AppLayout from '../components/layout/AppLayout';
import { PageHeader, Card, Button } from '../components/ui';
import { Bell, Mail, Smartphone } from 'lucide-react';

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
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-slate-400">Loading Preferences...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader 
        title="Notification Preferences"
        subtitle="Manage how and where you receive alerts"
        icon={<Bell size={24} className="text-brand" />}
        action={
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        }
      />

      <div className="max-w-3xl">
        <Card className="p-6 md:p-8">
          <div className="space-y-6">
            <div className="flex items-start justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-brand/30 transition-colors">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                  <Smartphone size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">In-App Notifications</h3>
                  <p className="text-sm text-slate-400">Receive notifications directly inside the dashboard and navigation menu.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer pt-2">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={prefs.inAppEnabled}
                  onChange={(e) => setPrefs({ ...prefs, inAppEnabled: e.target.checked })}
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
              </label>
            </div>

            <div className="flex items-start justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-brand/30 transition-colors">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Email Notifications</h3>
                  <p className="text-sm text-slate-400">Receive important updates, application statuses, and daily digests directly to your inbox.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer pt-2">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={prefs.emailEnabled}
                  onChange={(e) => setPrefs({ ...prefs, emailEnabled: e.target.checked })}
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
              </label>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
