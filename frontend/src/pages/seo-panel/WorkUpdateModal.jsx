import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Upload,
  Button,
  message,
  Image,
  Space,
  Select,
  InputNumber,
} from "antd";
import { UploadOutlined, FileOutlined } from "@ant-design/icons";
import { useAddWorkUpdateMutation, useGetSEOByIdQuery } from "../../api/seoApi";

const { TextArea } = Input;
const { Option } = Select;

const WorkUpdateModal = ({ open, onCancel, seoId, onSuccess }) => {
  const [form] = Form.useForm();
  const [proofFiles, setProofFiles] = useState([]);
  const [addWorkUpdate, { isLoading }] = useAddWorkUpdateMutation();
  const { data: seoData } = useGetSEOByIdQuery(seoId, { skip: !seoId });
  const seo = seoData?.data?.seo;

  // Watch workType field to conditionally show offPageBacklinkCount
  const selectedWorkType = Form.useWatch("workType", form);

  // Get available work types based on enabled services
  const availableWorkTypes = [];
  if (seo?.contentWork)
    availableWorkTypes.push({ value: "contentWork", label: "Content Work" });
  if (seo?.onpageSeo)
    availableWorkTypes.push({ value: "onpageSeo", label: "On-page SEO" });
  if (seo?.technicalSeo)
    availableWorkTypes.push({ value: "technicalSeo", label: "Technical SEO" });
  if (seo?.localSeo)
    availableWorkTypes.push({ value: "localSeo", label: "Local SEO" });
  if (seo?.keywordResearch)
    availableWorkTypes.push({
      value: "keywordResearch",
      label: "Keyword Research",
    });
  if (seo?.offPageSeo)
    availableWorkTypes.push({ value: "offPageSeo", label: "Off-page SEO" });

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setProofFiles([]);
    }
  }, [open, form]);

  const handleProofFileChange = (info) => {
    const fileList = info.fileList.map((file) => {
      if (file.originFileObj) {
        return file.originFileObj;
      }
      return file;
    });

    setProofFiles(fileList.filter((file) => file instanceof File));
  };

  const beforeUpload = () => {
    return false; // Prevent auto upload
  };

  const handleSubmit = async (values) => {
    try {
      if (!values.workType) {
        message.error("Please select a work type");
        return;
      }

      const payload = {
        id: seoId,
        workType: values.workType,
        completedWork: values.completedWork,
        screenshots: proofFiles,
      };

      // Only include offPageBacklinkCount if it's provided and workType is offPageSeo
      if (
        values.offPageBacklinkCount !== undefined &&
        values.offPageBacklinkCount !== null &&
        values.workType === "offPageSeo"
      ) {
        payload.offPageBacklinkCount = values.offPageBacklinkCount;
      }

      await addWorkUpdate(payload).unwrap();

      message.success("Work update added successfully!");
      form.resetFields();
      setProofFiles([]);
      onSuccess?.();
      onCancel();
    } catch (error) {
      message.error(error?.data?.message || "Failed to add work update");
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setProofFiles([]);
    onCancel();
  };

  const getFileIcon = (file) => {
    if (file.type && file.type.startsWith("image/")) {
      return null; // Image preview will be shown
    }
    return <FileOutlined />;
  };

  const isImageFile = (file) => {
    return file.type && file.type.startsWith("image/");
  };

  return (
    <Modal
      title="Add Work Update"
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={700}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="workType"
          label="Select Work"
          rules={[{ required: true, message: "Please select a work type" }]}
        >
          <Select
            placeholder="Select the work/service you completed"
            showSearch
            optionFilterProp="children"
            onChange={(value) => {
              // Clear offPageBacklinkCount if work type changes to non-offPageSeo
              if (value !== "offPageSeo") {
                form.setFieldsValue({ offPageBacklinkCount: undefined });
              }
            }}
          >
            {availableWorkTypes.map((work) => (
              <Option key={work.value} value={work.value}>
                {work.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="completedWork"
          label="Completed Work Description"
          rules={[
            { required: true, message: "Please describe the completed work" },
          ]}
        >
          <TextArea
            rows={6}
            placeholder="Describe the work you have completed..."
          />
        </Form.Item>

        {selectedWorkType === "offPageSeo" && (
          <Form.Item
            name="offPageBacklinkCount"
            label="Off-page Backlink Count"
            tooltip="Optional: Enter the number of backlinks created for this off-page SEO work update"
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              placeholder="Enter number of backlinks (optional)"
            />
          </Form.Item>
        )}

        <Form.Item
          label="Upload Proof"
          tooltip="Upload proof files (screenshots, images, or any file type) of your completed work"
        >
          <Upload
            name="screenshots"
            listType="picture-card"
            multiple
            beforeUpload={beforeUpload}
            onChange={handleProofFileChange}
            accept="*/*"
            fileList={proofFiles.map((file, index) => {
              const isImage = isImageFile(file);
              return {
                uid: index.toString(),
                name: file.name || `proof-${index}`,
                status: "done",
                url:
                  isImage && file instanceof File
                    ? URL.createObjectURL(file)
                    : undefined,
                originFileObj: file instanceof File ? file : undefined,
                icon: !isImage ? getFileIcon(file) : undefined,
              };
            })}
          >
            {proofFiles.length < 10 && (
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            )}
          </Upload>
          <div style={{ marginTop: 8, color: "#999", fontSize: "12px" }}>
            You can upload up to 10 proof files (images, PDFs, documents, etc.)
          </div>
        </Form.Item>

        <Form.Item style={{ textAlign: "end" }}>
          <Space>
            <Button type="primary" htmlType="submit" loading={isLoading}>
              Add Work Update
            </Button>
            <Button onClick={handleCancel}>Cancel</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default WorkUpdateModal;
