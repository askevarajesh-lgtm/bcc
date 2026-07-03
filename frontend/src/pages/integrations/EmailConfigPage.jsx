import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Form,
  Input,
  message,
  Space,
  Tag,
  Typography,
  Descriptions,
  Alert,
  Row,
  Col,
  Modal,
  Switch,
  Tabs,
  Table,
  Select,
  Spin,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  SendOutlined,
  ArrowLeftOutlined,
  SettingOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import {
  useGetIntegrationsQuery,
  useUpdateIntegrationMutation,
  useCreateIntegrationMutation,
} from "../../api/integrationApi";
import {
  useTestEmailConnectionMutation,
  useSendTestEmailMutation,
  useGetEventConfigsQuery,
  useUpsertEventConfigMutation,
} from "../../api/integrationApi";

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

// Default email templates for each event type
const defaultEmailTemplates = {
  invoice_sent: {
    subject: "Invoice {{invoiceNumber}} - Payment Due",
    body: `<p>Dear {{companyName}},</p>
<p>Your invoice <strong>{{invoiceNumber}}</strong> for <strong>₹{{totalAmount}}</strong> has been generated.</p>
<p><strong>Due Date:</strong> {{dueDate}}</p>
<p>Please make the payment before the due date.</p>
<p>Thank you for your business!</p>
<p>Best regards,<br/>{{companyName}}</p>`,
  },
  invoice_paid: {
    subject: "Payment Received - Invoice {{invoiceNumber}}",
    body: `<p>Dear {{companyName}},</p>
<p>We have received payment of <strong>₹{{amountPaid}}</strong> for invoice <strong>{{invoiceNumber}}</strong>.</p>
<p>Thank you for your prompt payment!</p>
<p>Best regards,<br/>{{companyName}}</p>`,
  },
  payment_reminder: {
    subject: "Payment Reminder - Invoice {{invoiceNumber}}",
    body: `<p>Dear {{companyName}},</p>
<p>This is a friendly reminder that payment of <strong>₹{{amountDue}}</strong> for invoice <strong>{{invoiceNumber}}</strong> is due on <strong>{{dueDate}}</strong>.</p>
<p>Please make the payment at your earliest convenience.</p>
<p>Thank you!</p>
<p>Best regards,<br/>{{companyName}}</p>`,
  },
  welcome_message: {
    subject: "Welcome to {{companyName}}!",
    body: `<p>Hi {{username}},</p>
<p>Welcome to <strong>{{companyName}}</strong>! We're excited to have you on board.</p>
<p>If you have any questions or need assistance, please don't hesitate to reach out.</p>
<p>Best regards,<br/>{{companyName}} Team</p>`,
  },
  forgot_password: {
    subject: "Password Reset Request - {{companyName}}",
    body: `<p>Hi,</p>
<p>You have requested to reset your password for your account: <strong>{{email}}</strong></p>
<p>Your OTP is: <strong>{{otp}}</strong></p>
<p>Please use this OTP to reset your password. This OTP will expire in 10 minutes.</p>
<p>If you didn't request this, please ignore this email.</p>
<p>Best regards,<br/>{{companyName}}</p>`,
  },
  custom_message: {
    subject: "Message from {{companyName}}",
    body: `<p>Hi {{username}},</p>
<p>{{customMessage}}</p>
<p>Best regards,<br/>{{companyName}}</p>`,
  },
  email_sent: {
    subject: "{{subject}}",
    body: `<p>Hi {{username}},</p>
<p>{{customMessage}}</p>
<p>Best regards,<br/>{{companyName}}</p>`,
  },
  notification: {
    subject: "Notification from {{companyName}}",
    body: `<p>Hi {{username}},</p>
<p>{{message}}</p>
<p>{{customMessage}}</p>
<p>Best regards,<br/>{{companyName}}</p>`,
  },
  task_assigned: {
    subject: "New Task Assigned: {{taskTitle}}",
    body: `<p>Hi {{assignedToName}},</p>
<p>You have been assigned a new task:</p>
<p><strong>Task:</strong> {{taskTitle}}<br/>
<strong>Assigned by:</strong> {{assignedByName}}<br/>
<strong>Due Date:</strong> {{dueDate}}<br/>
<strong>Priority:</strong> {{priority}}</p>
<p>Please review and start working on this task.</p>
<p>Best regards,<br/>{{companyName}}</p>`,
  },
  task_completed: {
    subject: "Task Completed: {{taskTitle}}",
    body: `<p>Hi {{watcherName}},</p>
<p>The task <strong>{{taskTitle}}</strong> has been completed by <strong>{{completedByName}}</strong>.</p>
<p>Task ID: {{taskId}}</p>
<p>Best regards,<br/>{{companyName}}</p>`,
  },
  task_due_reminder: {
    subject: "Task Due Reminder: {{taskTitle}}",
    body: `<p>Hi {{assignedToName}},</p>
<p>This is a reminder that your task <strong>{{taskTitle}}</strong> is due in <strong>{{daysRemaining}}</strong> day(s).</p>
<p><strong>Due Date:</strong> {{dueDate}}<br/>
<strong>Task ID:</strong> {{taskId}}</p>
<p>Please ensure the task is completed before the due date.</p>
<p>Best regards,<br/>{{companyName}}</p>`,
  },
  task_status_changed: {
    subject: "Task Status Updated: {{taskTitle}}",
    body: `<p>Hi {{assignedToName}},</p>
<p>The status of task <strong>{{taskTitle}}</strong> has been changed from <strong>{{oldStatus}}</strong> to <strong>{{newStatus}}</strong> by <strong>{{changedByName}}</strong>.</p>
<p>Task ID: {{taskId}}</p>
<p>Best regards,<br/>{{companyName}}</p>`,
  },
  task_priority_changed: {
    subject: "Task Priority Updated: {{taskTitle}}",
    body: `<p>Hi {{assignedToName}},</p>
<p>The priority of task <strong>{{taskTitle}}</strong> has been changed from <strong>{{oldPriority}}</strong> to <strong>{{newPriority}}</strong> by <strong>{{changedByName}}</strong>.</p>
<p>Task ID: {{taskId}}<br/>
<strong>Due Date:</strong> {{dueDate}}</p>
<p>Best regards,<br/>{{companyName}}</p>`,
  },
  task_comment_added: {
    subject: "New Comment on Task: {{taskTitle}}",
    body: `<p>Hi {{assignedToName}},</p>
<p>A new comment has been added to task <strong>{{taskTitle}}</strong> by <strong>{{commentAuthorName}}</strong>.</p>
<p><strong>Comment:</strong> {{commentText}}</p>
<p>Task ID: {{taskId}}</p>
<p>Best regards,<br/>{{companyName}}</p>`,
  },
  task_mentioned: {
    subject: "You were mentioned in a comment: {{taskTitle}}",
    body: `<p>Hi {{mentionedUserName}},</p>
<p>You were mentioned in a comment on task <strong>{{taskTitle}}</strong> by <strong>{{commentAuthorName}}</strong>.</p>
<p><strong>Comment:</strong> {{commentText}}</p>
<p>Task ID: {{taskId}}</p>
<p>Best regards,<br/>{{companyName}}</p>`,
  },
  task_attachment_added: {
    subject: "New Attachment Added to Task: {{taskTitle}}",
    body: `<p>Hi {{assignedToName}},</p>
<p>A new attachment has been added to task <strong>{{taskTitle}}</strong> by <strong>{{attachmentAuthorName}}</strong>.</p>
<p><strong>Attachment:</strong> {{attachmentName}}<br/>
<strong>File Size:</strong> {{attachmentSize}}</p>
<p>Task ID: {{taskId}}</p>
<p>Best regards,<br/>{{companyName}}</p>`,
  },
};

const eventTypes = [
  {
    value: "invoice_sent",
    label: "Invoice Sent",
    variables: [
      "invoiceNumber",
      "companyName",
      "totalAmount",
      "dueDate",
      "customMessage",
    ],
  },
  {
    value: "invoice_paid",
    label: "Invoice Paid",
    variables: ["invoiceNumber", "companyName", "amountPaid", "customMessage"],
  },
  {
    value: "payment_reminder",
    label: "Payment Reminder",
    variables: [
      "invoiceNumber",
      "companyName",
      "amountDue",
      "dueDate",
      "customMessage",
    ],
  },
  {
    value: "welcome_message",
    label: "Welcome Message",
    variables: ["username", "companyName", "customMessage"],
  },
  {
    value: "forgot_password",
    label: "Forgot Password",
    variables: ["email", "otp", "companyName", "customMessage"],
  },
  {
    value: "custom_message",
    label: "Custom Message",
    variables: ["username", "customMessage"],
  },
  {
    value: "email_sent",
    label: "Email Sent",
    variables: ["username", "subject", "customMessage"],
  },
  {
    value: "notification",
    label: "Notification",
    variables: ["username", "message", "customMessage"],
  },
  {
    value: "task_assigned",
    label: "Task Assigned",
    variables: [
      "taskTitle",
      "taskId",
      "assignedToName",
      "assignedByName",
      "dueDate",
      "priority",
      "companyName",
      "customMessage",
    ],
  },
  {
    value: "task_status_changed",
    label: "Task Status Changed",
    variables: [
      "taskTitle",
      "taskId",
      "assignedToName",
      "changedByName",
      "oldStatus",
      "newStatus",
      "companyName",
      "customMessage",
    ],
  },
  {
    value: "task_priority_changed",
    label: "Task Priority Changed",
    variables: [
      "taskTitle",
      "taskId",
      "assignedToName",
      "changedByName",
      "oldPriority",
      "newPriority",
      "dueDate",
      "companyName",
      "customMessage",
    ],
  },
  {
    value: "task_completed",
    label: "Task Completed",
    variables: [
      "taskTitle",
      "taskId",
      "completedByName",
      "watcherName",
      "companyName",
      "customMessage",
    ],
  },
  {
    value: "task_due_reminder",
    label: "Task Due Reminder",
    variables: [
      "taskTitle",
      "taskId",
      "assignedToName",
      "dueDate",
      "daysRemaining",
      "companyName",
      "customMessage",
    ],
  },
  {
    value: "task_comment_added",
    label: "Task Comment Added",
    variables: [
      "taskTitle",
      "taskId",
      "assignedToName",
      "commentAuthorName",
      "commentText",
      "companyName",
      "customMessage",
    ],
  },
  {
    value: "task_mentioned",
    label: "Task Mentioned in Comment",
    variables: [
      "taskTitle",
      "taskId",
      "mentionedUserName",
      "commentAuthorName",
      "commentText",
      "companyName",
      "customMessage",
    ],
  },
  {
    value: "task_attachment_added",
    label: "Task Attachment Added",
    variables: [
      "taskTitle",
      "taskId",
      "assignedToName",
      "attachmentAuthorName",
      "attachmentName",
      "attachmentSize",
      "companyName",
      "customMessage",
    ],
  },
];

const EmailConfigPage = ({ integrationId: propId, onBack }) => {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const id = propId || paramId;
  const isNew = id === "new";
  const { data: integrationsData, refetch: refetchIntegrations } =
    useGetIntegrationsQuery();
  const [updateIntegration] = useUpdateIntegrationMutation();
  const [createIntegration] = useCreateIntegrationMutation();
  const [sendTestEmail] = useSendTestEmailMutation();
  const [testEmailConnection, { isLoading: testConnectionLoading }] =
    useTestEmailConnectionMutation();
  const { data: eventConfigsData, refetch: refetchEventConfigs } =
    useGetEventConfigsQuery();
  const [upsertEventConfig] = useUpsertEventConfigMutation();

  // If id is 'new', we're creating a new integration
  const emailIntegration =
    id === "new"
      ? null
      : integrationsData?.data?.integrations?.find(
          (i) => i.type === "email" && (!id || i._id === id),
        );

  const [configForm] = Form.useForm();
  const [testForm] = Form.useForm();
  const [eventConfigForm] = Form.useForm();
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [eventConfigModalVisible, setEventConfigModalVisible] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [connectionTesting, setConnectionTesting] = useState(false);
  const [isEditing, setIsEditing] = useState(id === "new");
  const [activeTab, setActiveTab] = useState("1");
  const [editingEventType, setEditingEventType] = useState(null);

  const eventConfigs = eventConfigsData?.data?.configs || [];

  // Check connection status
  const isConnected =
    emailIntegration?.isActive &&
    emailIntegration?.config?.clientId &&
    emailIntegration?.config?.clientSecret &&
    emailIntegration?.config?.fromEmail;

  useEffect(() => {
    if (emailIntegration) {
      configForm.setFieldsValue({
        clientId: emailIntegration.config?.clientId || "",
        clientSecret: emailIntegration.config?.clientSecret || "",
        fromEmail: emailIntegration.config?.fromEmail || "",
        fromName: emailIntegration.config?.fromName || "",
        isActive: emailIntegration.isActive || false,
      });
      // If integration isn't fully connected yet, show input fields immediately.
      setIsEditing(!isConnected);
    } else {
      // If integration isn't found (e.g. route id mismatch / tenant scoping),
      // switch to edit mode so Admin can create & configure it.
      setIsEditing(true);
    }
  }, [emailIntegration, configForm, id, isConnected]);

  const handleSaveConfig = async (values) => {
    try {
      const configData = {
        name: "SendPulse Email Integration",
        type: "email",
        isActive: values.isActive,
        config: {
          clientId: values.clientId,
          clientSecret: values.clientSecret,
          fromEmail: values.fromEmail,
          fromName: values.fromName,
        },
      };

      if (emailIntegration) {
        await updateIntegration({
          id: emailIntegration._id,
          ...configData,
        }).unwrap();
        setIsEditing(false); // Switch back to view mode after saving
      } else {
        const newIntegration = await createIntegration(configData).unwrap();
        // Navigate to the new integration's config page
        if (newIntegration?.data?.integration?._id) {
          if (onBack) {
            onBack();
          } else {
            navigate(
              `/settings/integrations/email/${newIntegration.data.integration._id}`,
              { replace: true },
            );
          }
        }
      }

      message.success("Email configuration saved successfully");
      refetchIntegrations();
    } catch (error) {
      message.error(error?.data?.message || "Failed to save configuration");
    }
  };

  const handleTestConnection = async () => {
    setConnectionTesting(true);
    try {
      const result = await testEmailConnection().unwrap();
      if (result?.data?.success || result?.data?.connected) {
        message.success("Email connection successful!");
      } else {
        message.error("Email connection failed");
      }
    } catch (error) {
      message.error(
        error?.data?.message ||
          error?.message ||
          "Email connection failed. Please check your SendPulse configuration.",
      );
    } finally {
      setConnectionTesting(false);
    }
  };

  const handleTestEmail = async (values) => {
    setTestLoading(true);
    try {
      await sendTestEmail({
        to: values.email,
        subject: values.subject || "Test Email",
        body:
          values.body ||
          "This is a test email from the email configuration system.",
      }).unwrap();

      message.success("Test email sent successfully!");
      setTestModalVisible(false);
      testForm.resetFields();
    } catch (error) {
      message.error(
        error?.data?.message || error?.message || "Failed to send test email",
      );
    } finally {
      setTestLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (emailIntegration) {
      // Reset form to original values
      configForm.setFieldsValue({
        clientId: emailIntegration.config?.clientId || "",
        clientSecret: emailIntegration.config?.clientSecret || "",
        fromEmail: emailIntegration.config?.fromEmail || "",
        fromName: emailIntegration.config?.fromName || "",
        isActive: emailIntegration.isActive || false,
      });
      setIsEditing(false);
    }
  };

  const handleAddEventConfig = () => {
    eventConfigForm.resetFields();
    setEditingEventType(null);
    setEventConfigModalVisible(true);
  };

  const handleEditEventConfig = (eventConfig) => {
    const eventTypeInfo = eventTypes.find(
      (et) => et.value === eventConfig.eventType,
    );
    const defaultTemplate = defaultEmailTemplates[eventConfig.eventType];

    eventConfigForm.setFieldsValue({
      eventType: eventConfig.eventType,
      emailTemplate: {
        enabled: eventConfig.emailTemplate?.enabled || false,
        subject:
          eventConfig.emailTemplate?.subject || defaultTemplate?.subject || "",
        body: eventConfig.emailTemplate?.body || defaultTemplate?.body || "",
      },
      autoSend: {
        email: eventConfig.autoSend?.email || false,
      },
      isActive: eventConfig.isActive !== false,
    });
    setEditingEventType(eventConfig.eventType);
    setEventConfigModalVisible(true);
  };

  const handleSaveEventConfig = async (values) => {
    try {
      await upsertEventConfig({
        eventType: values.eventType,
        name:
          eventTypes.find((et) => et.value === values.eventType)?.label ||
          values.eventType,
        isActive: values.isActive !== false,
        emailTemplate: {
          enabled: values.emailTemplate?.enabled || false,
          subject: values.emailTemplate?.subject || "",
          body: values.emailTemplate?.body || "",
        },
        autoSend: {
          email: values.autoSend?.email || false,
        },
      }).unwrap();

      message.success("Event configuration saved successfully");
      setEventConfigModalVisible(false);
      eventConfigForm.resetFields();
      setEditingEventType(null);
      refetchEventConfigs();
    } catch (error) {
      message.error(
        error?.data?.message || "Failed to save event configuration",
      );
    }
  };

  const eventConfigColumns = [
    {
      title: "Event Type",
      dataIndex: "eventType",
      key: "eventType",
      render: (type) => {
        const eventType = eventTypes.find((et) => et.value === type);
        return eventType?.label || type;
      },
    },
    {
      title: "Email Subject",
      key: "subject",
      render: (_, record) => {
        return (
          record.emailTemplate?.subject || (
            <Text type="secondary">Not configured</Text>
          )
        );
      },
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => (
        <Tag color={record.isActive ? "green" : "default"}>
          {record.isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Email Enabled",
      key: "emailEnabled",
      render: (_, record) => (
        <Tag color={record.emailTemplate?.enabled ? "green" : "default"}>
          {record.emailTemplate?.enabled ? "Enabled" : "Disabled"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => handleEditEventConfig(record)}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => {
            if (onBack) onBack();
            else navigate("/settings/integrations");
          }}
        >
          Back
        </Button>
        <Title level={2} style={{ margin: 0 }}>
          <SettingOutlined /> Email Configuration (SendPulse)
        </Title>
      </Space>

      {/* Tabs for Configuration and Event Configuration */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "1",
            label: "Configuration",
            children: (
              <div>
                {/* View Mode */}
                {!isEditing && emailIntegration && (
                  <Card
                    title="SendPulse Email Settings"
                    extra={
                      <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => setIsEditing(true)}
                      >
                        Edit Configuration
                      </Button>
                    }
                    style={{ marginBottom: 24 }}
                  >
                    <Descriptions bordered column={1}>
                      <Descriptions.Item label="Client ID">
                        <Text code>
                          {emailIntegration.config?.clientId || "N/A"}
                        </Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Client Secret">
                        <Text code>••••••••••••••••</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="From Email">
                        {emailIntegration.config?.fromEmail || "N/A"}
                      </Descriptions.Item>
                      <Descriptions.Item label="From Name">
                        {emailIntegration.config?.fromName || "N/A"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Status">
                        <Tag
                          color={
                            emailIntegration.isActive ? "green" : "default"
                          }
                        >
                          {emailIntegration.isActive ? "Active" : "Inactive"}
                        </Tag>
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                )}

                {/* Edit Mode */}
                {isEditing && (
                  <Card
                    title="SendPulse Email Settings"
                    style={{ marginBottom: 24 }}
                  >
                    <Form
                      form={configForm}
                      layout="vertical"
                      onFinish={handleSaveConfig}
                    >
                      <Form.Item
                        label="Client ID"
                        name="clientId"
                        rules={[
                          {
                            required: true,
                            message: "Please enter SendPulse Client ID",
                          },
                        ]}
                      >
                        <Input placeholder="2bade7687922134640c77ba414e228ff" />
                      </Form.Item>

                      <Form.Item
                        label="Client Secret"
                        name="clientSecret"
                        rules={[
                          {
                            required: true,
                            message: "Please enter SendPulse Client Secret",
                          },
                        ]}
                      >
                        <Input.Password placeholder="195fe5c38f13289bd0e840879e9f4a22" />
                      </Form.Item>

                      <Form.Item
                        label="From Email"
                        name="fromEmail"
                        rules={[
                          {
                            required: true,
                            message: "Please enter sender email",
                          },
                          {
                            type: "email",
                            message: "Please enter a valid email",
                          },
                        ]}
                      >
                        <Input placeholder="dev@askeva.io" />
                      </Form.Item>

                      <Form.Item
                        label="From Name"
                        name="fromName"
                        rules={[
                          {
                            required: true,
                            message: "Please enter sender name",
                          },
                        ]}
                      >
                        <Input placeholder="ASKEVA HRMS" />
                      </Form.Item>

                      <Form.Item name="isActive" valuePropName="checked">
                        <Switch
                          checkedChildren="Active"
                          unCheckedChildren="Inactive"
                        />
                      </Form.Item>

                      <Form.Item>
                        <Space>
                          <Button type="primary" htmlType="submit">
                            Save Configuration
                          </Button>
                          {emailIntegration && (
                            <Button onClick={handleCancelEdit}>Cancel</Button>
                          )}
                        </Space>
                      </Form.Item>
                    </Form>
                  </Card>
                )}

                {/* Connection Status */}
                <Card style={{ marginBottom: 24 }}>
                  <Row gutter={16} align="middle">
                    <Col flex="auto">
                      <Space direction="vertical" size="small">
                        <Text strong>Connection Status</Text>
                        <Space>
                          {isConnected ? (
                            <>
                              <CheckCircleOutlined
                                style={{ color: "#52c41a", fontSize: 20 }}
                              />
                              <Text type="success">Connected (SendPulse)</Text>
                            </>
                          ) : (
                            <>
                              <CloseCircleOutlined
                                style={{ color: "#ff4d4f", fontSize: 20 }}
                              />
                              <Text type="danger">Not Connected</Text>
                            </>
                          )}
                        </Space>
                        {isConnected && emailIntegration && (
                          <Text type="secondary">
                            From: {emailIntegration.config?.fromEmail} (
                            {emailIntegration.config?.fromName})
                          </Text>
                        )}
                      </Space>
                    </Col>
                    <Col>
                      <Space>
                        <Button
                          icon={<ReloadOutlined />}
                          onClick={handleTestConnection}
                          loading={connectionTesting || testConnectionLoading}
                          disabled={!isConnected}
                        >
                          Test Connection
                        </Button>
                        <Button
                          icon={<SendOutlined />}
                          onClick={() => setTestModalVisible(true)}
                          disabled={!isConnected}
                        >
                          Send Test Email
                        </Button>
                      </Space>
                    </Col>
                  </Row>
                </Card>

                {!isConnected && (
                  <Alert
                    message="Email Not Connected"
                    description="Please configure and save your SendPulse email settings above, then test the connection."
                    type="warning"
                    showIcon
                    style={{ marginBottom: 24 }}
                  />
                )}
              </div>
            ),
          },
          {
            key: "2",
            label: "Event Configuration",
            children: !isConnected ? (
              <Alert
                message="Not Connected"
                description="Please configure email and test connection in the Configuration tab first."
                type="warning"
                showIcon
              />
            ) : (
              <Card
                title="Email Event Configurations"
                extra={
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddEventConfig}
                  >
                    Add Configuration
                  </Button>
                }
              >
                <Table
                  columns={eventConfigColumns}
                  dataSource={eventConfigs.filter(
                    (c) => c.emailTemplate?.enabled || c.eventType,
                  )}
                  rowKey="eventType"
                  pagination={false}
                  locale={{
                    emptyText:
                      'No event configurations. Click "Add Configuration" to create one.',
                  }}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* Test Email Modal */}
      <Modal
        title="Send Test Email"
        open={testModalVisible}
        onCancel={() => {
          setTestModalVisible(false);
          testForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={testForm} layout="vertical" onFinish={handleTestEmail}>
          <Form.Item
            label="Email Address"
            name="email"
            rules={[
              { required: true, message: "Please enter email address" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input placeholder="test@example.com" />
          </Form.Item>

          <Form.Item
            label="Subject"
            name="subject"
            initialValue="Test Email from ASKEVA HRMS"
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Body"
            name="body"
            initialValue="This is a test email from the email configuration system. If you receive this, your SendPulse email integration is working correctly."
          >
            <TextArea rows={6} />
          </Form.Item>

          <Form.Item style={{ textAlign: "end" }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={testLoading}
                icon={<SendOutlined />}
              >
                Send Test Email
              </Button>
              <Button
                onClick={() => {
                  setTestModalVisible(false);
                  testForm.resetFields();
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Event Configuration Modal */}
      <Modal
        title="Configure Email Event"
        open={eventConfigModalVisible}
        onCancel={() => {
          setEventConfigModalVisible(false);
          eventConfigForm.resetFields();
          setEditingEventType(null);
        }}
        footer={null}
        width={800}
      >
        <Form
          form={eventConfigForm}
          layout="vertical"
          onFinish={handleSaveEventConfig}
        >
          <Form.Item
            label="Event Type"
            name="eventType"
            rules={[{ required: true, message: "Please select an event type" }]}
          >
            <Select
              placeholder="Select an event type"
              disabled={!!editingEventType}
            >
              {eventTypes.map((et) => (
                <Option key={et.value} value={et.value}>
                  {et.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.eventType !== currentValues.eventType
            }
          >
            {({ getFieldValue, setFieldsValue }) => {
              const selectedEventType = getFieldValue("eventType");
              const eventTypeInfo = eventTypes.find(
                (et) => et.value === selectedEventType,
              );
              const defaultTemplate = selectedEventType
                ? defaultEmailTemplates[selectedEventType]
                : null;

              // Auto-populate default template when event type is selected (only if creating new and fields are empty)
              // This runs when event type changes
              if (selectedEventType && !editingEventType && defaultTemplate) {
                const currentSubject = getFieldValue([
                  "emailTemplate",
                  "subject",
                ]);
                const currentBody = getFieldValue(["emailTemplate", "body"]);

                // Only set if fields are empty - use a flag to prevent infinite loops
                if (!currentSubject && !currentBody) {
                  // Set default template (but keep enabled as false initially)
                  const currentEmailTemplate =
                    getFieldValue("emailTemplate") || {};
                  if (
                    !currentEmailTemplate.subject &&
                    !currentEmailTemplate.body
                  ) {
                    setFieldsValue({
                      emailTemplate: {
                        enabled: false, // Start disabled, user will enable it
                        subject: defaultTemplate.subject,
                        body: defaultTemplate.body,
                      },
                    });
                  }
                }
              }

              return selectedEventType ? (
                <>
                  <Form.Item
                    name="isActive"
                    valuePropName="checked"
                    initialValue={true}
                  >
                    <Switch
                      checkedChildren="Active"
                      unCheckedChildren="Inactive"
                    />
                  </Form.Item>

                  <Form.Item
                    name={["emailTemplate", "enabled"]}
                    valuePropName="checked"
                    label="Enable Email Template"
                  >
                    <Switch
                      checkedChildren="Enabled"
                      unCheckedChildren="Disabled"
                      onChange={(checked) => {
                        // When enabling, auto-populate with default template if fields are empty
                        if (checked) {
                          const currentSubject = eventConfigForm.getFieldValue([
                            "emailTemplate",
                            "subject",
                          ]);
                          const currentBody = eventConfigForm.getFieldValue([
                            "emailTemplate",
                            "body",
                          ]);
                          const defaultTemplate =
                            defaultEmailTemplates[selectedEventType];

                          if (defaultTemplate) {
                            // Only set defaults if fields are empty
                            const updates = {};
                            if (!currentSubject && defaultTemplate.subject) {
                              updates.subject = defaultTemplate.subject;
                            }
                            if (!currentBody && defaultTemplate.body) {
                              updates.body = defaultTemplate.body;
                            }

                            if (Object.keys(updates).length > 0) {
                              const currentEmailTemplate =
                                eventConfigForm.getFieldValue(
                                  "emailTemplate",
                                ) || {};
                              eventConfigForm.setFieldsValue({
                                emailTemplate: {
                                  ...currentEmailTemplate,
                                  enabled: true,
                                  ...updates,
                                },
                              });
                            }
                          }
                        }
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) => {
                      const prevEnabled = prevValues.emailTemplate?.enabled;
                      const currEnabled = currentValues.emailTemplate?.enabled;
                      return prevEnabled !== currEnabled;
                    }}
                  >
                    {({ getFieldValue }) =>
                      getFieldValue(["emailTemplate", "enabled"]) ? (
                        <>
                          <Form.Item
                            label="Email Subject"
                            name={["emailTemplate", "subject"]}
                            rules={[
                              {
                                required: true,
                                message: "Please enter email subject",
                              },
                            ]}
                            help={`Available variables: ${eventTypeInfo?.variables?.join(", ") || ""}. Use {{variableName}} format.`}
                          >
                            <Input placeholder="Invoice {{invoiceNumber}} - Payment Due" />
                          </Form.Item>

                          <Form.Item
                            label="Email Body (HTML)"
                            name={["emailTemplate", "body"]}
                            rules={[
                              {
                                required: true,
                                message: "Please enter email body",
                              },
                            ]}
                            help={`Available variables: ${eventTypeInfo?.variables?.join(", ") || ""}. Use {{variableName}} format. HTML is supported.`}
                          >
                            <TextArea
                              rows={12}
                              placeholder={`<p>Hi {{companyName}},</p>
<p>Your invoice {{invoiceNumber}} for ₹{{totalAmount}} is ready.</p>
<p>Due Date: {{dueDate}}</p>
<p>Thanks and Regards</p>`}
                            />
                          </Form.Item>
                        </>
                      ) : (
                        <Alert
                          message="Email template is disabled"
                          description="Enable the switch above to configure email templates for this event"
                          type="info"
                          showIcon
                          style={{ marginBottom: 16 }}
                        />
                      )
                    }
                  </Form.Item>

                  <Form.Item
                    name={["autoSend", "email"]}
                    valuePropName="checked"
                    help="Automatically send email when this event occurs"
                  >
                    <Switch
                      checkedChildren="Auto Send Enabled"
                      unCheckedChildren="Manual Only"
                    />
                  </Form.Item>
                </>
              ) : null;
            }}
          </Form.Item>

          <Form.Item style={{ textAlign: "end" }}>
            <Space>
              <Button type="primary" htmlType="submit">
                Save Configuration
              </Button>
              <Button
                onClick={() => {
                  setEventConfigModalVisible(false);
                  eventConfigForm.resetFields();
                  setEditingEventType(null);
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmailConfigPage;
