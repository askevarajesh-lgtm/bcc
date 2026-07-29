import { createQueryHook, createMutationHook } from './baseApi';

export const useGetTargetsQuery = createQueryHook((params) => ({
  url: '/sales/targets',
  params,
}));

export const useGetSalesTrackingQuery = createQueryHook((params) => ({
  url: '/sales/tracking',
  params,
}));

export const useCreateTargetMutation = createMutationHook((data) => ({
  url: '/sales/targets',
  method: 'POST',
  body: data,
}));

export const useUpdateTargetMutation = createMutationHook(({ id, ...data }) => ({
  url: `/sales/targets/${id}`,
  method: 'PUT',
  body: data,
}));

export const useGenerateMonthlyReportQuery = createQueryHook(({ month, year, format }) => ({
  url: '/sales/reports/monthly',
  params: { month, year, format },
}));

export const useRecalculateMetricsMutation = createMutationHook((targetId) => ({
  url: `/sales/targets/${targetId}/recalculate`,
  method: 'POST',
}));

export const salesApi = {
  useGetTargetsQuery,
  useGetSalesTrackingQuery,
  useCreateTargetMutation,
  useUpdateTargetMutation,
  useGenerateMonthlyReportQuery,
  useRecalculateMetricsMutation,
};
