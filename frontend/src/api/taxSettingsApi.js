import { createQueryHook, createMutationHook } from "./baseApi";

export const useGetTaxSettingsQuery = createQueryHook(() => "/tax-settings");
export const useUpdateTaxSettingsMutation = createMutationHook((data) => ({
  url: "/tax-settings",
  method: "PUT",
  body: data,
}));
