import { useEffect, useState } from 'react';
import api from './services/api';

interface HealthData {
  status: string;
  uptime?: number;
  timestamp?: string;
  database?: string;
}

interface ApiResponse {
  success: boolean;
  data: HealthData;
}

export default function App() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [dbHealth, setDbHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealthStatus = async () => {
      try {
        setLoading(true);
        const [healthRes, dbRes] = await Promise.all([
          api.get<ApiResponse>('/health'),
          api.get<ApiResponse>('/health/db'),
        ]);

        setHealth(healthRes.data.data);
        setDbHealth(dbRes.data.data);
      } catch (err: any) {
        setError(err.message || 'Failed to connect to backend service');
      } finally {
        setLoading(false);
      }
    };

    fetchHealthStatus();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-6 space-y-6">
        <h1 className="text-2xl font-bold text-center text-indigo-400">
          Placement Nexus - Phase 1 Scaffolding
        </h1>

        {loading && (
          <div className="flex justify-center items-center py-8 text-slate-400">
            <span className="animate-pulse">Checking system health...</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-900/40 border border-red-500 rounded-lg text-red-300 text-sm">
            <p className="font-semibold">Connection Error:</p>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Backend API Health
              </h2>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-slate-400">Status:</span>{' '}
                  <span className="text-emerald-400 font-mono font-bold">{health?.status}</span>
                </p>
                <p>
                  <span className="text-slate-400">Uptime:</span>{' '}
                  <span className="font-mono">{health?.uptime?.toFixed(2)}s</span>
                </p>
                <p>
                  <span className="text-slate-400">Timestamp:</span>{' '}
                  <span className="font-mono text-xs">{health?.timestamp}</span>
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">
                PostgreSQL Database Health
              </h2>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-slate-400">Status:</span>{' '}
                  <span className="text-emerald-400 font-mono font-bold">{dbHealth?.status}</span>
                </p>
                <p>
                  <span className="text-slate-400">Database State:</span>{' '}
                  <span className="text-emerald-400 font-mono font-bold">{dbHealth?.database}</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
