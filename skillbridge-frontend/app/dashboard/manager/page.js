'use client';

import { useEffect, useState } from 'react';
import { useRoleProtection } from '@/lib/auth';
import { useApi } from '@/lib/api';
import NavBar from '@/components/NavBar';
import toast from 'react-hot-toast';

export default function ManagerDashboard() {
  useRoleProtection(['programme_manager']);
  const api = useApi();
  const [programmeSummary, setProgrammeSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgrammeSummary();
  }, []);

  const fetchProgrammeSummary = async () => {
    setLoading(true);
    const response = await api.get('/programme/summary');
    if (response.success) {
      setProgrammeSummary(response.data);
    } else {
      toast.error('Failed to fetch programme summary');
    }
    setLoading(false);
  };

  return (
    <>
      <NavBar title="Programme Manager Dashboard" />
      <div className="page-wrapper">
        <div className="container">
          {loading ? (
            <div className="loading">Loading programme data...</div>
          ) : programmeSummary ? (
            <>
              {/* Overall Summary */}
              <div className="card">
                <div className="card-header">
                  <h2>Programme Overview</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ padding: '16px', backgroundColor: '#f0f7ff', borderRadius: '8px' }}>
                    <p style={{ margin: '0', fontSize: '12px', color: '#666', fontWeight: '600' }}>INSTITUTIONS</p>
                    <p style={{ margin: '8px 0 0 0', fontSize: '32px', fontWeight: 'bold', color: '#0066cc' }}>
                      {programmeSummary.summary.total_institutions || 0}
                    </p>
                  </div>
                  <div style={{ padding: '16px', backgroundColor: '#d4edda', borderRadius: '8px' }}>
                    <p style={{ margin: '0', fontSize: '12px', color: '#666', fontWeight: '600' }}>TRAINERS</p>
                    <p style={{ margin: '8px 0 0 0', fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>
                      {programmeSummary.summary.total_trainers || 0}
                    </p>
                  </div>
                  <div style={{ padding: '16px', backgroundColor: '#d1ecf1', borderRadius: '8px' }}>
                    <p style={{ margin: '0', fontSize: '12px', color: '#666', fontWeight: '600' }}>STUDENTS</p>
                    <p style={{ margin: '8px 0 0 0', fontSize: '32px', fontWeight: 'bold', color: '#0c5460' }}>
                      {programmeSummary.summary.total_students || 0}
                    </p>
                  </div>
                  <div style={{ padding: '16px', backgroundColor: '#fff3cd', borderRadius: '8px' }}>
                    <p style={{ margin: '0', fontSize: '12px', color: '#666', fontWeight: '600' }}>BATCHES</p>
                    <p style={{ margin: '8px 0 0 0', fontSize: '32px', fontWeight: 'bold', color: '#856404' }}>
                      {programmeSummary.summary.total_batches || 0}
                    </p>
                  </div>
                </div>

                <div style={{ padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                  <p style={{ margin: '0 0 8px 0' }}>
                    <strong>Total Sessions:</strong> {programmeSummary.summary.total_sessions || 0}
                  </p>
                  <p style={{ margin: '8px 0' }}>
                    <strong>Overall Attendance Rate:</strong>{' '}
                    <span style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: (programmeSummary.summary.attendance_rate || 0) >= 75 ? '#28a745' : '#dc3545',
                    }}>
                      {(programmeSummary.summary.attendance_rate || 0).toFixed(1)}%
                    </span>
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: '#d4edda', borderRadius: '4px', textAlign: 'center' }}>
                      <p style={{ margin: '0', fontSize: '12px' }}>Present</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 'bold', color: '#155724' }}>
                        {programmeSummary.summary.total_present || 0}
                      </p>
                    </div>
                    <div style={{ padding: '8px', backgroundColor: '#fff3cd', borderRadius: '4px', textAlign: 'center' }}>
                      <p style={{ margin: '0', fontSize: '12px' }}>Late</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 'bold', color: '#856404' }}>
                        {programmeSummary.summary.total_late || 0}
                      </p>
                    </div>
                    <div style={{ padding: '8px', backgroundColor: '#f8d7da', borderRadius: '4px', textAlign: 'center' }}>
                      <p style={{ margin: '0', fontSize: '12px' }}>Absent</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 'bold', color: '#721c24' }}>
                        {programmeSummary.summary.total_absent || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Institution-wise Summary */}
              <div className="card">
                <div className="card-header">
                  <h2>Institution-wise Summary</h2>
                </div>

                {programmeSummary.institutionWise.length === 0 ? (
                  <div className="empty-state">
                    <p>No institutions yet</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Institution</th>
                          <th>Batches</th>
                          <th>Trainers</th>
                          <th>Students</th>
                          <th>Sessions</th>
                          <th>Attendance Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {programmeSummary.institutionWise.map(institution => (
                          <tr key={institution.id}>
                            <td style={{ fontWeight: '600' }}>{institution.name}</td>
                            <td>{institution.batch_count}</td>
                            <td>{institution.trainer_count}</td>
                            <td>{institution.student_count}</td>
                            <td>{institution.session_count}</td>
                            <td style={{
                              fontWeight: '600',
                              color: (institution.attendance_rate || 0) >= 75 ? '#28a745' : '#dc3545',
                            }}>
                              {(institution.attendance_rate || 0).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>No data available</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
