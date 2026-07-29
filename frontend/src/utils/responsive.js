/**
 * Responsive utility functions and constants
 */

// Breakpoints (matching Ant Design's breakpoints)
export const BREAKPOINTS = {
  xs: 480,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
};

// Responsive column configurations for Ant Design Grid
export const RESPONSIVE_COLS = {
  // For 2 columns
  twoCols: {
    xs: 24,
    sm: 24,
    md: 12,
    lg: 12,
    xl: 12,
  },
  // For 3 columns
  threeCols: {
    xs: 24,
    sm: 24,
    md: 12,
    lg: 8,
    xl: 8,
  },
  // For 4 columns
  fourCols: {
    xs: 24,
    sm: 12,
    md: 12,
    lg: 6,
    xl: 6,
  },
  // For filters/search bars
  filterCols: {
    xs: 24,
    sm: 24,
    md: 12,
    lg: 8,
    xl: 6,
  },
};

// Responsive table column configurations
export const getResponsiveTableColumns = (columns, breakpoint = "md") => {
  return columns.map((col) => ({
    ...col,
    responsive: col.responsive || [breakpoint],
  }));
};

// Hide columns on mobile
export const hideOnMobile = {
  xs: false,
  sm: false,
  md: true,
};

// Show only on mobile
export const showOnlyOnMobile = {
  xs: true,
  sm: true,
  md: false,
};

// Responsive spacing
export const SPACING = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
};

// Get responsive spacing
export const getSpacing = (size = "md") => SPACING[size] || SPACING.md;
