const toGa4Date = (d) => d.toISOString().split('T')[0]; // GA4/GSC expect YYYY-MM-DD

function resolveDateRange(rawDateRange) {
  let start;
  let end;

  if (rawDateRange && typeof rawDateRange === 'object' && rawDateRange.start && rawDateRange.end) {
    start = new Date(rawDateRange.start);
    end = new Date(rawDateRange.end);
  } else if (typeof rawDateRange === 'string') {
    try {
      const parsed = JSON.parse(rawDateRange);
      if (parsed.start && parsed.end) {
        start = new Date(parsed.start);
        end = new Date(parsed.end);
      }
    } catch (e) {
      // Not JSON — fall through to default below.
    }
  }

  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    end = new Date();
    start = new Date();
    start.setDate(start.getDate() - 30);
  }

  if (start.getTime() > end.getTime()) {
    [start, end] = [end, start];
  }

  const endExclusive = new Date(end);
  endExclusive.setDate(endExclusive.getDate() + 1);

  const durationMs = endExclusive.getTime() - start.getTime();
  const previousEndExclusive = new Date(start);
  const previousStart = new Date(start.getTime() - durationMs);

  return {
    start,
    end,
    endExclusive,
    ga4Start: toGa4Date(start),
    ga4End: toGa4Date(end),
    previousStart,
    previousEndExclusive,
    previousGa4Start: toGa4Date(previousStart),
    previousGa4End: toGa4Date(new Date(previousEndExclusive.getTime() - 1))
  };
}

module.exports = { resolveDateRange };