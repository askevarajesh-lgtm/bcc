import { useAuth } from "../../contexts/AuthContext";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Modal,
  Form,
  Select,
  Typography,
  message,
  theme as antTheme,
  Button,
} from "antd";
import { notifyLoading, notifySuccess, notifyError } from '../../utils/notify';
import {
  CheckCircleOutlined,
  GlobalOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { useGetCompaniesDropdownQuery } from "../../api/companyApi";
import {
  useCreateCoordinatorTaskMutation,
  useUpdateCoordinatorTaskMutation,
} from "../../api/coordinatorTaskApi";

const { Text } = Typography;

const DEFAULT_CHECKLIST = [
  "Strategic Planner",
  "Client call for concept and content",
  "Content approval meet",
  "Reference for client",
  "Competitor analysis",
  "Task allocation for designer",
  "Design approval call",
  "WhatsApp update to client",
  "Meta ads campaign",
  "Wallet recharge for client",
  "Document creation",
  "Weekly report",
  "Monthly report",
];

const CreateCoordinatorTaskModal = ({
  visible,
  onCancel,
  onSuccess,
  task = null,
  initialDate = null,
  onManualCreate,
  coordinators = [],
}) => {
  const [form] = Form.useForm();
  const [createCoordinatorTask, { isLoading: isCreating }] =
    useCreateCoordinatorTaskMutation();
  const [updateCoordinatorTask, { isLoading: isUpdating }] =
    useUpdateCoordinatorTaskMutation();
  const isLoading = isCreating || isUpdating;
  const { user } = useAuth();
  const { token } = antTheme.useToken();

  const { data: companiesData, isLoading: companiesLoading } =
    useGetCompaniesDropdownQuery({ limit: 2000 });

  const companies = companiesData?.data?.companies || [];

  useEffect(() => {
    if (visible && task) {
      form.setFieldsValue({
        companyId: task.companyId?._id || task.companyId,
        assignedTo: task.assignedTo?._id || task.assignedTo,
      });
    } else if (visible && !task) {
      form.resetFields();
      if (user.role !== "admin" && user.role !== "super_admin") {
        form.setFieldsValue({ assignedTo: user._id });
      }
    }
  }, [visible, task, form, user]);

  const onFinish = async (values) => {
    try {
      if (task) {
        await updateCoordinatorTask({ id: task._id, ...values }).unwrap();
        notifySuccess('save', task._id, "Task updated successfully");
      } else {
        const payload = {
          ...values,
          assignedTo: values.assignedTo || user._id,
          assignedBy: user._id,
          checklist: DEFAULT_CHECKLIST.map((label) => ({
            label,
            completed: false,
          })),
          status: "assigned",
          taskDate: initialDate || new Date(),
        };
        await createCoordinatorTask(payload).unwrap();
        notifySuccess('save', 'create', "Checklist task created successfully");
      }
      form.resetFields();
      onSuccess();
      onCancel();
    } catch (err) {
      notifyError('save', task?._id || 'create', err.data?.message || "Failed to save task");
    }
  };

  const handleManualTask = async () => {
    try {
      const payload = {
        assignedTo: form.getFieldValue("assignedTo") || user._id,
        assignedBy: user._id,
        checklist: [],
        status: "assigned",
        isManual: true,
        taskDate: initialDate || new Date(),
      };
      const result = await createCoordinatorTask(payload).unwrap();
      notifySuccess('save', 'manual', "Manual task created");
      onSuccess();
      if (onManualCreate) {
        onManualCreate(result.data);
      }
      onCancel();
    } catch (err) {
      notifyError('save', 'manual', err.data?.message || "Failed to create manual task");
    }
  };

  return (
    <Modal
      title={null}
      open={visible}
      onOk={() => form.submit()}
      onCancel={onCancel}
      confirmLoading={isLoading}
      destroyOnClose
      width={460}
      okText={task ? "Update Task" : "Create Task"}
      okButtonProps={{
        style: {
          background: token.colorPrimary,
          border: "none",
          borderRadius: 8,
          height: 36,
          fontWeight: 600,
          fontSize: 13,
          paddingInline: 20,
          boxShadow: `0 2px 8px ${token.colorPrimary}40`,
        },
        icon: <CheckCircleOutlined />,
      }}
      cancelButtonProps={{
        style: {
          borderRadius: 8,
          height: 36,
          fontWeight: 500,
          border: `1px solid ${token.colorBorderSecondary}`,
        },
      }}
      styles={{
        content: { borderRadius: 16, overflow: "hidden", padding: 0 },
        header: { display: "none" },
        body: { padding: 0 },
        footer: {
          padding: "12px 24px 20px",
          borderTop: `1px solid ${token.colorBorderSecondary}`,
        },
      }}
    >
      {/* Modal Header */}
      <div
        style={{
          background: token.colorPrimary,
          padding: "24px 24px 20px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle background decoration */}
        <div
          style={{
            position: "absolute",
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.07)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -20,
            right: 60,
            width: 70,
            height: 70,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }}
        />

        <div style={{ position: "relative" }}>
          <Text
            style={{
              color: "rgba(255,255,255,0.65)",
              fontSize: 10.5,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontWeight: 700,
              display: "block",
              marginBottom: 4,
            }}
          >
            {task ? "Edit Checklist" : "New Checklist Task"}
          </Text>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                color: "#ffffff",
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              {task ? "Update Task Details" : "Create Client Checklist"}
            </div>
            {!task && (
              <Button
                size="small"
                loading={isCreating}
                onClick={handleManualTask}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 600,
                  borderRadius: 6,
                  height: 28,
                }}
              >
                Manual Task
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Form Body */}
      <div
        style={{ padding: "24px 24px 8px", background: token.colorBgContainer }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
        >
          <Form.Item
            name="companyId"
            label={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 2,
                }}
              >
                <GlobalOutlined
                  style={{ fontSize: 12, color: token.colorPrimary }}
                />
                <Text
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: token.colorText,
                  }}
                >
                  Select Client
                </Text>
              </div>
            }
            rules={[{ required: true, message: "Please select a client" }]}
          >
            <Select
              placeholder="Search and choose a company…"
              loading={companiesLoading}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={companies.map((c) => ({
                value: c._id,
                label: c.name,
              }))}
              style={{ height: 40 }}
              size="large"
            />
          </Form.Item>

          {(user.role === "admin" || user.role === "super_admin") && (
            <Form.Item
              name="assignedTo"
              label={
                <Text
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: token.colorText,
                  }}
                >
                  Assign To Coordinator
                </Text>
              }
              rules={[{ required: true, message: "Please select a coordinator" }]}
            >
              <Select
                placeholder="Select a coordinator"
                options={coordinators.map((c) => ({
                  value: c._id,
                  label: c.name,
                }))}
                style={{ height: 40 }}
                size="large"
              />
            </Form.Item>
          )}

          {/* Checklist Preview Info */}
          {!task && (
            <div
              style={{
                padding: "14px 16px",
                background: token.colorFillAlter,
                borderRadius: 10,
                border: `1px solid ${token.colorBorderSecondary}`,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: `${token.colorPrimary}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <UnorderedListOutlined
                    style={{ fontSize: 14, color: token.colorPrimary }}
                  />
                </div>
                <div>
                  <Text
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: token.colorText,
                      display: "block",
                      marginBottom: 2,
                    }}
                  >
                    13-Point Standard Checklist
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: token.colorTextSecondary,
                      lineHeight: "1.5",
                    }}
                  >
                    A default checklist with 13 standard activities will be
                    automatically created for the selected client.
                  </Text>
                </div>
              </div>
            </div>
          )}
        </Form>
      </div>
    </Modal>
  );
};

export default CreateCoordinatorTaskModal;
