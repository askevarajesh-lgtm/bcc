import React, { useState } from 'react';
import { Card, Button, Typography, Steps, Form, Input, Upload, message, Table } from 'antd';
import { UploadCloud, CheckCircle, Code } from 'lucide-react';
import EcommerceGrapesJS from './EcommerceGrapesJS';
import { analyzeTemplate } from '../utils/analyzer';

const { Title, Text } = Typography;

const EcommerceStoreBuilder = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [templateHtml, setTemplateHtml] = useState('');
  const [mappings, setMappings] = useState({});
  const [templateId, setTemplateId] = useState(`tpl_${Date.now()}`);

  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const html = e.target.result;
      setTemplateHtml(html);
      
      // Phase 1 MVP - Auto Analyze HTML
      const detectedMappings = analyzeTemplate(html);
      setMappings(detectedMappings);
      message.success('Template loaded and analyzed!');
      setCurrentStep(1);
    };
    reader.readAsText(file);
    return false; // Prevent default upload behavior
  };

  const handleMappingConfirm = (values) => {
    setMappings(values);
    message.success('Mappings confirmed!');
    setCurrentStep(2);
  };

  const renderUpload = () => (
    <Card style={{ textAlign: 'center', padding: '40px 20px', maxWidth: 600, margin: '0 auto', marginTop: 40 }}>
      <UploadCloud size={48} color="var(--accent-primary)" style={{ marginBottom: 16 }} />
      <Title level={4}>Upload HTML Template</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Upload an existing e-commerce HTML template to begin. We'll automatically detect products, headers, and buttons.
      </Text>
      <Upload beforeUpload={handleFileUpload} accept=".html" showUploadList={false}>
        <Button type="primary" size="large">Select HTML File</Button>
      </Upload>
    </Card>
  );

  const renderMapping = () => {
    const mappingKeys = [
      { key: 'header', label: 'Header Section' },
      { key: 'footer', label: 'Footer Section' },
      { key: 'productGrid', label: 'Product Grid Container' },
      { key: 'productCard', label: 'Product Card' },
      { key: 'productImage', label: 'Product Image' },
      { key: 'productName', label: 'Product Name' },
      { key: 'productPrice', label: 'Product Price' },
      { key: 'addBtn', label: 'Add to Cart Button' },
    ];

    return (
      <Card style={{ maxWidth: 800, margin: '0 auto', marginTop: 40 }}>
        <Title level={4} style={{ marginBottom: 24 }}>Confirm Element Mappings</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          We detected the following elements in your template. You can adjust the CSS selectors if they are incorrect.
        </Text>
        <Form 
          layout="horizontal" 
          labelCol={{ span: 8 }} 
          wrapperCol={{ span: 16 }}
          initialValues={mappings}
          onFinish={handleMappingConfirm}
        >
          {mappingKeys.map(item => (
            <Form.Item key={item.key} name={item.key} label={item.label}>
              <Input placeholder="CSS Selector (e.g., .product-card)" />
            </Form.Item>
          ))}
          <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <Button type="primary" htmlType="submit">Confirm Mappings & Build</Button>
          </Form.Item>
        </Form>
      </Card>
    );
  };

  if (currentStep === 2) {
    return (
      <EcommerceGrapesJS 
        templateId={templateId}
        initialHtml={templateHtml}
        onBack={() => setCurrentStep(1)}
        onSave={(html, css) => {
          // Additional logic could apply bindings to the HTML based on confirmed mappings
        }}
      />
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Steps
        current={currentStep}
        items={[
          { title: 'Upload Template', icon: <UploadCloud size={16} /> },
          { title: 'Map Elements', icon: <Code size={16} /> },
          { title: 'Visual Builder', icon: <CheckCircle size={16} /> },
        ]}
        style={{ maxWidth: 800, margin: '0 auto', marginBottom: 40 }}
      />
      
      {currentStep === 0 && renderUpload()}
      {currentStep === 1 && renderMapping()}
    </div>
  );
};

export default EcommerceStoreBuilder;
