import { createQueryHook, createMutationHook } from "./baseApi";

export const useRecordPaymentMutation = createMutationHook((data) => {
  if (data instanceof FormData) {
    return {
      url: "/transactions/manual",
      method: "POST",
      formData: data, 
    };
  }
  return {
    url: "/transactions/manual",
    method: "POST",
    body: data,
  };
});

export const useGetPaymentsByInvoiceQuery = createQueryHook((invoiceId) => `/transactions?invoiceId=${invoiceId}`);

export const useGetPaymentSummaryQuery = createQueryHook((invoiceId) => `/transactions/invoice/${invoiceId}/summary`);

export const useVerifyPaymentMutation = createMutationHook(({ id, verificationNotes }) => ({
  url: `/transactions/${id}/verify`,
  method: "PUT",
  body: { status: 'Verified', verificationNotes },
}));

export const useRejectPaymentMutation = createMutationHook(({ id, rejectionNotes }) => ({
  url: `/transactions/${id}/verify`,
  method: "PUT",
  body: { status: 'Rejected', rejectionNotes },
}));

export const useGetAllPaymentsQuery = createQueryHook((params) => ({
  url: "/transactions",
  params,
}));
