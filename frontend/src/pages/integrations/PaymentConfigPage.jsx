import React, { useEffect, useState } from "react";
import { Card, Form, Input, Button, message, Typography, Space, Row, Col, Spin, Tag, Divider } from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  useGetIntegrationsQuery,
  useUpdateIntegrationMutation,
  useCreateIntegrationMutation
} from "../../api/integrationApi";

const { Title, Text } = Typography;

const PaymentConfigPage = ({ integrationId, onBack }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [updateIntegration, { isLoading: isUpdating }] = useUpdateIntegrationMutation();
  const [createIntegration, { isLoading: isCreating }] = useCreateIntegrationMutation();
  const { data, isLoading: isFetching, refetch } = useGetIntegrationsQuery();


  const integration = data?.data?.integrations?.find(i => (integrationId && i._id === integrationId) || i.type === "payment");
  const isNew = !integration;

  useEffect(() => {
    if (integration) {
      form.setFieldsValue({
        razorpayKeyId: integration.config?.razorpayKeyId,
        razorpayKeySecret: integration.config?.razorpayKeySecret,
      });
    }
  }, [integration, form]);

  const handleSave = async (values) => {
    try {
      const payload = {
        name: "Payment Integration",
        type: "payment",
        isActive: true,
        config: {
          razorpayKeyId: values.razorpayKeyId,
          razorpayKeySecret: values.razorpayKeySecret,
        }
      };

      if (isNew) {
        await createIntegration(payload).unwrap();
      } else {
        await updateIntegration({ id: integration._id, ...payload }).unwrap();
      }
      
      message.success("Payment integration saved successfully.");
      refetch();
      if (onBack) onBack();
      else navigate("/settings/integrations");
    } catch (err) {
      message.error(err?.data?.message || "Failed to save integration.");
    }
  };



  if (isFetching) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  const isConfigured = !!integration?.config?.razorpayKeyId;

  return (
    <div style={{ maxWidth: 800, padding: "24px 0" }}>
      <Space style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => {
            if (onBack) onBack();
            else navigate("/settings/integrations");
          }}
        >
          Back to Integrations
        </Button>
      </Space>

      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Title level={4} style={{ margin: 0 }}>Payment Integration</Title>
            {isConfigured ? (
              <Tag color="success">Configured</Tag>
            ) : (
              <Tag color="default">Not Configured</Tag>
            )}
          </div>
        }
        bordered={false}
        className="shadow-md"
        style={{ borderRadius: 12 }}
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          Configure your Razorpay API keys to enable direct payments for your clients.
        </Text>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Row gutter={16}>


            <Col span={12}>
              <Form.Item
                name="razorpayKeyId"
                label="Razorpay Key ID"
              >
                <Input placeholder="rzp_live_..." size="large" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="razorpayKeySecret"
                label="Razorpay Key Secret"
              >
                <Input.Password placeholder="Enter Key Secret" size="large" />
              </Form.Item>
            </Col>


          </Row>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={isUpdating || isCreating}
              size="large"
            >
              Save Payment Config
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default PaymentConfigPage;
