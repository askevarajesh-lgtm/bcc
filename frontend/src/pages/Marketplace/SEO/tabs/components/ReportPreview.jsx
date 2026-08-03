import React, { useState } from 'react';
import { Typography, Row, Col, Card, Statistic, Divider, Tabs, List, Tag, Alert, Empty } from 'antd';
import { Activity, Target, Zap, LayoutTemplate } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const ReportPreview = ({ report }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!report) return null;

  // Fallback for legacy monolithic reports that don't have new JSON structures
  if (!report.metrics && !report.executiveSummary && report.content) {
    return (
      <div style={{ padding: '20px 0' }}>
        <Alert type="info" message="Legacy Report Format" description="This report was generated using an older format and is displayed in raw markdown." style={{ marginBottom: 16 }} />
        <Card>
           <ReactMarkdown>{report.content}</ReactMarkdown>
        </Card>
      </div>
    );
  }

  // Parse structured data safely
  const metrics = report.metrics || {};
  let execSummary = report.executiveSummary || '';
  let actionPlan = report.actionPlan || '';
  
  try { if (typeof execSummary === 'string') execSummary = JSON.parse(execSummary); } catch(e){}
  try { if (typeof actionPlan === 'string') actionPlan = JSON.parse(actionPlan); } catch(e){}

  const renderOverview = () => (
    <div style={{ padding: '20px 0' }}>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="SEO Score" value={metrics.seoScore || 0} prefix={<Target size={16} style={{marginRight: 8, color: '#1890ff'}}/>} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Technical Score" value={metrics.technicalScore || 0} prefix={<Zap size={16} style={{marginRight: 8, color: '#52c41a'}}/>} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Content Score" value={metrics.contentScore || 0} prefix={<LayoutTemplate size={16} style={{marginRight: 8, color: '#722ed1'}}/>} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Performance Score" value={metrics.performanceScore || 0} prefix={<Activity size={16} style={{marginRight: 8, color: '#fa8c16'}}/>} />
          </Card>
        </Col>
      </Row>

      <Divider />
      
      {execSummary && (
        <Card title="Executive Summary" style={{ marginBottom: 16 }}>
          <Text>{execSummary.content || execSummary}</Text>
        </Card>
      )}

      {actionPlan && (
        <Card title="Recommended Action Plan">
          {Array.isArray(actionPlan.tasks) ? (
            <List 
              size="small"
              dataSource={actionPlan.tasks}
              renderItem={(task, i) => (
                <List.Item>
                  <Text strong>{i + 1}.</Text> <Text>{task}</Text>
                </List.Item>
              )}
            />
          ) : (
             <Text>{actionPlan.content || actionPlan}</Text>
          )}
        </Card>
      )}
    </div>
  );

  const renderRaw = (type) => (
    <Card style={{ marginTop: 20 }}>
      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12, backgroundColor: '#fafafa', padding: 12, borderRadius: 4 }}>
        {type === 'json' ? JSON.stringify(report, null, 2) : report.content}
      </pre>
    </Card>
  );

  return (
    <Tabs activeKey={activeTab} onChange={setActiveTab}>
      <TabPane tab="Overview" key="overview">
        {renderOverview()}
      </TabPane>
      <TabPane tab="Charts & Trends" key="charts">
        <Empty description="Chart rendering from backend definitions will be implemented here." style={{ margin: '40px 0' }} />
      </TabPane>
      <TabPane tab="Raw JSON" key="json">
        {renderRaw('json')}
      </TabPane>
      {report.content && (
        <TabPane tab="Raw Markdown" key="markdown">
          {renderRaw('markdown')}
        </TabPane>
      )}
    </Tabs>
  );
};

export default ReportPreview;
