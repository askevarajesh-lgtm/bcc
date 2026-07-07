import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

// ─────────────────────────────────────────────────────────────────────────────
//  Shared hook factories  (same pattern as the rest of the app)
// ─────────────────────────────────────────────────────────────────────────────
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

    useEffect(() => { refetch(); }, [refetch]);

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
        const url    = typeof config === 'string' ? config : config.url;
        const method = typeof config === 'object' && config.method ? config.method : 'POST';
        const body   = typeof config === 'object' ? config.body : undefined;
        const response = await api({ url, method, data: body });
        setError(null);
        return { data: response.data };
      } catch (err) {
        setError(err);
        return { error: err };
      } finally {
        setIsLoading(false);
      }
    };
    return [mutate, { isLoading, error }];
  };
};

// ─────────────────────────────────────────────────────────────────────────────
//  SEO Intelligence API
//  Base prefix: /seo-intelligence
//  SEO Websites use: /seo-intelligence/websites   (NOT /projects)
//  This is completely separate from the CRM /projects API.
// ─────────────────────────────────────────────────────────────────────────────

// Dashboard & Integration
export const useTestIntegrationQuery    = createQueryHook(() => ({ url: '/seo-intelligence/integration-test' }));
export const useGetDashboardStatsQuery  = createQueryHook((params) => ({ url: '/seo-intelligence/dashboard-stats', params }));
export const useGetApiCreditUsageQuery  = createQueryHook(() => ({ url: '/seo-intelligence/credit-usage' }));

// SEO Websites (separate collection from CRM Projects)
export const useGetSeoProjectsQuery     = createQueryHook((params) => ({ url: '/seo-intelligence/websites', params }));
export const useCreateSeoProjectMutation = createMutationHook((body) => ({ url: '/seo-intelligence/websites', method: 'POST', body }));
export const useUpdateSeoProjectMutation = createMutationHook(({ id, ...body }) => ({ url: `/seo-intelligence/websites/${id}`, method: 'PUT', body }));
export const useDeleteSeoProjectMutation = createMutationHook((id) => ({ url: `/seo-intelligence/websites/${id}`, method: 'DELETE' }));

// Keyword Research (standalone)
export const useResearchKeywordsMutation = createMutationHook((body) => ({ url: '/seo-intelligence/keywords/research', method: 'POST', body }));

// Per-Website Keyword Tracking
export const useGetTrackedKeywordsQuery  = createQueryHook((websiteId) => ({ url: `/seo-intelligence/websites/${websiteId}/keywords` }));
export const useAddKeywordsMutation      = createMutationHook(({ projectId, keywords }) => ({ url: `/seo-intelligence/websites/${projectId}/keywords`, method: 'POST', body: { keywords } }));
export const useRemoveKeywordMutation    = createMutationHook(({ projectId, keywordId }) => ({ url: `/seo-intelligence/websites/${projectId}/keywords/${keywordId}`, method: 'DELETE' }));
export const useRefreshRankingsMutation  = createMutationHook((websiteId) => ({ url: `/seo-intelligence/websites/${websiteId}/keywords/refresh`, method: 'POST' }));

// Site Audit
export const useRunAuditMutation         = createMutationHook((websiteId) => ({ url: `/seo-intelligence/websites/${websiteId}/audit`, method: 'POST' }));

// Backlinks
export const useGetBacklinksQuery        = createQueryHook((websiteId) => ({ url: `/seo-intelligence/websites/${websiteId}/backlinks` }));

// Advanced Analytics
export const useGetDomainOverviewQuery   = createQueryHook((websiteId) => ({ url: `/seo-intelligence/websites/${websiteId}/domain-overview` }));
export const useGetCompetitorsQuery      = createQueryHook((websiteId) => ({ url: `/seo-intelligence/websites/${websiteId}/competitors` }));
export const useGetPageSpeedMutation     = createMutationHook(({ websiteId, ...body }) => ({ url: `/seo-intelligence/websites/${websiteId}/page-speed`, method: 'POST', body }));
export const useGetLocalSeoQuery         = createQueryHook(({ websiteId, keyword }) => ({ url: `/seo-intelligence/websites/${websiteId}/local-seo`, params: { keyword } }));
export const useGetContentAnalysisMutation = createMutationHook(({ websiteId, ...body }) => ({ url: `/seo-intelligence/websites/${websiteId}/content-analysis`, method: 'POST', body }));
