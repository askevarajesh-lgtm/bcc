const getNextGenerationDate = (startDate, durationStr) => {
  const nextDate = new Date(startDate);
  if (!durationStr) {
    // default to 1 month if not specified
    const expectedMonth = nextDate.getMonth() + 1;
    nextDate.setMonth(expectedMonth);
    if (nextDate.getMonth() !== expectedMonth % 12 && nextDate.getMonth() !== (expectedMonth % 12 + 12) % 12) {
      nextDate.setDate(0);
    }
    return nextDate;
  }
  
  const str = durationStr.toLowerCase();
  if (str.includes('week')) {
    const match = str.match(/(\d+)/);
    const weeks = match ? parseInt(match[1]) : 1;
    nextDate.setDate(nextDate.getDate() + (weeks * 7));
  } else if (str.includes('day')) {
    const match = str.match(/(\d+)/);
    const days = match ? parseInt(match[1]) : 15;
    nextDate.setDate(nextDate.getDate() + days);
  } else if (str.includes('year')) {
    const match = str.match(/(\d+)/);
    const years = match ? parseInt(match[1]) : 1;
    nextDate.setFullYear(nextDate.getFullYear() + years);
  } else if (str.includes('month')) {
    const match = str.match(/(\d+)/);
    const months = match ? parseInt(match[1]) : 1;
    const expectedMonth = nextDate.getMonth() + months;
    nextDate.setMonth(expectedMonth);
    if (nextDate.getMonth() !== expectedMonth % 12 && nextDate.getMonth() !== (expectedMonth % 12 + 12) % 12) {
      nextDate.setDate(0);
    }
  } else {
    // fallback
    const expectedMonth = nextDate.getMonth() + 1;
    nextDate.setMonth(expectedMonth);
    if (nextDate.getMonth() !== expectedMonth % 12 && nextDate.getMonth() !== (expectedMonth % 12 + 12) % 12) {
      nextDate.setDate(0);
    }
  }
  return nextDate;
};

module.exports = { getNextGenerationDate };
