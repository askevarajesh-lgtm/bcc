import React, { useState } from 'react';
import { Card, Button, Typography, Steps, Form, Input, Upload, message, List, Tag } from 'antd';
import { UploadCloud, CheckCircle, Code, FileCode } from 'lucide-react';
import { getTemplates, saveTemplate } from '../utils/storage';
import { processZipFile } from '../utils/zipExtractor';
import { analyzePageElements } from '../utils/analyzer';
import EcommerceGrapesJS from './EcommerceGrapesJS';
import { useEcommerce } from '../contexts/EcommerceContext';

const { Title, Text } = Typography;

const EcommerceStoreBuilder = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [templateId, setTemplateId] = useState('');
  const [pages, setPages] = useState({});
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [assets, setAssets] = useState({});

  const { workspaceId, websiteId } = useEcommerce();

  const handleFileUpload = async (file) => {
    try {
      const { pages: extractedPages, assets: extractedAssets } = await processZipFile(file);
      setAssets(extractedAssets);

      const analyzedPages = {};
      Object.keys(extractedPages).forEach(pageId => {
        analyzedPages[pageId] = {
          ...extractedPages[pageId],
          html: extractedPages[pageId].html,
          css: extractedPages[pageId].css,
          mapping: analyzePageElements(extractedPages[pageId].html)
        };
      });

      setPages(analyzedPages);

      const newTemplateId = `tpl_${Date.now()}`;
      setTemplateId(newTemplateId);

      await saveTemplate(workspaceId, websiteId, newTemplateId, {
        id: newTemplateId,
        name: file.name,
        websiteId,
        pages: analyzedPages,
        assets: extractedAssets,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      message.success('ZIP imported successfully!');
      setCurrentStep(1);
    } catch (err) {
      console.error(err);
      message.error('Failed to parse ZIP file.');
    }
    return false;
  };

  const selectPage = (pageId) => {
    setSelectedPageId(pageId);

    // Auto analyze the selected page's HTML
    const pageHtml = pages[pageId].html;
    const detectedMappings = analyzePageElements(pageHtml);

    // Merge detected mappings with any existing mappings
    const updatedPages = { ...pages };
    updatedPages[pageId].mapping = { ...detectedMappings, ...updatedPages[pageId].mapping };
    setPages(updatedPages);

    setCurrentStep(2);
  };

  const handleMappingConfirm = (values) => {
    const updatedPages = { ...pages };
    updatedPages[selectedPageId].mapping = values;
    setPages(updatedPages);

    message.success('Mappings confirmed for this page!');
    setCurrentStep(3);
  };

  const renderUpload = () => (
    <Card style={{ textAlign: 'center', padding: '40px 20px', maxWidth: 600, margin: '0 auto', marginTop: 40 }}>
      <UploadCloud size={48} color="var(--accent-primary)" style={{ marginBottom: 16 }} />
      <Title level={4}>Upload Template ZIP</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Upload a complete e-commerce HTML template ZIP file containing index.html, cart.html, css, js, etc.
      </Text>
      <Upload beforeUpload={handleFileUpload} accept=".zip" showUploadList={false}>
        <Button type="primary" size="large">Select ZIP File</Button>
      </Upload>
    </Card>
  );

  const renderPageList = () => (
    <Card style={{ maxWidth: 800, margin: '0 auto', marginTop: 40 }}>
      <Title level={4} style={{ marginBottom: 24 }}>Detected Pages</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Select a page to configure its e-commerce mappings and edit its layout.
      </Text>
      <List
        dataSource={Object.values(pages)}
        renderItem={page => (
          <List.Item
            actions={[<Button type="primary" onClick={() => selectPage(page.id)}>Edit & Map</Button>]}
          >
            <List.Item.Meta
              avatar={<FileCode size={24} color="var(--accent-secondary)" />}
              title={page.name}
              description={page.id}
            />
            <Tag color="blue">{page.role}</Tag>
          </List.Item>
        )}
      />
    </Card>
  );

  const renderMapping = () => {
    const page = pages[selectedPageId];
    if (!page) return null;

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Title level={4} style={{ margin: 0 }}>Map Elements: {page.name}</Title>
          <Button onClick={() => setCurrentStep(1)}>Back to Pages</Button>
        </div>
        <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          We detected the following elements in <b>{page.id}</b>. Adjust the CSS selectors if incorrect.
        </Text>
        <Form
          layout="horizontal"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          initialValues={page.mapping}
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

  if (currentStep === 3) {
    const page = pages[selectedPageId];
    return (
      <EcommerceGrapesJS
        templateId={templateId}
        pageId={selectedPageId}
        initialHtml={page.html}
        initialCss={page.css}
        assets={assets}
        initialName={pages[selectedPageId]?.name || ''}
        onBack={() => setCurrentStep(1)}
        onSave={async (html, css, templateName) => {
          const updatedPages = { ...pages };
          updatedPages[selectedPageId].html = html;
          updatedPages[selectedPageId].css = css;
          setPages(updatedPages);

          const templates = await getTemplates(workspaceId, websiteId);
          if (templates[templateId]) {
            templates[templateId].pages = updatedPages;
            if (templateName) templates[templateId].name = templateName;
            await saveTemplate(workspaceId, websiteId, templateId, templates[templateId]);
          }
        }}
      />
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Steps
        current={currentStep}
        items={[
          { title: 'Upload ZIP', icon: <UploadCloud size={16} /> },
          { title: 'Pages', icon: <FileCode size={16} /> },
          { title: 'Map Elements', icon: <Code size={16} /> },
          { title: 'Visual Builder', icon: <CheckCircle size={16} /> },
        ]}
        style={{ maxWidth: 800, margin: '0 auto', marginBottom: 40 }}
      />

      {currentStep === 0 && renderUpload()}
      {currentStep === 1 && renderPageList()}
      {currentStep === 2 && renderMapping()}
    </div>
  );
};

export default EcommerceStoreBuilder;
