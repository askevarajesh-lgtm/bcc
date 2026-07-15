import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import * as workspaceApi from '../api/workspaceApi';

export function useWorkspaceProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const res = await workspaceApi.getProjects(params);
      setProjects(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch projects', error);
      message.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  const createProject = useCallback(async (payload) => {
    await workspaceApi.createProject(payload);
    await refetch();
  }, [refetch]);

  const updateSettings = useCallback(async (projectId, settings) => {
    const res = await workspaceApi.updateProjectSettings(projectId, settings);
    await refetch();
    return res.data.data;
  }, [refetch]);

  return { projects, loading, refetch, createProject, updateSettings };
}

export default useWorkspaceProjects;
