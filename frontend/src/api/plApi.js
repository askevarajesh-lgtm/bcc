import { createQueryHook, createMutationHook } from './baseApi';

export const useGetProjectPLQuery = createQueryHook((projectId) => `/pl/project/${projectId}`);

export const useGetPLSummaryQuery = createQueryHook((params) => ({
  url: '/pl/summary',
  params,
}));

export const useCalculateProjectPLMutation = createMutationHook((projectId) => ({
  url: `/pl/project/${projectId}/calculate`,
  method: 'POST',
}));
