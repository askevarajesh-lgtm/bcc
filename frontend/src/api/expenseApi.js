import { createQueryHook, createMutationHook } from './baseApi';

export const useGetExpensesQuery = createQueryHook((params) => ({
  url: '/expenses',
  params,
}));

export const useGetExpensesDropdownQuery = createQueryHook((params) => ({
  url: '/expenses/dropdown',
  params: {
    ...params,
    limit: params?.limit || 20,
  },
}));

export const useGetExpenseByIdQuery = createQueryHook((id) => `/expenses/${id}`);

export const useCreateExpenseMutation = createMutationHook((data) => ({
  url: '/expenses',
  method: 'POST',
  body: data,
}));

export const useUpdateExpenseMutation = createMutationHook(({ id, ...data }) => ({
  url: `/expenses/${id}`,
  method: 'PUT',
  body: data,
}));

export const useDeleteExpenseMutation = createMutationHook((id) => ({
  url: `/expenses/${id}`,
  method: 'DELETE',
}));

export const useGetProfitLossQuery = createQueryHook((params) => ({
  url: '/expenses/profit-loss',
  params,
}));

export const useGetExpenseStatsQuery = createQueryHook((params) => ({
  url: '/expenses/stats',
  params,
}));

export const useGetMonthlySummaryQuery = createQueryHook((params) => ({
  url: '/expenses/monthly-summary',
  params,
}));

export const useDuplicateFixedExpensesMutation = createMutationHook((data) => ({
  url: '/expenses/duplicate-fixed-expenses',
  method: 'POST',
  body: data,
}));

export const useDuplicateVariableExpensesMutation = createMutationHook((data) => ({
  url: '/expenses/duplicate-variable-expenses',
  method: 'POST',
  body: data,
}));

export const useGetSalaryHistoryQuery = createQueryHook((staffId, params = {}) => ({
  url: `/expenses/salary-history/${staffId}`,
  params,
}));

export const useGetAllSalaryHistoryQuery = createQueryHook((params = {}) => ({
  url: '/expenses/salary-history',
  params,
}));
