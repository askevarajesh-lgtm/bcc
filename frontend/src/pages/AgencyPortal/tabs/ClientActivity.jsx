import React, { useState, useEffect } from 'react';
import { Timeline, Typography, Tag, Spin } from 'antd';
import { CheckCircle, FileText, Activity } from 'lucide-react';
import dayjs from 'dayjs';

const { Text } = Typography;

const ClientActivity = ({ clientId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (clientId) {
      fetchActivities();
    }
  }, [clientId]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
      let aggregated = [];

      // Safely fetch tasks
      try {
        const tasksRes = await fetch(`/api/tasks?companyId=${clientId}&limit=10`, { headers });
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          const raw = tasksData?.data?.tasks ?? tasksData?.tasks ?? tasksData?.data;
          const tasks = Array.isArray(raw) ? raw : [];
          tasks.forEach(t => {
            aggregated.push({
              id: `task-${t._id}`,
              date: t.updatedAt || t.createdAt,
              type: 'task',
              title: `Task: ${t.title}`,
              desc: `Status: ${t.status || 'N/A'}`,
              icon: <CheckCircle size={16} />
            });
          });
        }
      } catch (e) {
        console.warn('Could not load tasks for activity', e.message);
      }

      // Safely fetch invoices
      try {
        const invoicesRes = await fetch(`/api/invoices?clientId=${clientId}&limit=10`, { headers });
        if (invoicesRes.ok) {
          const invoicesData = await invoicesRes.json();
          const raw = invoicesData?.data ?? invoicesData?.invoices;
          const invoices = Array.isArray(raw) ? raw : [];
          invoices.forEach(i => {
            aggregated.push({
              id: `inv-${i._id}`,
              date: i.updatedAt || i.createdAt,
              type: 'invoice',
              title: `Invoice: ${i.invoiceNumber}`,
              desc: `Payment status: ${i.paymentStatus || 'N/A'}`,
              icon: <FileText size={16} />
            });
          });
        }
      } catch (e) {
        console.warn('Could not load invoices for activity', e.message);
      }

      aggregated.sort((a, b) => new Date(b.date) - new Date(a.date));
      setActivities(aggregated.slice(0, 15));
    } catch (error) {
      console.error('Failed to fetch activities', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: 40 }}><Spin /></div>;
  }

  if (activities.length === 0) {
    return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', background: 'var(--bg-secondary)', borderRadius: 12, border: '1px dashed var(--border-color)', marginTop: 16 }}>No recent activity found for this client.</div>;
  }

  return (
    <div style={{ marginTop: 24, padding: '0 16px' }}>
      <Timeline mode="left">
        {activities.map(act => (
          <Timeline.Item 
            key={act.id} 
            dot={<div style={{ color: act.type === 'task' ? 'var(--accent-primary)' : 'var(--accent-secondary)' }}>{act.icon}</div>}
          >
            <div style={{ marginBottom: 4 }}>
              <Text style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{act.title}</Text>
              <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>{dayjs(act.date).format('MMM DD, hh:mm A')}</Text>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {act.desc}
            </div>
          </Timeline.Item>
        ))}
      </Timeline>
    </div>
  );
};

export default ClientActivity;
