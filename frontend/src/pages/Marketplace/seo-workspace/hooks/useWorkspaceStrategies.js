import { useState, useCallback } from 'react';
import { message } from 'antd';
import * as workspaceApi from '../api/workspaceApi';

export function useWorkspaceStrategies() {
  const [strategies, setStrategies] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);

  const fetchStrategies = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const res = await workspaceApi.getStrategies(params);
      setStrategies(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
    } catch (error) {
      console.error('Failed to fetch strategies', error);
      message.error('Failed to load content strategies');
    } finally {
      setLoading(false);
    }
  }, []);

  const generateStrategy = useCallback(async (projectId) => {
    await workspaceApi.generateStrategy(projectId);
  }, []);

  const approveStrategy = useCallback(async (projectId, strategyId) => {
    const res = await workspaceApi.approveStrategy(projectId, strategyId);
    return res.data.data;
  }, []);

  const rejectStrategy = useCallback(async (projectId, strategyId, reason) => {
    const res = await workspaceApi.rejectStrategy(projectId, strategyId, reason);
    return res.data.data;
  }, []);

  const publishStrategy = useCallback(async (projectId, strategyId) => {
    const res = await workspaceApi.publishStrategy(projectId, strategyId);
    return res.data;
  }, []);

  return {
    strategies, pagination, loading, fetchStrategies,
    generateStrategy, approveStrategy, rejectStrategy, publishStrategy
  };
}

export default useWorkspaceStrategies;
