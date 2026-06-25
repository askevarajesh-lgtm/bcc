import React, { useState } from "react";
import {
  Modal,
  Form,
  Select,
  Input,
  Button,
  message,
  Typography,
  DatePicker,
} from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useReopenTaskMutation } from "../../api/taskApi";

const { TextArea } = Input;
const { Text } = Typography;

const CORRECTION_CATEGORIES = [
  { value: "Internal Correction", label: "Internal Correction" },
  { value: "Client Correction", label: "Client Correction" },
  { value: "Hosting", label: "Hosting" },
  { value: "SEO Site Content Update", label: "SEO Site Content Update" },
];

/**
 * TaskReopenModal — Used to reopen a completed Website Designing task
 * by creating a new correction task in "To Do" status.
 */
const TaskReopenModal = ({ task, visible, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [reopenTask, { isLoading }] = useReopenTaskMutation();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await reopenTask({
        id: task._id,
        reopenCategory: values.reopenCategory,
        correctionDetails: values.correctionDetails,
        dueDate: values.dueDate?.toISOString(),
      }).unwrap();
      message.success(`Correction task created: "Correction: ${task.title}"`);
      form.resetFields();
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      if (err?.data?.message) {
        message.error(err.data.message);
      }
      // Validation errors are shown inline — don't show another message
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      open={visible}
      onCancel={handleCancel}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ReloadOutlined style={{ color: "#f59e0b" }} />
          <span>Reopen Task as Correction</span>
        </div>
      }
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<ReloadOutlined />}
          loading={isLoading}
          onClick={handleSubmit}
          style={{ background: "#f59e0b", borderColor: "#f59e0b" }}
        >
          Create Correction Task
        </Button>,
      ]}
      destroyOnClose
      width={520}
    >
      {task && (
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">Original Task: </Text>
          <Text strong>{task.title}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            A new task will be created with the prefix{" "}
            <Text code>Correction:</Text> and moved to the To Do stage.
          </Text>
        </div>
      )}

      <Form form={form} layout="vertical" requiredMark>
        <Form.Item
          name="reopenCategory"
          label="Correction Category"
          rules={[{ required: true, message: "Please select a category" }]}
        >
          <Select
            placeholder="Select correction category"
            options={CORRECTION_CATEGORIES}
          />
        </Form.Item>

        <Form.Item
          name="dueDate"
          label="Due Date"
          rules={[{ required: true, message: "Please select a due date" }]}
        >
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          name="correctionDetails"
          label="Correction Details"
          rules={[
            {
              required: true,
              message: "Please describe the correction required",
            },
            { min: 5, message: "Please provide at least 5 characters" },
          ]}
        >
          <TextArea
            rows={4}
            placeholder="Describe what needs to be corrected or fixed..."
            showCount
            maxLength={1000}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TaskReopenModal;
