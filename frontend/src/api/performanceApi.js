import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const createQueryHook = (endpointFn) => {
  return (params, options = {}) => {
    const { skip } = options;
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(!skip);
    const [error, setError] = useState(null);

    const refetch = useCallback(async () => {
      if (skip) return;
      setIsLoading(true);
      try {
        const config = typeof endpointFn === 'function' ? endpointFn(params) : { url: endpointFn };
        const url = typeof config === 'string' ? config : config.url;
        const queryParams = typeof config === 'object' && config.params ? config.params : {};
        
        const response = await api.get(url, { params: queryParams });
        setData(response.data);
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }, [JSON.stringify(params), skip]);

    useEffect(() => {
      refetch();
    }, [refetch]);

    return { data, isLoading, error, refetch };
  };
};

const createMutationHook = (endpointFn) => {
  return () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const mutate = async (params) => {
      setIsLoading(true);
      try {
        const config = typeof endpointFn === 'function' ? endpointFn(params) : { url: endpointFn };
        const url = typeof config === 'string' ? config : config.url;
        const method = typeof config === 'object' && config.method ? config.method : 'POST';
        const body = typeof config === 'object' ? config.body : undefined;
        const formData = typeof config === 'object' ? config.formData : undefined;
        
        const response = await api({ url, method, data: formData || body });
        setError(null);
        return { data: response.data };
      } catch (err) {
        const errorResponse = err.response ? { status: err.response.status, data: err.response.data } : err;
        setError(errorResponse);
        return { error: errorResponse };
      } finally {
        setIsLoading(false);
      }
    };
    return [mutate, { isLoading, error }];
  };
};

export const useGetPerformanceQuery = createQueryHook((params) => ({ url: '/hrms/performance', params }));
export const useCalculatePerformanceMutation = createMutationHook((data) => ({ url: '/hrms/performance/calculate', method: 'POST', body: data }));
export const useCalculatePerformanceForAllMutation = createMutationHook((data) => ({ url: '/hrms/performance/calculate-all', method: 'POST', body: data }));
export const useCreateOrUpdateScorecardMutation = createMutationHook((data) => ({ url: '/hrms/performance/scorecard', method: 'POST', body: data }));
export const useGetLastMonthScorecardQuery = createQueryHook((params) => ({ url: '/hrms/performance/scorecard/last-month', params }));
export const useGetPerformanceHistoryQuery = createQueryHook((params) => ({ url: '/hrms/performance/scorecard/history', params }));
export const useGetAllScorecardsQuery = createQueryHook((params) => ({ url: '/hrms/performance/scorecard/all', params }));
export const useGetScorecardByIdQuery = createQueryHook((id) => ({ url: `/hrms/performance/scorecard/${id}` }));
export const useSubmitSelfAssessmentMutation = createMutationHook((data) => ({ url: '/hrms/performance/scorecard/self-assessment', method: 'POST', body: data }));
export const useGetSelfAssessmentQuery = createQueryHook((params) => ({ url: '/hrms/performance/scorecard/self-assessment', params }));
export const useGetUsersWithoutSelfAssessmentQuery = createQueryHook((params) => ({ url: '/hrms/performance/scorecard/pending-users', params }));
export const useNotifyPendingSelfAssessmentMutation = createMutationHook((data) => ({ url: '/hrms/performance/scorecard/notify-pending', method: 'POST', body: data }));
