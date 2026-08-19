import React, { useState, useEffect } from 'react';
import { Select, Typography, Alert, Space } from 'antd';
import { semrushApi } from '../../../api/semrushApi';

const { Option } = Select;
const { Text } = Typography;

const SnapshotSelector = ({ projectId, tabKey, onSnapshotSelect }) => {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Use sessionStorage to keep tab history isolated and persistent during the session
  const sessionKey = `semrush_snapshot_${tabKey}`;
  
  const [selectedId, setSelectedId] = useState(() => {
    return sessionStorage.getItem(sessionKey) || 'latest';
  });

  useEffect(() => {
    if (projectId) {
      fetchSnapshots();
    }
  }, [projectId]);

  const fetchSnapshots = async () => {
    setLoading(true);
    try {
      const res = await semrushApi.getActivitySnapshots(projectId);
      if (res.data.success) {
        setSnapshots(res.data.snapshots || []);
      }
    } catch (err) {
      console.error('Failed to load snapshots:', err);
      setError('Failed to load snapshot dates');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (val) => {
    setSelectedId(val);
    sessionStorage.setItem(sessionKey, val);
    onSnapshotSelect(val);
  };
  
  // Fire the initial select event to ensure the parent tab gets the restored session value
  useEffect(() => {
    onSnapshotSelect(selectedId);
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown Date';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <Space align="center">
        <Text type="secondary" strong>Data Date:</Text>
        <Select
          style={{ width: 220 }}
          value={selectedId}
          onChange={handleSelect}
          loading={loading}
          disabled={loading || error}
        >
          <Option value="latest">Latest</Option>
          {snapshots.map(s => (
            <Option key={s._id} value={s._id}>{formatDate(s.collectedAt)}</Option>
          ))}
        </Select>
      </Space>
      {error && <Alert message={error} type="error" showIcon style={{ marginTop: 8 }} />}
    </div>
  );
};

export default SnapshotSelector;
