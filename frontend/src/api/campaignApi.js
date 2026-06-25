import { baseApi } from "./baseApi";

export const campaignApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCampaigns: builder.query({
      query: (params) => ({
        url: "/campaigns",
        params,
      }),
      providesTags: ["Campaign"],
    }),
    // Dropdown query - no pagination, just search with limit
    getCampaignsDropdown: builder.query({
      query: (params) => ({
        url: "/campaigns/dropdown",
        params: {
          ...params,
          limit: params.limit || 20,
        },
      }),
      providesTags: ["Campaign"],
    }),
    getCampaignById: builder.query({
      query: (id) => `/campaigns/${id}`,
      providesTags: ["Campaign"],
    }),
    getClientCampaignSummary: builder.query({
      query: (clientId) => `/campaigns/client-summary/${clientId}`,
      providesTags: ["Campaign"],
    }),
    createCampaign: builder.mutation({
      query: (data) => ({
        url: "/campaigns",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Campaign"],
    }),
    addDailyData: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/campaigns/${id}/daily-data`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Campaign"],
    }),
    updatePayment: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/campaigns/${id}/payment`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Campaign"],
    }),
    reconcilePayment: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/campaigns/${id}/reconcile-payment`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Campaign"],
    }),
    addRecharge: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/campaigns/${id}/recharge`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Campaign"],
    }),
    getGlobalRecharges: builder.query({
      query: (params) => ({
        url: "/campaigns/recharges",
        params,
      }),
      providesTags: ["Campaign"],
    }),
    addGlobalRecharge: builder.mutation({
      query: (data) => ({
        url: "/campaigns/recharges",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Campaign"],
    }),
    updateGlobalRecharge: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/campaigns/recharges/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Campaign"],
    }),
    updateRecharge: builder.mutation({
      query: ({ campaignId, rechargeId, ...data }) => ({
        url: `/campaigns/${campaignId}/recharge/${rechargeId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Campaign"],
    }),
    deleteGlobalRecharge: builder.mutation({
      query: (id) => ({
        url: `/campaigns/recharges/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Campaign"],
    }),
    deleteCampaign: builder.mutation({
      query: (id) => ({
        url: `/campaigns/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Campaign"],
    }),
    updateCampaign: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/campaigns/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Campaign"],
    }),
  }),
});

export const {
  useGetCampaignsQuery,
  useGetCampaignsDropdownQuery,
  useGetCampaignByIdQuery,
  useGetClientCampaignSummaryQuery,
  useCreateCampaignMutation,
  useUpdateCampaignMutation,
  useAddDailyDataMutation,
  useUpdatePaymentMutation,
  useReconcilePaymentMutation,
  useAddRechargeMutation,
  useGetGlobalRechargesQuery,
  useAddGlobalRechargeMutation,
  useUpdateGlobalRechargeMutation,
  useDeleteGlobalRechargeMutation,
  useUpdateRechargeMutation,
  useDeleteCampaignMutation,
} = campaignApi;
