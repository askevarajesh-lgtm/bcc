import { useState, useCallback } from 'react';
import { message } from 'antd';
import * as workspaceApi from '../api/workspaceApi';


export function useCollaboration(targetType) {
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async (targetId) => {
    if (!targetType || !targetId) return;
    try {
      setLoading(true);
      const [commentsRes, attachmentsRes, historyRes] = await Promise.all([
        workspaceApi.getComments(targetType, targetId),
        workspaceApi.getAttachments(targetType, targetId),
        workspaceApi.getTargetHistory(targetType, targetId)
      ]);
      setComments(commentsRes.data.data || []);
      setAttachments(attachmentsRes.data.data || []);
      setHistory(historyRes.data.data || []);
    } catch (error) {
      console.error('Failed to load collaboration data', error);
      message.error('Failed to load comments/attachments/history');
    } finally {
      setLoading(false);
    }
  }, [targetType]);

  const addComment = useCallback(async (targetId, projectId, body) => {
    await workspaceApi.createComment(targetType, targetId, projectId, body);
    await fetchAll(targetId);
  }, [targetType, fetchAll]);

  const removeComment = useCallback(async (targetId, commentId) => {
    await workspaceApi.deleteComment(commentId);
    await fetchAll(targetId);
  }, [fetchAll]);

  const uploadAttachment = useCallback(async (targetId, projectId, file) => {
    await workspaceApi.createAttachment(targetType, targetId, projectId, file);
    await fetchAll(targetId);
  }, [targetType, fetchAll]);

  const removeAttachment = useCallback(async (targetId, attachmentId) => {
    await workspaceApi.deleteAttachment(attachmentId);
    await fetchAll(targetId);
  }, [fetchAll]);

  return {
    comments, attachments, history, loading,
    fetchAll, addComment, removeComment, uploadAttachment, removeAttachment
  };
}

export default useCollaboration;
