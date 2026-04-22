'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useApi } from '@/lib/api';

export default function AttendanceMarker({ sessionId, onSuccess }) {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [attendance, setAttendance] = useState({});

  useEffect(() => {
    const fetchSession = async () => {
      const response = await api.get(`/sessions/${sessionId}`);
      if (response.success) {
        setSessionData(response.data);
        // Initialize attendance object
        const init = {};
        response.data.enrolledStudents.forEach(student => {
          init[student.id] = response.data.attendance.find(a => a.student_id === student.id)?.status || 'absent';
        });
        setAttendance(init);
      }
    };

    if (sessionId) fetchSession();
  }, [sessionId]);

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let successCount = 0;
      for (const [studentId, status] of Object.entries(attendance)) {
        const response = await api.post('/attendance/mark', {
          sessionId: parseInt(sessionId),
          studentId: parseInt(studentId),
          status,
        });
        if (response.success) successCount++;
      }

      toast.success(`Attendance marked for ${successCount} students`);
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error('Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  if (!sessionData) {
    return <div className="loading">Loading session details...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <div className="card-header">
        <h2>Mark Attendance</h2>
        <p style={{ color: '#666', margin: '4px 0 0 0' }}>
          {sessionData.session.title} - {new Date(sessionData.session.date).toLocaleDateString()}
        </p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sessionData.enrolledStudents.map(student => (
              <tr key={student.id}>
                <td>{student.name}</td>
                <td>
                  <select
                    value={attendance[student.id] || 'absent'}
                    onChange={(e) => handleStatusChange(student.id, e.target.value)}
                    style={{ maxWidth: '150px' }}
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="submit"
        className="btn-primary"
        disabled={loading}
        style={{ marginTop: '16px', opacity: loading ? 0.6 : 1 }}
      >
        {loading ? 'Saving...' : 'Save Attendance'}
      </button>
    </form>
  );
}
