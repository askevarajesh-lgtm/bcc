import React from 'react';
import { Row, Col, Card, Statistic, Progress } from 'antd';
import { ShieldCheck, Zap, Globe, FileSearch } from 'lucide-react';

const OverviewCharts = ({ data }) => {
  if (!data) return null;

  const score = data.overallScore || 0;

  return (
    <div style={{ padding: '16px 0' }}>
      <Row gutter={[16, 16]}>
        <Col span={24} md={8}>
          <Card style={{ height: '100%', textAlign: 'center' }}>
            <h3>Overall Health Score</h3>
            <Progress
              type="dashboard"
              percent={score}
              strokeColor={score > 80 ? '#52c41a' : score > 50 ? '#faad14' : '#f5222d'}
              format={percent => `${percent}/100`}
              size={180}
            />
          </Card>
        </Col>
        <Col span={24} md={16}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card>
                <Statistic title="Core Web Vitals" value={data.categories?.core_web_vitals || 0} suffix="/ 100" prefix={<Zap size={18} color="#faad14" />} />
              </Card>
            </Col>
            <Col span={12}>
              <Card>
                <Statistic title="Indexability" value={data.categories?.indexability || 0} suffix="/ 100" prefix={<Globe size={18} color="#1890ff" />} />
              </Card>
            </Col>
            <Col span={12}>
              <Card>
                <Statistic title="Security" value={data.categories?.security || 0} suffix="/ 100" prefix={<ShieldCheck size={18} color="#52c41a" />} />
              </Card>
            </Col>
            <Col span={12}>
              <Card>
                <Statistic title="Schema" value={data.categories?.schema || 0} suffix="/ 100" prefix={<FileSearch size={18} color="#722ed1" />} />
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default OverviewCharts;
