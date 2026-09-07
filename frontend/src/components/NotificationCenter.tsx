import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: any;
  createdAt: string;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30s
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const handleNotificationClick = (n: Notification) => {
    if (!n.isRead) markAsRead(n.id);
    setIsOpen(false);

    // Deep linking logic based on notification type/metadata
    if (n.type === 'APPLICATION_STATUS' || n.type === 'SHORTLISTED') {
      navigate('/student/applications');
    } else if (n.type === 'INTERVIEW_SCHEDULED') {
      // Could route to specific interview detail or application page
      navigate('/student/applications');
    } else if (n.type === 'NEW_DRIVE') {
      navigate('/student/drives');
    } else if (n.type === 'MENTORSHIP_UPDATE') {
      navigate('/student/mentorships'); // placeholder route
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-slate-700/50 transition-colors focus:outline-none"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold border border-slate-800">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-[28rem] bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-700 flex justify-between items-center bg-slate-800/90 backdrop-blur">
            <h3 className="font-bold text-slate-100">Notifications</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button 
                  onClick={markAllRead}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  Mark all read
                </button>
              )}
              <button 
                onClick={() => { setIsOpen(false); navigate('/preferences'); }}
                className="text-xs text-slate-400 hover:text-slate-200"
                title="Preferences"
              >
                ⚙️
              </button>
            </div>
          </div>
          
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {loading && notifications.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-sm">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">
                <div className="text-3xl mb-2 opacity-50">📭</div>
                You have no notifications.
              </div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors border ${n.isRead ? 'bg-slate-800 border-transparent hover:bg-slate-700/50 text-slate-400' : 'bg-slate-700/40 border-indigo-500/30 hover:bg-slate-700 text-slate-200 shadow-sm'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`text-sm font-semibold ${n.isRead ? 'text-slate-300' : 'text-indigo-300'}`}>
                      {n.title}
                    </h4>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1 flex-shrink-0"></span>}
                  </div>
                  <p className="text-xs line-clamp-2">{n.message}</p>
                  <p className="text-[10px] mt-2 opacity-60">
                    {new Date(n.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
