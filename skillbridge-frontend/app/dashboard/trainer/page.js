'use client';

import { useEffect, useState } from 'react';
import { useRoleProtection } from '@/lib/auth';
import { useApi } from '@/lib/api';
import NavBar from '@/components/NavBar';
import SessionForm from '@/components/SessionForm';
import toast from 'react-hot-toast';

export default function TrainerDashboard() {
  useRoleProtection(['trainer']);
  const api = useApi();
  const [batches, setBatches] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [inviteLink, setInviteLink] = useState(null);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [batchesRes, sessionsRes] = await Promise.all([
      api.get('/batches'),
      api.get('/sessions/trainer'),
    ]);

    if (batchesRes.success) setBatches(batchesRes.data.batches);
    if (sessionsRes.success) setSessions(sessionsRes.data.sessions);
    setLoading(false);
  };

  const handleGenerateInvite = async (batchId) => {
    const response = await api.post(`/batches/${batchId}/invite`, {});
    if (response.success) {
      setInviteLink(response.data.inviteLink);
      toast.success('Invite link generated!');
    } else {
      toast.error(response.error || 'Failed to generate invite link');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopying(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopying(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <>
      <NavBar title="Trainer Dashboard" />
      <div className="page-wrapper">
        <div className="container">
          <div className="grid grid-2">
            {/* Left: Batches and Invite */}
            <div>
              <div className="card">
                <div className="card-header">
                  <h2>Your Batches</h2>
                </div>

                {loading ? (
                  <div className="loading">Loading...</div>
                ) : batches.length === 0 ? (
                  <div className="empty-state">
                    <p>No batches assigned yet</p>
                  </div>
                ) : (
                  <div>
                    {batches.map(batch => (
                      <div
                        key={batch.id}
                        onClick={() => setSelectedBatch(batch.id)}
                        style={{
                          padding: '12px',
                          marginBottom: '8px',
                          border: selectedBatch === batch.id ? '2px solid #0066cc' : '1px solid #ddd',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          backgroundColor: selectedBatch === batch.id ? '#f0f7ff' : '#fff',
                        }}
                      >
                        <h4 style={{ margin: '0 0 4px 0', color: '#333' }}>{batch.name}</h4>
                        <button
                          className="btn-secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenerateInvite(batch.id);
                          }}
                          style={{ fontSize: '12px', padding: '6px 12px', marginTop: '8px' }}
                        >
                          Generate Invite Link
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {inviteLink && (
                <div className="card" style={{ background: '#f0f7ff', border: '2px solid #0066cc' }}>
                  <div className="card-header">
                    <h3>Invite Link</h3>
                  </div>
                  <p style={{ color: '#666', marginBottom: '12px', fontSize: '12px', wordBreak: 'break-all' }}>
                    {inviteLink}
                  </p>
                  <button
                    className="btn-primary"
                    onClick={copyToClipboard}
                    style={{ width: '100%' }}
                  >
                    {copying ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              )}
            </div>

            {/* Right: Session Form */}
            <div>
              {selectedBatch ? (
                <SessionForm
                  batchId={selectedBatch}
                  onSuccess={fetchData}
                />
              ) : (
                <div className="card">
                  <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>
                    Select a batch to create a session
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sessions */}
          <div className="card">
            <div className="card-header">
              <h2>Your Sessions</h2>
            </div>

            {sessions.length === 0 ? (
              <div className="empty-state">
                <p>No sessions created yet</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Batch</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Present</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(session => (
                      <tr key={session.id}>
                        <td style={{ fontWeight: '600' }}>{session.title}</td>
                        <td>{session.batch_name}</td>
                        <td>{new Date(session.date).toLocaleDateString()}</td>
                        <td>{session.start_time}</td>
                        <td><strong>{session.present_count || 0}</strong></td>
                        <td>{session.student_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
