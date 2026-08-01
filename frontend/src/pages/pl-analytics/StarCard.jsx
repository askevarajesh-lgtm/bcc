import React from "react";
import { Card, Statistic } from "antd";

/**
 * StatCard Component
 * A reusable card component for displaying statistics with color variants
 *
 * @param {string} variant - 'green' for profit/income, 'red' for loss/expenses, 'neutral' for default
 * @param {string} title - The title/label for the statistic
 * @param {number} value - The numerical value to display
 * @param {string} subtitle - Optional subtitle text below the statistic
 * @param {ReactNode} prefix - Optional prefix icon (e.g., <RiseOutlined />)
 * @param {string} suffix - Optional suffix text (e.g., '%')
 * @param {number} precision - Decimal precision (default: 2)
 * @param {function} formatter - Custom formatter function for the value
 * @param {object} style - Additional custom styles for the card
 */
const StatCard = ({
  variant = "neutral",
  title,
  value,
  subtitle,
  prefix,
  suffix,
  precision = 2,
  formatter,
  style = {},
}) => {
  // Color configurations for different variants
  const variantStyles = {
    green: {
      cardStyle: {
        borderLeft: "4px solid #52c41a",
        transition: "all 0.3s ease",
      },
      cardHoverStyle: {
        boxShadow: "0 4px 12px rgba(82, 196, 26, 0.15)",
        transform: "translateY(-2px)",
      },
      valueColor: "#3f8600",
      titleColor: "#389e0d",
    },
    red: {
      cardStyle: {
        borderLeft: "4px solid #ff4d4f",
        transition: "all 0.3s ease",
      },
      cardHoverStyle: {
        boxShadow: "0 4px 12px rgba(255, 77, 79, 0.15)",
        transform: "translateY(-2px)",
      },
      valueColor: "#cf1322",
      titleColor: "#cf1322",
    },
    neutral: {
      cardStyle: {
        borderLeft: "4px solid var(--accent-primary)",
        transition: "all 0.3s ease",
      },
      cardHoverStyle: {
        boxShadow: "0 4px 12px rgba(24, 144, 255, 0.15)",
        transform: "translateY(-2px)",
      },
      valueColor: "var(--accent-primary)",
      titleColor: "var(--accent-primary)",
    },
    warning: {
      cardStyle: {
        borderLeft: "4px solid #faad14",
        transition: "all 0.3s ease",
      },
      cardHoverStyle: {
        boxShadow: "0 4px 12px rgba(250, 173, 20, 0.15)",
        transform: "translateY(-2px)",
      },
      valueColor: "#faad14",
      titleColor: "#d48806",
    },
  };

  const currentVariant = variantStyles[variant] || variantStyles.neutral;
  const [isHovered, setIsHovered] = React.useState(false);

  // Default currency formatter for Indian Rupee
  const defaultFormatter = (val) =>
    `₹${val?.toLocaleString("en-IN", {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    })}`;

  const cardStyle = {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    borderRadius: "8px",
    ...currentVariant.cardStyle,
    ...(isHovered ? currentVariant.cardHoverStyle : {}),
    ...style,
  };

  return (
    <Card
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      hoverable
    >
      <Statistic
        title={
          <span
            style={{
              color: currentVariant.titleColor,
              fontWeight: 500,
              fontSize: "14px",
            }}
          >
            {title}
          </span>
        }
        value={value}
        prefix={prefix}
        suffix={suffix}
        valueStyle={{
          color: currentVariant.valueColor,
          fontSize: "24px",
          fontWeight: "bold",
        }}
        precision={precision}
        formatter={formatter || defaultFormatter}
      />
      {subtitle && (
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: "#666",
            minHeight: 20,
            fontWeight: 400,
          }}
        >
          {subtitle}
        </div>
      )}
    </Card>
  );
};

export default StatCard;
