import { createQueryHook, createMutationHook } from "./baseApi";

export const useCreateDomainPurchaseMutation = createMutationHook((data) => ({
  url: "/domain-purchases",
  method: "POST",
  body: data,
}));

export const useUpdateDomainPurchaseMutation = createMutationHook(({ id, ...data }) => ({
  url: `/domain-purchases/${id}`,
  method: "PUT",
  body: data,
}));

export const useDeleteDomainPurchaseMutation = createMutationHook((id) => ({
  url: `/domain-purchases/${id}`,
  method: "DELETE",
}));

export const useGetAllDomainPurchasesQuery = createQueryHook((params) => ({
  url: "/domain-purchases",
  params,
}));

export const useGetDomainPurchaseByIdQuery = createQueryHook((id) => `/domain-purchases/${id}`);
