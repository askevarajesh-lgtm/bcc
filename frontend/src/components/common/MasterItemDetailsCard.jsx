import React from 'react';
import { Card, Descriptions, Tag, Typography } from 'antd';

const { Text } = Typography;

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return 'N/A';
  return `₹${amount.toLocaleString('en-IN')}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).replace(',', '');
};

const MasterItemDetailsCard = ({
  service,
  packageName,
  isDark,
  numberOfPosters,
  numberOfVideos,
  numberOfShoots,
  remainingPosters,
  remainingVideos,
  remainingShoots,
  selectedCategories,
  overriddenHandlingAmount,
  overriddenCampaignAmount
}) => {
  if (!service) return null;

  const cardTitle = packageName ? `Package Details: ${packageName}` : 'Master Item Details';

  const posters = numberOfPosters ?? service.numberOfPosters;
  const videos = numberOfVideos ?? service.numberOfVideos;
  const shoots = numberOfShoots ?? service.numberOfShoots;

  const handlingAmt = overriddenHandlingAmount ?? service.handlingAmount;
  const campaignAmt = overriddenCampaignAmount ?? service.campaignAmount;

  return (
    <Card
      title={<Text style={{ fontWeight: 600 }}>{cardTitle}</Text>}
      size="small"
      style={{
        marginTop: 16,
        backgroundColor: isDark ? '#0d1526' : '#f8f9fa',
        borderColor: isDark ? '#303030' : '#f0f0f0',
        borderRadius: 8,
      }}
      styles={{ header: { borderBottom: isDark ? '1px solid #303030' : '1px solid #f0f0f0' } }}
    >
      <Descriptions
        bordered
        size="small"
        column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
        style={{ background: isDark ? '#1f1f1f' : '#ffffff', borderRadius: 8, overflow: 'hidden' }}
      >
        {service.description && (
          <Descriptions.Item label="Description" span={2}>
            {service.description}
          </Descriptions.Item>
        )}

        <Descriptions.Item label="Item Type">
          <Tag color="default" style={{ textTransform: 'uppercase' }}>{service.itemType || 'N/A'}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Pricing Model">
          <Tag color="blue" style={{ textTransform: 'uppercase' }}>{service.pricingModel || 'N/A'}</Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Base Price">
          {formatCurrency(service.basePrice)}
        </Descriptions.Item>
        <Descriptions.Item label="Total Amount">
          {formatCurrency(service.totalAmount)}
        </Descriptions.Item>

        <Descriptions.Item label="Status">
          <Tag color={service.status === 'active' ? 'success' : 'default'}>
            {service.status ? service.status.charAt(0).toUpperCase() + service.status.slice(1) : 'Active'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Handling Amount">
          {formatCurrency(handlingAmt)}
        </Descriptions.Item>

        <Descriptions.Item label="Handling Duration">
          {service.handlingDuration ?? 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Campaign Amount">
          {formatCurrency(campaignAmt)}
        </Descriptions.Item>

        {posters > 0 && (
          <Descriptions.Item label="Number of Posters">
            <Text strong>{posters}</Text>
            {remainingPosters !== undefined && remainingPosters !== null && (
              <Tag color="cyan" style={{ marginLeft: 8 }}>Remaining: {remainingPosters}</Tag>
            )}
          </Descriptions.Item>
        )}

        {videos > 0 && (
          <Descriptions.Item label="Number of Videos">
            <Text strong>{videos}</Text>
            {remainingVideos !== undefined && remainingVideos !== null && (
              <Tag color="cyan" style={{ marginLeft: 8 }}>Remaining: {remainingVideos}</Tag>
            )}
          </Descriptions.Item>
        )}

        {shoots > 0 && (
          <Descriptions.Item label="Number of Shoots">
            <Text strong>{shoots ?? 0}</Text>
            {remainingShoots !== undefined && remainingShoots !== null && (
              <Tag color="cyan" style={{ marginLeft: 8 }}>Remaining: {remainingShoots}</Tag>
            )}
          </Descriptions.Item>
        )}

        {selectedCategories && selectedCategories.length > 0 && selectedCategories.map((cat, idx) => {
          const rawName = cat.name || cat.categoryName || "";
          const isPoster = rawName.toLowerCase().includes("poster");
          const isVideo = rawName.toLowerCase().includes("video");
          const isShoot = rawName.toLowerCase().includes("shoot");
          
          // Only skip if the legacy separate fields are actually going to render them
          if (isPoster && posters > 0) return null;
          if (isVideo && videos > 0) return null;
          if (isShoot && shoots > 0) return null;

          const singularName = rawName.toLowerCase().endsWith('s') ? rawName.slice(0, -1) : rawName;
          const formattedName = singularName ? `Number of ${singularName.charAt(0).toUpperCase() + singularName.slice(1)}s` : "Unknown Item";

          return (
            <Descriptions.Item key={`cat-${idx}`} label={formattedName}>
              <Text strong>{cat.quantity ?? cat.count ?? 0}</Text>
              {cat.remaining !== undefined && cat.remaining !== null && (
                <Tag color="cyan" style={{ marginLeft: 8 }}>Remaining: {cat.remaining}</Tag>
              )}
            </Descriptions.Item>
          );
        })}

        {service.applicableAccess && service.applicableAccess.length > 0 && (
          <Descriptions.Item label="Applicable Access / Deliverables" span={2}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {service.applicableAccess.map((access, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: isDark ? '1px solid #303030' : '1px solid #f0f0f0', paddingBottom: 4 }}>
                  <Text strong>{access.name}</Text>
                  <Text>{access.value}</Text>
                </div>
              ))}
            </div>
          </Descriptions.Item>
        )}

        <Descriptions.Item label="Campaign Alone">
          {service.campaignAlone ? 'Yes' : 'No'}
        </Descriptions.Item>
        <Descriptions.Item label="Created At">
          {service.createdAt ? formatDate(service.createdAt) : 'N/A'}
        </Descriptions.Item>

        <Descriptions.Item label="Updated At">
          {service.updatedAt ? formatDate(service.updatedAt) : 'N/A'}
        </Descriptions.Item>

        <Descriptions.Item label="Package Details">
          <Tag color="purple">{packageName || service.name || 'Package'}</Tag>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

export default MasterItemDetailsCard;
