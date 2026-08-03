import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, message, Tag } from 'antd';
import { Copy } from 'lucide-react';
import { seoWorkspaceApi } from '../../../../../../api/seoWorkspaceApi';

export default function TemplatesList({ projectId }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await seoWorkspaceApi.getAutomationTemplates();
      setTemplates(res.data || []);
    } catch (error) {
      message.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async (templateId) => {
    message.info('Using template ' + templateId);
    // Future: Call API to clone template into a new workflow for this project
  };

  return (
    <div style={{ padding: '0 8px' }}>
      <Row gutter={[16, 16]}>
        {loading ? <div>Loading templates...</div> : templates.length === 0 ? <div>No templates available.</div> : null}
        {templates.map(tpl => (
          <Col span={8} key={tpl._id}>
            <Card className="glass-card" title={tpl.name} extra={<Tag color="purple">{tpl.category}</Tag>}>
              <p style={{ minHeight: 40, color: 'var(--text-secondary)' }}>{tpl.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>By {tpl.author}</span>
                <Button type="primary" icon={<Copy size={14} />} onClick={() => handleUseTemplate(tpl._id)}>
                  Use Template
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
