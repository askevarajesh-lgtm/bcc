import { useCallback, useEffect, useRef, useState } from 'react';
import { analyticsApi } from '../../../api/analyticsApi';

/**
 * Encapsulates fetching the Analytics dashboard payload: loading/error state,
 * retry, manual refresh, and cancellation of in-flight requests that are
 * superseded by a newer filter change (prevents a slow, stale response from
 * overwriting fresher data — a real race condition, not a style choice).
 */
export function useAnalyticsData({ clientId, dateRange }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const requestIdRef = useRef(0);

  const fetchAnalytics = useCallback(async ({ silent = false } = {}) => {
    const thisRequestId = ++requestIdRef.current;
    if (silent) setRefreshing(true); else setLoading(true);
    setError(null);

    try {
      const rangeParam = dateRange
        ? { start: dateRange[0].format('YYYY-MM-DD'), end: dateRange[1].format('YYYY-MM-DD') }
        : null;
      const res = await analyticsApi.getAnalytics(clientId, rangeParam);

      // A newer request has already started — discard this stale response.
      if (thisRequestId !== requestIdRef.current) return;

      if (res.success) {
        setData(res.data);
        setLastUpdatedAt(new Date());
      } else {
        setError(res.message || 'Failed to load analytics data.');
      }
    } catch (err) {
      if (thisRequestId !== requestIdRef.current) return;
      setError(err?.response?.data?.message || err?.message || 'Failed to load analytics data.');
    } finally {
      if (thisRequestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [clientId, dateRange]);

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, dateRange?.[0]?.valueOf(), dateRange?.[1]?.valueOf()]);

  const refresh = useCallback(() => fetchAnalytics({ silent: true }), [fetchAnalytics]);
  const retry = useCallback(() => fetchAnalytics({ silent: false }), [fetchAnalytics]);

  return { data, loading, refreshing, error, lastUpdatedAt, refresh, retry };
}
