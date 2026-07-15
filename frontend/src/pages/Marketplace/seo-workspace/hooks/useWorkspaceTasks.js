import { useState, useCallback } from 'react';
import { message } from 'antd';
import * as workspaceApi from '../api/workspaceApi';

export function useWorkspaceTasks() {
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);

  const fetchTasks = useCallback(async (projectId, params = {}) => {
    if (!projectId) return;
    try {
      setLoading(true);
      const res = await workspaceApi.getTasks(projectId, params);
      setTasks(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
    } catch (error) {
      console.error('Failed to fetch tasks', error);
      message.error('Failed to load approval tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTaskStatus = useCallback(async (projectId, taskId, status) => {
    const res = await workspaceApi.updateTaskStatus(projectId, taskId, status);
    return res.data.data;
  }, []);

  return { tasks, pagination, loading, fetchTasks, updateTaskStatus };
}

export default useWorkspaceTasks;
