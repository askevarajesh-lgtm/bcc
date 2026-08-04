import React, { useState } from 'react';
import { Modal, Steps, Form, Input, Select, Button, message, InputNumber, Row, Col, Typography, Divider, Space } from 'antd';
import { Target, Users, Image as ImageIcon } from 'lucide-react';

const { Step } = Steps;
const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const CampaignBuilderWizard = ({ open, onCancel, onSuccess, adAccounts }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    try {
      // Validate the fields of the current step
      const stepFields = getFieldsForStep(currentStep);
      await form.validateFields(stepFields);
      setCurrentStep(currentStep + 1);
    } catch (error) {
      // Form validation failed
    }
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      // We'll pass all collected values back to the parent component
      await onSuccess(values);
      
      form.resetFields();
      setCurrentStep(0);
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    form.resetFields();
    setCurrentStep(0);
    onCancel();
  };

  const getFieldsForStep = (stepIndex) => {
    switch (stepIndex) {
      case 0:
        return ['adAccountId', 'campaignName', 'objective', 'specialAdCategories', 'dailyBudget', 'status'];
      case 1:
        return ['adSetName', 'pageId', 'optimizationGoal', 'billingEvent', 'targetCountry'];
      case 2:
        return ['adName', 'creativeMessage', 'creativeImageUrl', 'creativeLink'];
      default:
        return [];
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div style={{ marginTop: 24 }}>
            <Title level={5} style={{ marginBottom: 16 }}>Campaign Setup</Title>
            <Form.Item label="Ad Account" name="adAccountId" rules={[{ required: true, message: 'Select an ad account' }]}>
              <Select placeholder="Select Ad Account" options={adAccounts.map(a => ({ value: a.id, label: `${a.name} (${a.id})` }))} />
            </Form.Item>
            <Form.Item label="Campaign Name" name="campaignName" rules={[{ required: true, message: 'Please enter a campaign name' }]}>
              <Input placeholder="e.g., Summer Sale 2026 - Lead Gen" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Objective" name="objective" rules={[{ required: true, message: 'Select objective' }]}>
                  <Select placeholder="Campaign Objective">
                    <Option value="OUTCOME_LEADS">Leads</Option>
                    <Option value="OUTCOME_TRAFFIC">Traffic</Option>
                    <Option value="OUTCOME_ENGAGEMENT">Engagement</Option>
                    <Option value="OUTCOME_SALES">Sales</Option>
                    <Option value="OUTCOME_AWARENESS">Awareness</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Special Ad Category" name="specialAdCategories" initialValue={['NONE']}>
                  <Select mode="multiple" placeholder="Select category">
                    <Option value="NONE">None</Option>
                    <Option value="HOUSING">Housing</Option>
                    <Option value="EMPLOYMENT">Employment</Option>
                    <Option value="CREDIT">Credit</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Daily Budget (₹)" name="dailyBudget" rules={[{ required: true, message: 'Enter daily budget' }]}>
                  <InputNumber style={{ width: '100%' }} min={100} placeholder="e.g., 500" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Initial Status" name="status" initialValue="PAUSED">
                  <Select>
                    <Option value="PAUSED">Paused</Option>
                    <Option value="ACTIVE">Active</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </div>
        );
      case 1:
        return (
          <div style={{ marginTop: 24 }}>
            <Title level={5} style={{ marginBottom: 16 }}>Ad Set & Targeting</Title>
            <Form.Item label="Ad Set Name" name="adSetName" rules={[{ required: true, message: 'Please enter ad set name' }]}>
              <Input placeholder="e.g., Broad Audience - Tier 1 Cities" />
            </Form.Item>
            <Form.Item label="Facebook Page ID" name="pageId" rules={[{ required: true, message: 'Please enter your Facebook Page ID' }]} extra="Required for Meta ad delivery (e.g., 104523035987309)">
              <Input placeholder="Enter your connected Facebook Page ID" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Optimization Goal" name="optimizationGoal" initialValue="REACH" rules={[{ required: true }]}>
                  <Select>
                    <Option value="REACH">Reach</Option>
                    <Option value="IMPRESSIONS">Impressions</Option>
                    <Option value="LINK_CLICKS">Link Clicks</Option>
                    <Option value="LEAD_GENERATION">Lead Generation</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Billing Event" name="billingEvent" initialValue="IMPRESSIONS" rules={[{ required: true }]}>
                  <Select>
                    <Option value="IMPRESSIONS">Impressions</Option>
                    <Option value="LINK_CLICKS">Link Clicks</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Divider>Audience Targeting</Divider>
            <Form.Item label="Target Country Code" name="targetCountry" initialValue="IN" rules={[{ required: true }]}>
              <Select>
                <Option value="IN">India (IN)</Option>
                <Option value="US">United States (US)</Option>
                <Option value="UK">United Kingdom (UK)</Option>
                <Option value="AE">United Arab Emirates (AE)</Option>
              </Select>
            </Form.Item>
            <Text type="secondary" style={{ fontSize: 12 }}>Note: Advanced age, gender, and detailed targeting will be available in future updates.</Text>
          </div>
        );
      case 2:
        return (
          <div style={{ marginTop: 24 }}>
            <Title level={5} style={{ marginBottom: 16 }}>Ad Creative Setup</Title>
            <Form.Item label="Ad Name" name="adName" rules={[{ required: true, message: 'Please enter ad name' }]}>
              <Input placeholder="e.g., Image Ad - Variation A" />
            </Form.Item>
            <Form.Item label="Primary Text (Ad Copy)" name="creativeMessage" rules={[{ required: true, message: 'Please enter primary text' }]}>
              <TextArea rows={4} placeholder="Write the main message that appears above your image..." />
            </Form.Item>
            <Form.Item label="Image URL" name="creativeImageUrl" rules={[{ required: true, type: 'url', message: 'Enter a valid image URL' }]} extra="Provide a direct URL to the image you want to use (jpg/png).">
              <Input placeholder="https://example.com/my-ad-image.jpg" />
            </Form.Item>
            <Form.Item label="Destination URL" name="creativeLink" rules={[{ required: true, type: 'url', message: 'Enter a valid destination URL' }]} extra="Where should people go when they click the ad?">
              <Input placeholder="https://yourwebsite.com/landing-page" />
            </Form.Item>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      title="Create New Meta Campaign"
      open={open}
      onCancel={handleModalClose}
      width={750}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {currentStep > 0 ? (
            <Button onClick={handlePrev}>Back</Button>
          ) : (
            <div /> // empty div to keep "Next/Launch" button on the right
          )}
          
          <Space>
            <Button onClick={handleModalClose}>Cancel</Button>
            {currentStep < 2 && (
              <Button type="primary" onClick={handleNext}>Next Step</Button>
            )}
            {currentStep === 2 && (
              <Button type="primary" onClick={handleSubmit} loading={loading} style={{ background: '#1877F2', borderColor: '#1877F2' }}>
                Launch Campaign
              </Button>
            )}
          </Space>
        </div>
      }
    >
      <Steps current={currentStep} style={{ marginTop: 16 }}>
        <Step title="Campaign" icon={<Target size={20} />} />
        <Step title="Ad Set" icon={<Users size={20} />} />
        <Step title="Ad Creative" icon={<ImageIcon size={20} />} />
      </Steps>

      <Form form={form} layout="vertical">
        {renderStepContent()}
      </Form>
    </Modal>
  );
};

export default CampaignBuilderWizard;
