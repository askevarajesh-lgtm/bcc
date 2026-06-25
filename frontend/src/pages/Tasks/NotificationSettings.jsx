import React, { useEffect } from "react";
import {
  Card,
  Switch,
  Form,
  Button,
  message,
  InputNumber,
  Space,
  Spin,
} from "antd";
import { BellOutlined, MailOutlined, MessageOutlined } from "@ant-design/icons";
import {
  useGetNotificationSettingsQuery,
  useUpdateNotificationSettingsMutation,
} from "../../api/taskApi";
import useCompanyIntegrations from "../../hooks/useCompanyIntegrations";

const INTEGRATION_DISABLED_MESSAGE =
  "Please contact your company admin to enable this feature.";

const NotificationSettings = () => {
  const [form] = Form.useForm();
  const { data, isLoading } = useGetNotificationSettingsQuery();
  const [updateSettings, { isLoading: isSaving }] =
    useUpdateNotificationSettingsMutation();
  const companyIntegrations = useCompanyIntegrations();
  const isEmailEnabled = Boolean(companyIntegrations.email);
  const isWhatsAppEnabled = Boolean(companyIntegrations.whatsapp);

  useEffect(() => {
    if (data?.data?.settings) {
      const settings = data.data.settings;
      form.setFieldsValue({
        taskAssignedInApp: settings.taskAssigned?.inApp ?? true,
        taskAssignedEmail: settings.taskAssigned?.email ?? false,
        taskAssignedWhatsapp: settings.taskAssigned?.whatsapp ?? false,
        taskStatusChangedInApp: settings.taskStatusChanged?.inApp ?? true,
        taskStatusChangedEmail: settings.taskStatusChanged?.email ?? false,
        taskStatusChangedWhatsapp:
          settings.taskStatusChanged?.whatsapp ?? false,
        taskPriorityChangedInApp: settings.taskPriorityChanged?.inApp ?? true,
        taskPriorityChangedEmail: settings.taskPriorityChanged?.email ?? false,
        taskPriorityChangedWhatsapp:
          settings.taskPriorityChanged?.whatsapp ?? false,
        taskDueDateReminderInApp: settings.taskDueDateReminder?.inApp ?? true,
        taskDueDateReminderEmail: settings.taskDueDateReminder?.email ?? false,
        taskDueDateReminderWhatsapp:
          settings.taskDueDateReminder?.whatsapp ?? false,
        taskDueDateReminderDaysBefore:
          settings.taskDueDateReminder?.daysBefore ?? 1,
        taskCommentAddedInApp: settings.taskCommentAdded?.inApp ?? true,
        taskCommentAddedEmail: settings.taskCommentAdded?.email ?? false,
        taskCommentAddedWhatsapp: settings.taskCommentAdded?.whatsapp ?? false,
        taskMentionedInApp: settings.taskMentioned?.inApp ?? true,
        taskMentionedEmail: settings.taskMentioned?.email ?? true,
        taskMentionedWhatsapp: settings.taskMentioned?.whatsapp ?? false,
        taskAttachmentAddedInApp: settings.taskAttachmentAdded?.inApp ?? true,
        taskAttachmentAddedEmail: settings.taskAttachmentAdded?.email ?? false,
        taskAttachmentAddedWhatsapp:
          settings.taskAttachmentAdded?.whatsapp ?? false,
        taskCompletedInApp: settings.taskCompleted?.inApp ?? true,
        taskCompletedEmail: settings.taskCompleted?.email ?? false,
        taskCompletedWhatsapp: settings.taskCompleted?.whatsapp ?? false,
      });
    }
  }, [data, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const attemptedEmailChannels = [
        values.taskAssignedEmail,
        values.taskStatusChangedEmail,
        values.taskPriorityChangedEmail,
        values.taskDueDateReminderEmail,
        values.taskCommentAddedEmail,
        values.taskMentionedEmail,
        values.taskAttachmentAddedEmail,
        values.taskCompletedEmail,
      ].some(Boolean);
      const attemptedWhatsAppChannels = [
        values.taskAssignedWhatsapp,
        values.taskStatusChangedWhatsapp,
        values.taskPriorityChangedWhatsapp,
        values.taskDueDateReminderWhatsapp,
        values.taskCommentAddedWhatsapp,
        values.taskMentionedWhatsapp,
        values.taskAttachmentAddedWhatsapp,
        values.taskCompletedWhatsapp,
      ].some(Boolean);

      if (!isEmailEnabled && attemptedEmailChannels) {
        message.warning(
          `Email is not enabled for your company. ${INTEGRATION_DISABLED_MESSAGE}`,
        );
      }
      if (!isWhatsAppEnabled && attemptedWhatsAppChannels) {
        message.warning(
          `WhatsApp is not enabled for your company. ${INTEGRATION_DISABLED_MESSAGE}`,
        );
      }

      const settingsData = {
        taskAssigned: {
          inApp: values.taskAssignedInApp ?? true,
          email: isEmailEnabled ? (values.taskAssignedEmail ?? false) : false,
          whatsapp: isWhatsAppEnabled
            ? (values.taskAssignedWhatsapp ?? false)
            : false,
        },
        taskStatusChanged: {
          inApp: values.taskStatusChangedInApp ?? true,
          email: isEmailEnabled
            ? (values.taskStatusChangedEmail ?? false)
            : false,
          whatsapp: isWhatsAppEnabled
            ? (values.taskStatusChangedWhatsapp ?? false)
            : false,
        },
        taskPriorityChanged: {
          inApp: values.taskPriorityChangedInApp ?? true,
          email: isEmailEnabled
            ? (values.taskPriorityChangedEmail ?? false)
            : false,
          whatsapp: isWhatsAppEnabled
            ? (values.taskPriorityChangedWhatsapp ?? false)
            : false,
        },
        taskDueDateReminder: {
          inApp: values.taskDueDateReminderInApp ?? true,
          email: isEmailEnabled
            ? (values.taskDueDateReminderEmail ?? false)
            : false,
          whatsapp: isWhatsAppEnabled
            ? (values.taskDueDateReminderWhatsapp ?? false)
            : false,
          daysBefore: values.taskDueDateReminderDaysBefore ?? 1,
        },
        taskCommentAdded: {
          inApp: values.taskCommentAddedInApp ?? true,
          email: isEmailEnabled
            ? (values.taskCommentAddedEmail ?? false)
            : false,
          whatsapp: isWhatsAppEnabled
            ? (values.taskCommentAddedWhatsapp ?? false)
            : false,
        },
        taskMentioned: {
          inApp: values.taskMentionedInApp ?? true,
          email: isEmailEnabled ? (values.taskMentionedEmail ?? true) : false,
          whatsapp: isWhatsAppEnabled
            ? (values.taskMentionedWhatsapp ?? false)
            : false,
        },
        taskAttachmentAdded: {
          inApp: values.taskAttachmentAddedInApp ?? true,
          email: isEmailEnabled
            ? (values.taskAttachmentAddedEmail ?? false)
            : false,
          whatsapp: isWhatsAppEnabled
            ? (values.taskAttachmentAddedWhatsapp ?? false)
            : false,
        },
        taskCompleted: {
          inApp: values.taskCompletedInApp ?? true,
          email: isEmailEnabled ? (values.taskCompletedEmail ?? false) : false,
          whatsapp: isWhatsAppEnabled
            ? (values.taskCompletedWhatsapp ?? false)
            : false,
        },
      };

      await updateSettings(settingsData).unwrap();
      message.success("Notification settings saved successfully");
    } catch (error) {
      message.error(
        error?.data?.message || "Failed to save notification settings",
      );
    }
  };

  if (isLoading) {
    return (
      <Spin
        size="large"
        style={{ display: "block", textAlign: "center", padding: "50px" }}
      />
    );
  }

  return (
    <div>
      <Card title="Task Notification Preferences" style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical">
          <Form.Item label="Task Assigned">
            <Space>
              <Form.Item
                name="taskAssignedInApp"
                valuePropName="checked"
                noStyle
              >
                <Switch
                  checkedChildren={<BellOutlined />}
                  unCheckedChildren="Off"
                />
              </Form.Item>
              <span>In-app</span>
              <Form.Item
                name="taskAssignedEmail"
                valuePropName="checked"
                noStyle
              >
                <Switch
                  checkedChildren={<MailOutlined />}
                  unCheckedChildren="Off"
                />
              </Form.Item>
              <span>Email</span>
              <Form.Item
                name="taskAssignedWhatsapp"
                valuePropName="checked"
                noStyle
              >
                <Switch
                  checkedChildren={<MessageOutlined />}
                  unCheckedChildren="Off"
                />
              </Form.Item>
              <span>WhatsApp</span>
            </Space>
          </Form.Item>

          <Form.Item label="Task Status Changed">
            <Space>
              <Form.Item
                name="taskStatusChangedInApp"
                valuePropName="checked"
                noStyle
              >
                <Switch
                  checkedChildren={<BellOutlined />}
                  unCheckedChildren="Off"
                />
              </Form.Item>
              <span>In-app</span>
              <Form.Item
                name="taskStatusChangedEmail"
                valuePropName="checked"
                noStyle
              >
                <Switch
                  checkedChildren={<MailOutlined />}
                  unCheckedChildren="Off"
                />
              </Form.Item>
              <span>Email</span>
              <Form.Item
                name="taskStatusChangedWhatsapp"
                valuePropName="checked"
                noStyle
              >
                <Switch
                  checkedChildren={<MessageOutlined />}
                  unCheckedChildren="Off"
                />
              </Form.Item>
              <span>WhatsApp</span>
            </Space>
          </Form.Item>

          <Form.Item label="Task Priority Changed">
            <Space>
              <Form.Item
                name="taskPriorityChangedInApp"
                valuePropName="checked"
                noStyle
              >
                <Switch
                  checkedChildren={<BellOutlined />}
                  unCheckedChildren="Off"
                />
              </Form.Item>
              <span>In-app</span>
              <Form.Item
                name="taskPriorityChangedEmail"
                valuePropName="checked"
                noStyle
              >
                <Switch
                  checkedChildren={<MailOutlined />}
                  unCheckedChildren="Off"
                />
              </Form.Item>
              <span>Email</span>
              <Form.Item
                name="taskPriorityChangedWhatsapp"
                valuePropName="checked"
                noStyle
              >
                <Switch
                  checkedChildren={<MessageOutlined />}
                  unCheckedChildren="Off"
                />
              </Form.Item>
              <span>WhatsApp</span>
            </Space>
          </Form.Item>

          <Form.Item label="Task Completed">
            <Space>
              <Form.Item
                name="taskCompletedInApp"
                valuePropName="checked"
                noStyle
              >
                <Switch
                  checkedChildren={<BellOutlined />}
                  unCheckedChildren="Off"
                />
              </Form.Item>
              <span>In-app</span>
              <Form.Item
                name="taskCompletedEmail"
                valuePropName="checked"
                noStyle
              >
                <Switch
                  checkedChildren={<MailOutlined />}
                  unCheckedChildren="Off"
                />
              </Form.Item>
              <span>Email</span>
              <Form.Item
                name="taskCompletedWhatsapp"
                valuePropName="checked"
                noStyle
              >
                <Switch
                  checkedChildren={<MessageOutlined />}
                  unCheckedChildren="Off"
                />
              </Form.Item>
              <span>WhatsApp</span>
            </Space>
          </Form.Item>

          <Form.Item label="Due Date Reminder">
            <Space direction="vertical">
              <Space>
                <Form.Item
                  name="taskDueDateReminderInApp"
                  valuePropName="checked"
                  noStyle
                >
                  <Switch
                    checkedChildren={<BellOutlined />}
                    unCheckedChildren="Off"
                  />
                </Form.Item>
                <span>In-app</span>
                <Form.Item
                  name="taskDueDateReminderEmail"
                  valuePropName="checked"
                  noStyle
                >
                  <Switch
                    checkedChildren={<MailOutlined />}
                    unCheckedChildren="Off"
                  />
                </Form.Item>
                <span>Email</span>
                <Form.Item
                  name="taskDueDateReminderWhatsapp"
                  valuePropName="checked"
                  noStyle
                >
                  <Switch
                    checkedChildren={<MessageOutlined />}
                    unCheckedChildren="Off"
                  />
                </Form.Item>
                <span>WhatsApp</span>
              </Space>
              <Space>
                <span>Remind me</span>
                <Form.Item name="taskDueDateReminderDaysBefore" noStyle>
                  <InputNumber min={0} max={30} />
                </Form.Item>
                <span>day(s) before due date</span>
              </Space>
            </Space>
          </Form.Item>

          <Form.Item label="Comment Added">
            <Space>
              <Form.Item
                name="taskCommentAddedInApp"
                valuePropName="checked"
                noStyle
              >
                <Switch
                  checkedChildren={<BellOutlined />}
                  unCheckedChildren="Off"
                />
              </Form.Item>
              <span>In-app</span>
              <Form.Item
                name="taskCommentAddedEmail"
                valuePropName="checked"
                noStyle
              >
                <Switch
                  checkedChildren={<MailOutlined />}
                  unCheckedChildren="Off"
                />
              </Form.Item>
              <span>Email</span>
              <Form.Item
                name="taskCommentAddedWhatsapp"
                valuePropName="checked"
                noStyle
              >
                <Switch
                  checkedChildren={<MessageOutlined />}
                  unCheckedChildren="Off"
                />
              </Form.Item>
              <span>WhatsApp</span>
            </Space>
          </Form.Item>

          <Form.Item label="Mentioned in Comment">
            <Space>
              <Form.Item
                name="taskMentionedInApp"
                valuePropName="checked"
                noStyle
              >
                <Switch
                  checkedChildren={<BellOutlined />}
                  unCheckedChildren="Off"
                />
              </Form.Item>
              <span>In-app</span>
              <Form.Item
                name="taskMentionedEmail"
                valuePropName="checked"
                noStyle
              >
                <Switch
                  checkedChildren={<MailOutlined />}
                  unCheckedChildren="Off"
                />
              </Form.Item>
              <span>Email</span>
              <Form.Item
                name="taskMentionedWhatsapp"
                valuePropName="checked"
                noStyle
              >
                <Switch
                  checkedChildren={<MessageOutlined />}
                  unCheckedChildren="Off"
                />
              </Form.Item>
              <span>WhatsApp</span>
            </Space>
          </Form.Item>

          <Form.Item label="Attachment Added">
            <Space>
              <Form.Item
                name="taskAttachmentAddedInApp"
                valuePropName="checked"
                noStyle
              >
                <Switch
                  checkedChildren={<BellOutlined />}
                  unCheckedChildren="Off"
                />
              </Form.Item>
              <span>In-app</span>
              <Form.Item
                name="taskAttachmentAddedEmail"
                valuePropName="checked"
                noStyle
              >
                <Switch
                  checkedChildren={<MailOutlined />}
                  unCheckedChildren="Off"
                />
              </Form.Item>
              <span>Email</span>
              <Form.Item
                name="taskAttachmentAddedWhatsapp"
                valuePropName="checked"
                noStyle
              >
                <Switch
                  checkedChildren={<MessageOutlined />}
                  unCheckedChildren="Off"
                />
              </Form.Item>
              <span>WhatsApp</span>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Button type="primary" onClick={handleSave} loading={isSaving}>
        Save Settings
      </Button>
    </div>
  );
};

export default NotificationSettings;
