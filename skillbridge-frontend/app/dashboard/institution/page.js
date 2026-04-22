'use client';

import { useEffect, useState } from 'react';
import { useRoleProtection } from '@/lib/auth';
import { useApi } from '@/lib/api';
import NavBar from '@/components/NavBar';
import toast from 'react-hot-toast';

export default function InstitutionDashboard() {
  useRoleProtection(['institution']);
  const api = useApi();
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchSummary, setBatchSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    setLoading(true);
    const response = await api.get('/batches');
    if (response.success) {
      setBatches(response.data.batches);
      if (response.data.batches.length > 0) {
        fetchBatchSummary(response.data.batches[0].id);
      }
    } else {
      toast.error('Failed to fetch batches');
    }
    setLoading(false);
  };

  const fetchBatchSummary = async (batchId) => {
    setSummaryLoading(true);
    const response = await api.get(`/batches/${batchId}/summary`);
    if (response.success) {
      setBatchSummary(response.data);
      setSelectedBatch(batchId);
    } else {
      toast.error('Failed to fetch batch summary');
    }
    setSummaryLoading(false);
  };

  return (
    <>
      <NavBar title="Institution Dashboard" />
      <div className="page-wrapper">
        <div className="container">
          <div className="grid grid-2">
            {/* Batches List */}
            <div className="card">
              <div className="card-header">
                <h2>Batches</h2>
              </div>

              {loading ? (
                <div className="loading">Loading...</div>
              ) : batches.length === 0 ? (
                <div className="empty-state">
                  <p>No batches created yet</p>
                </div>
              ) : (
                <div>
                  {batches.map(batch => (
                    <div
                      key={batch.id}
                      onClick={() => fetchBatchSummary(batch.id)}
                      style={{
                        padding: '12px',
                        marginBottom: '8px',
                        border: selectedBatch === batch.id ? '2px solid #0066cc' : '1px solid #ddd',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        backgroundColor: selectedBatch === batch.id ? '#f0f7ff' : '#fff',
                      }}
                    >
                      <h4 style={{ margin: '0', color: '#333' }}>{batch.name}</h4>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Batch Summary */}
            {summaryLoading ? (
              <div className="card">
                <div className="loading">Loading summary...</div>
              </div>
            ) : batchSummary ? (
              <div className="card">
                <div className="card-header">
                  <h2>{batchSummary.batch.name} - Summary</h2>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '6px', marginBottom: '8px' }}>
                    <p style={{ margin: '0 0 8px 0' }}>
                      <strong>Total Students:</strong> {batchSummary.summary.total_students || 0}
                    </p>
                    <p style={{ margin: '0 0 8px 0' }}>
                      <strong>Total Sessions:</strong> {batchSummary.summary.total_sessions || 0}
                    </p>
                    <p style={{ margin: '0' }}>
                      <strong>Attendance Rate:</strong>{' '}
                      <span style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: (batchSummary.summary.attendance_rate || 0) >= 75 ? '#28a745' : '#dc3545',
                      }}>
                        {(batchSummary.summary.attendance_rate || 0).toFixed(1)}%
                      </span>
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div style={{ padding: '8px', backgroundColor: '#d4edda', borderRadius: '4px', textAlign: 'center' }}>
                    <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>Present</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 'bold', color: '#155724' }}>
                      {batchSummary.summary.total_present || 0}
                    </p>
                  </div>
                  <div style={{ padding: '8px', backgroundColor: '#fff3cd', borderRadius: '4px', textAlign: 'center' }}>
                    <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>Late</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 'bold', color: '#856404' }}>
                      {batchSummary.summary.total_late || 0}
                    </p>
                  </div>
                  <div style={{ padding: '8px', backgroundColor: '#f8d7da', borderRadius: '4px', textAlign: 'center' }}>
                    <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>Absent</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 'bold', color: '#721c24' }}>
                      {batchSummary.summary.total_absent || 0}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Session Breakdown */}
          {batchSummary && (
            <div className="card">
              <div className="card-header">
                <h2>Session-wise Breakdown</h2>
              </div>

              {batchSummary.sessionBreakdown.length === 0 ? (
                <div className="empty-state">
                  <p>No sessions in this batch yet</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Session</th>
                        <th>Date</th>
                        <th>Enrolled</th>
                        <th>Present</th>
                        <th>Absent</th>
                        <th>Late</th>
                        <th>Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchSummary.sessionBreakdown.map(session => {
                        const total = session.enrolled || 1;
                        const rate = ((session.present || 0) / total * 100).toFixed(1);
                        return (
                          <tr key={session.id}>
                            <td style={{ fontWeight: '600' }}>{session.title}</td>
                            <td>{new Date(session.date).toLocaleDateString()}</td>
                            <td>{session.enrolled}</td>
                            <td style={{ color: '#28a745', fontWeight: '600' }}>{session.present}</td>
                            <td style={{ color: '#dc3545', fontWeight: '600' }}>{session.absent}</td>
                            <td style={{ color: '#ffc107', fontWeight: '600' }}>{session.late}</td>
                            <td style={{
                              fontWeight: '600',
                              color: rate >= 75 ? '#28a745' : '#dc3545',
                            }}>
                              {rate}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
