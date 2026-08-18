import React from 'react';
import { Typography, Row, Col, Table } from 'antd';
import { CheckCircleOutlined, WarningOutlined, GlobalOutlined, LinkOutlined, StarOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const PDFReportTemplate = React.forwardRef(({ project, projectData }, ref) => {
  if (!project || !projectData) return null;

  const data = projectData.overview || {};
  const backlinks = projectData.backlinksOverview || {};
  const health = projectData.siteHealth || {};
  const keywords = projectData.organicKeywords || [];

  const formatNumber = (num) => {
    if (!num && num !== 0) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return Number(num).toLocaleString();
  };

  const topKeywords = keywords.slice(0, 10);
  
  const columns = [
    { title: 'Keyword', dataIndex: 'keyword', key: 'keyword', render: text => <Text strong>{text}</Text> },
    { title: 'Position', dataIndex: 'position', key: 'position' },
    { title: 'Search Volume', dataIndex: 'searchVolume', key: 'searchVolume', render: val => formatNumber(val) },
    { title: 'KD %', dataIndex: 'keywordDifficulty', key: 'keywordDifficulty' },
    { title: 'CPC ($)', dataIndex: 'cpc', key: 'cpc' }
  ];

  return (
    <div
      ref={ref}
      style={{
        width: '794px', // A4 pixel width roughly at 96 DPI
        minHeight: '1123px', // A4 pixel height roughly
        padding: '60px',
        background: '#ffffff',
        fontFamily: 'Inter, sans-serif',
        color: '#1f2937',
        boxSizing: 'border-box'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f0f0f0', paddingBottom: '24px', marginBottom: '32px' }}>
        <div>
          <Title level={1} style={{ margin: 0, color: '#111827', fontSize: '36px' }}>SEO Performance Report</Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>Prepared for {project.domain}</Text>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ background: '#f3f4f6', padding: '12px 24px', borderRadius: '8px' }}>
            <Text style={{ display: 'block', fontSize: '14px', color: '#6b7280' }}>Generated On</Text>
            <Text strong style={{ fontSize: '16px' }}>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <Title level={3} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#374151' }}>
        <StarOutlined style={{ color: '#f59e0b' }} /> Executive Summary
      </Title>
      <Row gutter={[24, 24]} style={{ marginBottom: '40px' }}>
        <Col span={6}>
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>Authority Score</Text>
            <Text style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>{backlinks.score || data['Rank'] || '0'}</Text>
          </div>
        </Col>
        <Col span={6}>
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>Organic Traffic</Text>
            <Text style={{ fontSize: '28px', fontWeight: 700, color: '#10b981' }}>{formatNumber(data['Organic Traffic'])}</Text>
          </div>
        </Col>
        <Col span={6}>
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>Organic Keywords</Text>
            <Text style={{ fontSize: '28px', fontWeight: 700, color: '#3b82f6' }}>{formatNumber(data['Organic Keywords'])}</Text>
          </div>
        </Col>
        <Col span={6}>
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>Paid Keywords</Text>
            <Text style={{ fontSize: '28px', fontWeight: 700, color: '#8b5cf6' }}>{formatNumber(data['Adwords Traffic'])}</Text>
          </div>
        </Col>
      </Row>

      {/* Backlinks & Site Health */}
      <Row gutter={[32, 0]} style={{ marginBottom: '40px' }}>
        <Col span={12}>
          <Title level={4} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#374151', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
            <LinkOutlined style={{ color: '#3b82f6' }} /> Backlink Profile
          </Title>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', marginBottom: '8px' }}>
            <Text>Total Backlinks</Text>
            <Text strong>{formatNumber(backlinks.total || backlinks.backlinks)}</Text>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <Text>Referring Domains</Text>
            <Text strong>{formatNumber(backlinks.backlinksDetails?.referringDomains || 0)}</Text>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <Text>Follow Links</Text>
            <Text strong style={{ color: '#10b981' }}>{formatNumber(backlinks.backlinksDetails?.follow || 0)}</Text>
          </div>
        </Col>
        <Col span={12}>
          <Title level={4} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#374151', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
            <GlobalOutlined style={{ color: '#8b5cf6' }} /> Site Health
          </Title>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', marginBottom: '8px' }}>
            <Text>Overall Health Score</Text>
            <Text strong style={{ color: health.overallScore >= 80 ? '#10b981' : (health.overallScore >= 60 ? '#f59e0b' : '#ef4444') }}>{health.overallScore ?? 'Unavailable'}{health.overallScore !== null && health.overallScore !== undefined ? '%' : ''}</Text>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <Text><CheckCircleOutlined style={{ color: '#10b981', marginRight: '4px' }}/> Passed Checks (Healthy Pages)</Text>
            <Text strong>{formatNumber(health.siteHealthDetails?.healthy || 0)}</Text>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <Text><WarningOutlined style={{ color: '#ef4444', marginRight: '4px' }}/> Issues (Errors & Warnings)</Text>
            <Text strong>{formatNumber((health.siteHealthDetails?.errors?.length || 0) + (health.siteHealthDetails?.warnings?.length || 0))}</Text>
          </div>
        </Col>
      </Row>

      {/* Top Keywords Table */}
      <Title level={3} style={{ color: '#374151', marginBottom: '24px' }}>Top Organic Keywords</Title>
      {topKeywords.length > 0 ? (
        <Table 
          dataSource={topKeywords} 
          columns={columns} 
          pagination={false} 
          rowKey={(record, idx) => idx}
          bordered
          size="middle"
        />
      ) : (
        <div style={{ padding: '24px', background: '#f9fafb', border: '1px dashed #d1d5db', textAlign: 'center', borderRadius: '8px' }}>
          <Text type="secondary">No organic keyword data available for this domain.</Text>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: '60px', paddingTop: '24px', borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          This report was automatically generated. Data provided by Semrush via API integration.
        </Text>
      </div>

    </div>
  );
});

export default PDFReportTemplate;
