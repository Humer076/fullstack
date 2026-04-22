'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useApi } from '@/lib/api';

export default function SessionForm({ batchId, onSuccess }) {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.date || !formData.startTime || !formData.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/sessions', {
        batchId: parseInt(batchId),
        title: formData.title,
        description: formData.description,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
      });

      if (response.success) {
        toast.success('Session created successfully!');
        setFormData({ title: '', description: '', date: '', startTime: '', endTime: '' });
        if (onSuccess) onSuccess();
      } else {
        toast.error(response.error || 'Failed to create session');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>Create New Session</h3>

      <div className="form-group">
        <label htmlFor="title">Session Title *</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g., JavaScript Fundamentals - Lecture 1"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Optional: Add session description or topics"
          style={{ minHeight: '100px' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label htmlFor="date">Date *</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label htmlFor="startTime">Start Time *</label>
          <input
            type="time"
            id="startTime"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label htmlFor="endTime">End Time *</label>
          <input
            type="time"
            id="endTime"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <button
        type="submit"
        className="btn-primary"
        disabled={loading}
        style={{ opacity: loading ? 0.6 : 1 }}
      >
        {loading ? 'Creating...' : 'Create Session'}
      </button>
    </form>
  );
}
