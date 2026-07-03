import React, { useEffect, useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Typography,
  Space,
  Row,
  Col,
  Spin,
  Select,
  Tag,
  AutoComplete,
} from "antd";
import { ArrowLeftOutlined, SaveOutlined, ApiOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  useGetTwilioIntegrationQuery,
  useTestTwilioConnectionMutation,
  useSaveTwilioIntegrationMutation,
} from "../../api/integrationApi";

const { Title, Text } = Typography;
const { Option } = Select;

const SmsConfigPage = ({ integrationId, onBack }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [testConnection, { isLoading: isTesting }] = useTestTwilioConnectionMutation();
  const [saveIntegration, { isLoading: isSaving }] = useSaveTwilioIntegrationMutation();
  const { data: twilioData, isLoading: isFetching, refetch } = useGetTwilioIntegrationQuery();

  const [availableNumbers, setAvailableNumbers] = useState([]);
  const [testSuccess, setTestSuccess] = useState(false);

  useEffect(() => {
    if (twilioData?.success && twilioData.isConnected) {
      form.setFieldsValue({
        accountSid: twilioData.accountSid,
        phoneNumber: twilioData.phoneNumber,
        authToken: twilioData.authToken || "••••••••••••••••", // Use the masked token from backend
      });
      setAvailableNumbers([twilioData.phoneNumber]);
      setTestSuccess(true);
    }
  }, [twilioData, form]);

  const handleTestConnection = async () => {
    try {
      const values = await form.validateFields(["accountSid", "authToken"]);

      const res = await testConnection(values).unwrap();
      if (res.success) {
        message.success("Connection successful! Please select a phone number.");
        setAvailableNumbers(res.numbers);
        setTestSuccess(true);
        form.setFieldsValue({ phoneNumber: res.numbers[0] });
      }
    } catch (err) {
      message.error(err?.data?.message || "Failed to connect to Twilio.");
      setTestSuccess(false);
      setAvailableNumbers([]);
    }
  };

  const handleSave = async (values) => {
    try {
      await saveIntegration(values).unwrap();
      message.success("Twilio integration saved successfully.");
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

  const isConnected = twilioData?.success && twilioData.isConnected;

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
            <Title level={4} style={{ margin: 0 }}>Twilio SMS Integration</Title>
            {isConnected ? (
              <Tag color="success">Connected</Tag>
            ) : (
              <Tag color="default">Not Connected</Tag>
            )}
          </div>
        }
        bordered={false}
        className="shadow-md"
        style={{ borderRadius: 12 }}
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          Connect your Twilio account to send automated SMS notifications.
        </Text>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="accountSid"
                label="Account SID"
                rules={[{ required: true, message: "Please enter your Account SID" }]}
              >
                <Input placeholder="Enter Twilio Account SID" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="authToken"
                label="Auth Token"
                rules={[{ required: true, message: "Please enter your Auth Token" }]}
              >
                <Input.Password placeholder="Enter Twilio Auth Token" />
              </Form.Item>
            </Col>
          </Row>

          <Button
            type="dashed"
            icon={<ApiOutlined />}
            onClick={handleTestConnection}
            loading={isTesting}
            style={{ marginBottom: 24 }}
            block
          >
            Test Connection
          </Button>

          <Form.Item
            name="phoneNumber"
            label="Sender Phone Number / Messaging Service SID"
            rules={[{ required: true, message: "Please enter a phone number or sender ID" }]}
            tooltip="If the test connection did not return any numbers, you can manually type your Twilio phone number, Messaging Service SID, or Alphanumeric Sender ID here."
          >
            <AutoComplete
              options={availableNumbers.map((num) => ({ value: num }))}
              placeholder="Enter or select a Twilio number"
            />
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={isSaving}
              disabled={!testSuccess && !twilioData?.isConnected}
            >
              Save Integration
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default SmsConfigPage;
