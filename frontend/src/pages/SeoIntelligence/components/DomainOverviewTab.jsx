import React, { useState } from 'react';
import { Card, Select, Button, Typography, Row, Col, Spin, Progress, Statistic, Alert, Space } from 'antd';
import { Activity, Globe, TrendingUp, Search } from 'lucide-react';
import { useGetDomainOverviewQuery } from '../../../api/seoIntelligenceApi';

const { Title, Text } = Typography;

const DomainOverviewTab = ({ projects }) => {
  const [selectedProject, setSelectedProject] = useState(projects[0]?._id);
  const [hasRun, setHasRun] = useState(false);

  React.useEffect(() => {
    if (!selectedProject && projects?.length > 0) {
      setSelectedProject(projects[0]._id);
    }
  }, [projects, selectedProject]);

  const { data: overviewData, isLoading, error } = useGetDomainOverviewQuery(
    selectedProject, 
    { skip: !hasRun || !selectedProject }
  );

  const metrics = overviewData?.data?.metrics?.organic || null;

  const handleRunAnalysis = () => {
    if (!selectedProject) return;
    setHasRun(true);
  };

  return (
    <div style={{ padding: '24px 0' }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card title="Domain Authority & SEO Score" style={{ borderRadius: 16, border: '1px solid var(--border-color)', height: '100%' }}>
            <div style={{ marginBottom: 24 }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                Fetch live Domain Trust (Authority), Estimated Traffic, and Ranked Keywords directly from DataForSEO.
              </Text>
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>Target Project</Text>
                <Select 
                  size="large" 
                  value={selectedProject} 
                  onChange={(val) => {
                    setSelectedProject(val);
                    setHasRun(false);
                  }}
                  options={projects.map(p => ({ label: p.domain, value: p._id }))}
                  style={{ width: '100%' }}
                />
              </div>
              <Button 
                type="primary" 
                size="large" 
                block 
                loading={isLoading} 
                onClick={handleRunAnalysis} 
                icon={<Activity size={18} />} 
                style={{ borderRadius: 8 }}
              >
                Get Live Domain Score
              </Button>
            </div>
            {error && (
              <Alert message="Failed to fetch metrics. Ensure DataForSEO API credits are available." type="error" showIcon />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title={<Text strong>Domain Performance Metrics</Text>} style={{ borderRadius: 16, border: '1px solid var(--border-color)', height: '100%' }}>
             {isLoading ? (
                <div style={{ padding: '80px 0', textAlign: 'center' }}><Spin size="large" /></div>
              ) : metrics ? (
                <Row gutter={[24, 24]} align="middle">
                  <Col xs={24} sm={10} style={{ textAlign: 'center' }}>
                    <Progress 
                      type="dashboard" 
                      percent={metrics.domain_trust || 0} 
                      strokeColor={
                        (metrics.domain_trust || 0) > 70 ? '#10b981' : 
                        (metrics.domain_trust || 0) > 40 ? '#f59e0b' : '#ef4444'
                      }
                      format={percent => (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)' }}>{percent}</span>
                          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Domain Trust</span>
                        </div>
                      )}
                      size={200}
                      strokeWidth={8}
                    />
                  </Col>
                  <Col xs={24} sm={14}>
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <Card size="small" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12 }}>
                          <Statistic 
                            title={<Space><TrendingUp size={14} color="#16a34a" /><Text strong style={{ color: '#16a34a' }}>Organic Traffic</Text></Space>} 
                            value={Math.round(metrics.etv || 0).toLocaleString()} 
                            valueStyle={{ fontWeight: 700, fontSize: 24 }}
                          />
                        </Card>
                      </Col>
                      <Col span={12}>
                        <Card size="small" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12 }}>
                          <Statistic 
                            title={<Space><Search size={14} color="#2563eb" /><Text strong style={{ color: '#2563eb' }}>Ranked Keywords</Text></Space>} 
                            value={metrics.count || 0} 
                            valueStyle={{ fontWeight: 700, fontSize: 24 }}
                          />
                        </Card>
                      </Col>
                      <Col span={24}>
                        <Card size="small" style={{ background: 'var(--bg-secondary)', border: 0, borderRadius: 12 }}>
                          <Statistic 
                            title="Impressions (Est)" 
                            value={metrics.impressions_etv || (metrics.count * 100)} 
                            valueStyle={{ fontWeight: 700 }}
                          />
                        </Card>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              ) : (
                <div style={{ padding: '80px 0', textAlign: 'center', opacity: 0.6 }}>
                  <Globe size={64} color="var(--text-secondary)" style={{ marginBottom: 16, opacity: 0.2 }} />
                  {!hasRun ? (
                    <Text type="secondary" style={{ display: 'block', fontSize: 16 }}>Click "Get Live Domain Score" to fetch metrics.</Text>
                  ) : (
                    <Text type="secondary" style={{ display: 'block', fontSize: 16 }}>No organic ranking data found for this domain.</Text>
                  )}
                </div>
              )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DomainOverviewTab;

// Need to import Space at the top
