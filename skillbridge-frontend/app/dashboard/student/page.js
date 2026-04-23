'use client';

import { useEffect, useState } from 'react';
import { useRoleProtection } from '@/lib/auth';
import { useApi } from '@/lib/api';
import NavBar from '@/components/NavBar';
import toast from 'react-hot-toast';

export default function StudentDashboard() {
  useRoleProtection(['student']);
  const api = useApi();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    const response = await api.get('/sessions/student');
    if (response.success) {
      setSessions(response.data.sessions);
    } else {
      toast.error('Failed: ' + (response.error || 'Network/CORS error'));
    }
    setLoading(false);
  };

  const handleMarkAttendance = async (sessionId, status) => {
    setMarking(true);
    const response = await api.post('/attendance/mark', {
      sessionId,
      status,
    });

    if (response.success) {
      toast.success(`Marked as ${status}`);
      fetchSessions();
    } else {
      toast.error(response.error || 'Failed to mark attendance');
    }
    setMarking(false);
  };

  return (
    <>
      <NavBar title="Student Dashboard" />
      <div className="page-wrapper">
        <div className="container">
          <div className="card">
            <div className="card-header">
              <h2>My Sessions</h2>
              <p style={{ color: '#666', margin: '4px 0 0 0' }}>
                Mark your attendance for upcoming sessions
              </p>
            </div>

            {loading ? (
              <div className="loading">Loading your sessions...</div>
            ) : sessions.length === 0 ? (
              <div className="empty-state">
                <h3>No sessions assigned yet</h3>
                <p>You haven&apos;t been added to any batches yet. Please wait for your batch invite link.</p>
              </div>
            ) : (
              <div className="grid grid-2">
                {sessions.map(session => (
                  <div key={session.id} style={{
                    padding: '16px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}>
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>{session.title}</h4>
                      <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                        <strong>Batch:</strong> {session.batch_name}
                      </p>
                      <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                        <strong>Trainer:</strong> {session.trainer_name}
                      </p>
                      <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                        <strong>Date:</strong> {new Date(session.date).toLocaleDateString()} at {session.start_time}
                      </p>
                      {session.attendance_status && (
                        <p style={{ margin: '8px 0 0 0' }}>
                          <span className={`badge badge-${session.attendance_status === 'present' ? 'success' : session.attendance_status === 'late' ? 'warning' : 'danger'}`}>
                            {session.attendance_status.charAt(0).toUpperCase() + session.attendance_status.slice(1)}
                          </span>
                        </p>
                      )}
                    </div>

                    {!session.attendance_status && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button
                          className="btn-primary"
                          onClick={() => handleMarkAttendance(session.id, 'present')}
                          disabled={marking}
                          style={{ flex: 1, fontSize: '12px', padding: '8px' }}
                        >
                          Present
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => handleMarkAttendance(session.id, 'absent')}
                          disabled={marking}
                          style={{ flex: 1, fontSize: '12px', padding: '8px' }}
                        >
                          Absent
                        </button>
                        <button
                          className="btn-secondary"
                          onClick={() => handleMarkAttendance(session.id, 'late')}
                          disabled={marking}
                          style={{ flex: 1, fontSize: '12px', padding: '8px' }}
                        >
                          Late
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
