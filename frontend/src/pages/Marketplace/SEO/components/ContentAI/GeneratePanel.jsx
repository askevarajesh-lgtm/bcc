import React, { useEffect, useState } from 'react';
import { Card, Select, Form, Input, Button, Row, Col, Typography, message, Spin, Space, Tag } from 'antd';
import { Sparkles } from 'lucide-react';
import { useSEO } from '../../context/SEOContext';
import { contentAiApi } from '../../../../../api/contentAiApi';
import QualityScoreCard from './QualityScoreCard';
import WorkflowStatusBadge from './WorkflowStatusBadge';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

const TARGET_TYPE_LABELS = {
  landingPage: 'Landing Page',
  blogPost: 'Blog Post',
  product: 'Product',
  category: 'Category',
  standalone: 'Standalone'
};

// The 14 ContentAI generator modules, driven entirely by
// GET /content-ai/generators (contentAI.controller.js#listGenerators) —
// nothing about the 14 modules is hardcoded here beyond input-field labels.
const FIELD_LABELS = {
  topic: 'Topic / Subject', keywords: 'Target Keywords', keyMessage: 'Key Message',
  productName: 'Product Name', keyAttributes: 'Key Attributes / Specs', priceContext: 'Price / Positioning Context',
  competitors: 'Competitors', categoryName: 'Category Name', productExamples: 'Representative Products',
  count: 'Number of FAQs', existingContent: 'Existing Content', schemaType: 'Schema Type (e.g. Product, Article)',
  facts: 'Known Facts', images: 'Images (JSON array: [{"url":"...","context":"..."}])',
  goal: 'Conversion Goal', candidateLinks: 'Candidate Links (JSON array: [{"title":"...","url":"..."}])',
  sourceContent: 'Source Content', instructions: 'Rewrite Instructions',
  targetWordCount: 'Target Word Count', focusAreas: 'Areas to Expand'
};

const GeneratePanel = () => {
  const { activeProjectId, activeProject } = useSEO();
  const [generators, setGenerators] = useState([]);
  const [selectedGenerator, setSelectedGenerator] = useState(null);
  const [targetType, setTargetType] = useState(null);
  const [brandVoices, setBrandVoices] = useState([]);
  const [brandVoiceId, setBrandVoiceId] = useState(null);
  const [fieldValues, setFieldValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { contentPiece, version }

  useEffect(() => {
    (async () => {
      try {
        const [genRes, bvRes] = await Promise.all([
          contentAiApi.getGenerators(),
          contentAiApi.getBrandVoices()
        ]);
        setGenerators(genRes.data || []);
        setBrandVoices(bvRes.data || []);
      } catch (err) {
        message.error('Failed to load Content AI generators');
      }
    })();
  }, []);

  const generator = generators.find((g) => g.key === selectedGenerator);

  const handleSelectGenerator = (key) => {
    setSelectedGenerator(key);
    const gen = generators.find((g) => g.key === key);
    setTargetType(gen?.targetTypes?.[0] || null);
    setFieldValues({});
    setResult(null);
  };

  const handleGenerate = async () => {
    if (!generator) return;

    // Parse the two fields whose backend contract is an array (images,
    // candidateLinks) — sent as JSON text in this simple form.
    const inputs = { ...fieldValues };
    ['images', 'candidateLinks'].forEach((key) => {
      if (inputs[key]) {
        try { inputs[key] = JSON.parse(inputs[key]); } catch (e) { /* leave as string, backend will report the missing-field error */ }
      }
    });

    setLoading(true);
    try {
      const res = await contentAiApi.generateContent({
        generatorType: selectedGenerator,
        targetType,
        inputs,
        brandVoiceId: brandVoiceId || undefined,
        projectId: activeProjectId || undefined
      });
      setResult(res.data);
      message.success('Content generated successfully');
    } catch (err) {
      message.error(err?.response?.data?.error || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!result?.contentPiece?._id) return;
    try {
      await contentAiApi.submitForReview(result.contentPiece._id);
      message.success('Submitted for review');
      const refreshed = await contentAiApi.getContentPiece(result.contentPiece._id);
      setResult({ contentPiece: refreshed.data, version: refreshed.data.currentVersion });
    } catch (err) {
      message.error(err?.response?.data?.error || 'Failed to submit for review');
    }
  };

  return (
    <Row gutter={24}>
      <Col span={10}>
        <Card size="small" title={<Space><Sparkles size={16} /> Generate Content</Space>} style={{ borderRadius: 12, border: '1px solid var(--border-color)' }}>
          <Form layout="vertical">
            <Form.Item label="Generator">
              <Select
                placeholder="Choose a generator"
                value={selectedGenerator}
                onChange={handleSelectGenerator}
                options={generators.map((g) => ({ value: g.key, label: g.displayName }))}
              />
            </Form.Item>

            {generator && (
              <Form.Item label="Target Type">
                <Select
                  value={targetType}
                  onChange={setTargetType}
                  options={generator.targetTypes.map((t) => ({ value: t, label: TARGET_TYPE_LABELS[t] || t }))}
                />
              </Form.Item>
            )}

            <Form.Item label="Brand Voice">
              <Select
                allowClear
                placeholder="Workspace default"
                value={brandVoiceId}
                onChange={setBrandVoiceId}
                options={brandVoices.map((bv) => ({ value: bv._id, label: `${bv.name}${bv.isDefault ? ' (default)' : ''}` }))}
              />
            </Form.Item>

            {generator?.requiredInputFields?.map((field) => (
              <Form.Item key={field} label={FIELD_LABELS[field] || field} required>
                <TextArea
                  rows={field === 'sourceContent' || field === 'existingContent' ? 4 : 2}
                  value={fieldValues[field] || ''}
                  onChange={(e) => setFieldValues((prev) => ({ ...prev, [field]: e.target.value }))}
                />
              </Form.Item>
            ))}

            <Button type="primary" icon={<Sparkles size={14} />} disabled={!generator} loading={loading} onClick={handleGenerate} block>
              Generate
            </Button>
          </Form>
        </Card>
      </Col>

      <Col span={14}>
        {loading && <Spin />}
        {!loading && !result && (
          <Card size="small" style={{ borderRadius: 12, border: '1px solid var(--border-color)' }}>
            <Text type="secondary">Pick a generator on the left and generate — the output and its quality score will show here.</Text>
          </Card>
        )}
        {!loading && result && (
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <Card
              size="small"
              style={{ borderRadius: 12, border: '1px solid var(--border-color)' }}
              title={
                <Space>
                  <Text strong>Generated Output</Text>
                  <WorkflowStatusBadge status={result.contentPiece.status} />
                  <Tag>v{result.version?.versionNumber}</Tag>
                </Space>
              }
              extra={result.contentPiece.status === 'Draft' && (
                <Button size="small" onClick={handleSubmitForReview}>Submit for Review</Button>
              )}
            >
              <Paragraph copyable={{ text: JSON.stringify(result.version?.payload, null, 2) }}>
                <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 360, overflow: 'auto', margin: 0 }}>
                  {JSON.stringify(result.version?.payload, null, 2)}
                </pre>
              </Paragraph>
            </Card>
            <QualityScoreCard score={result.version?.qualityScore} />
          </Space>
        )}
      </Col>
    </Row>
  );
};

export default GeneratePanel;
