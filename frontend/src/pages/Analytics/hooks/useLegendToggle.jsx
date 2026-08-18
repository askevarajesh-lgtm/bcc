import React, { useCallback, useState } from 'react';

/**
 * Powers click-to-toggle legends on Recharts charts: clicking a legend
 * entry hides/shows that series (dataKey stays mounted with `hide`, so
 * animations and axis scaling stay correct).
 */
export function useLegendToggle() {
  const [hiddenKeys, setHiddenKeys] = useState(() => new Set());

  const onLegendClick = useCallback((entry) => {
    const key = entry?.dataKey ?? entry?.value;
    setHiddenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  const isHidden = useCallback((key) => hiddenKeys.has(key), [hiddenKeys]);

  const legendFormatter = useCallback((value, entry) => {
    const key = entry?.dataKey ?? value;
    return <span style={{ opacity: hiddenKeys.has(key) ? 0.4 : 1, cursor: 'pointer', userSelect: 'none' }}>{value}</span>;
  }, [hiddenKeys]);

  return { onLegendClick, isHidden, legendFormatter };
}
