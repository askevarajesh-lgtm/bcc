import React, { useEffect, useState } from 'react';
import { Tabs, Input, Button, List, Avatar, Typography, Upload, Empty, Spin, Popconfirm, message } from 'antd';
import { MessageSquare, Paperclip, History as HistoryIcon, Upload as UploadIcon, Trash2 } from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';
import useCollaboration from '../hooks/useCollaboration';

const { Text } = Typography;
const { TextArea } = Input;

// Polymorphic Comments/Attachments/History panel for a single Strategy, Task,
// or Report record. Drop this into any review modal/drawer that already knows
// its targetType + targetId + projectId.
const CollaborationDrawer = ({ targetType, targetId, projectId, canWrite = true }) => {
  const { user } = useAuth();
  const {
    comments, attachments, history, loading,
    fetchAll, addComment, removeComment, uploadAttachment, removeAttachment
  } = useCollaboration(targetType);
  const [commentBody, setCommentBody] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (targetId) fetchAll(targetId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetType, targetId]);

  if (!targetId) return null;

  const handlePostComment = async () => {
    if (!commentBody.trim()) return;
    try {
      setPosting(true);
      await addComment(targetId, projectId, commentBody.trim());
      setCommentBody('');
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to post comment');
    } finally {
      setPosting(false);
    }
  };

  const handleUpload = async (file) => {
    try {
      await uploadAttachment(targetId, projectId, file);
      message.success('Attachment uploaded');
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to upload attachment');
    }
    return false; // prevent antd Upload's own auto-upload
  };

  const items = [
    {
      key: 'comments',
      label: <span><MessageSquare size={14} style={{ marginRight: 6, verticalAlign: -2 }} />Comments ({comments.length})</span>,
      children: (
        <div>
          {canWrite && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <TextArea
                rows={2}
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Add a comment..."
              />
              <Button type="primary" onClick={handlePostComment} loading={posting} className="seo-glow-btn">
                Post
              </Button>
            </div>
          )}
          {comments.length === 0 ? (
            <Empty description="No comments yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <List
              dataSource={comments}
              renderItem={(c) => (
                <List.Item
                  actions={String(c.userId?._id || c.userId) === String(user?._id) ? [
                    <Popconfirm key="del" title="Delete this comment?" onConfirm={() => removeComment(targetId, c._id)}>
                      <Button type="text" danger size="small" icon={<Trash2 size={14} />} />
                    </Popconfirm>
                  ] : []}
                >
                  <List.Item.Meta
                    avatar={<Avatar>{(c.userId?.name || '?').charAt(0).toUpperCase()}</Avatar>}
                    title={<Text strong>{c.userId?.name || 'Unknown user'}</Text>}
                    description={<Text type="secondary" style={{ fontSize: 12 }}>{new Date(c.createdAt).toLocaleString()}</Text>}
                  />
                  <div style={{ marginTop: 4, width: '100%' }}>{c.body}</div>
                </List.Item>
              )}
            />
          )}
        </div>
      )
    },
    {
      key: 'attachments',
      label: <span><Paperclip size={14} style={{ marginRight: 6, verticalAlign: -2 }} />Attachments ({attachments.length})</span>,
      children: (
        <div>
          {canWrite && (
            <Upload beforeUpload={handleUpload} showUploadList={false} style={{ marginBottom: 16 }}>
              <Button icon={<UploadIcon size={14} />} className="seo-glow-btn-secondary" style={{ marginBottom: 16 }}>
                Upload File
              </Button>
            </Upload>
          )}
          {attachments.length === 0 ? (
            <Empty description="No attachments yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <List
              dataSource={attachments}
              renderItem={(a) => (
                <List.Item
                  actions={String(a.uploadedBy?._id || a.uploadedBy) === String(user?._id) ? [
                    <Popconfirm key="del" title="Delete this attachment?" onConfirm={() => removeAttachment(targetId, a._id)}>
                      <Button type="text" danger size="small" icon={<Trash2 size={14} />} />
                    </Popconfirm>
                  ] : []}
                >
                  <List.Item.Meta
                    avatar={<Paperclip size={18} />}
                    title={<a href={a.fileUrl} target="_blank" rel="noreferrer">{a.fileName}</a>}
                    description={<Text type="secondary" style={{ fontSize: 12 }}>
                      Uploaded by {a.uploadedBy?.name || 'Unknown'} on {new Date(a.createdAt).toLocaleDateString()}
                    </Text>}
                  />
                </List.Item>
              )}
            />
          )}
        </div>
      )
    },
    {
      key: 'history',
      label: <span><HistoryIcon size={14} style={{ marginRight: 6, verticalAlign: -2 }} />History ({history.length})</span>,
      children: history.length === 0 ? (
        <Empty description="No history yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <List
          dataSource={history}
          renderItem={(h) => (
            <List.Item>
              <List.Item.Meta
                title={<Text strong>{h.action.replace(/_/g, ' ')}</Text>}
                description={
                  <>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                      {h.userId?.name || 'System'} · {new Date(h.createdAt).toLocaleString()}
                    </Text>
                    {(h.fromValue !== null || h.toValue !== null) && (
                      <Text style={{ fontSize: 12 }}>
                        {typeof h.fromValue === 'string' ? h.fromValue : JSON.stringify(h.fromValue)} → {typeof h.toValue === 'string' ? h.toValue : JSON.stringify(h.toValue)}
                      </Text>
                    )}
                  </>
                }
              />
            </List.Item>
          )}
        />
      )
    }
  ];

  return (
    <Spin spinning={loading}>
      <Tabs items={items} size="small" />
    </Spin>
  );
};

export default CollaborationDrawer;
