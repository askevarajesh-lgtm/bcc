import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Select,
  message,
  Space,
  Row,
  Col,
  Checkbox,
  InputNumber,
  Upload,
  Typography,
  Divider,
} from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  useCreateSEOMutation,
  useUpdateSEOMutation,
  useGetSEOByIdQuery,
} from "../../api/seoApi";
import {
  UploadOutlined,
  DeleteOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

const SEOForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const { user: currentUser } = useAuth();

  const [screenshotFile, setScreenshotFile] = useState(null);
  const [credentialsFile, setCredentialsFile] = useState(null);
  const [googleSheetLinks, setGoogleSheetLinks] = useState([""]);
  const [googleSheetLinksWeeklyReports, setGoogleSheetLinksWeeklyReports] =
    useState([""]);

  const { data: seoData, isLoading: isLoadingSEO } = useGetSEOByIdQuery(id, {
    skip: !isEdit,
  });
  const [createSEO, { isLoading: isCreating }] = useCreateSEOMutation();
  const [updateSEO, { isLoading: isUpdating }] = useUpdateSEOMutation();

  const seo = seoData?.data?.seo;

  useEffect(() => {
    if (seo && isEdit) {
      form.setFieldsValue({
        websiteLink: seo.websiteLink,
        keywords: seo.keywords,
        secondaryKeywords: seo.secondaryKeywords,
        contentWork: seo.contentWork,
        onpageSeo: seo.onpageSeo,
        technicalSeo: seo.technicalSeo,
        localSeo: seo.localSeo,
        keywordResearch: seo.keywordResearch,
        offPageSeo: seo.offPageSeo,
        profileLinkOffPageSeo: seo.profileLinkOffPageSeo,
        offPageSeoCount: seo.offPageSeoCount,
        profileLinkWeeklyReports: seo.profileLinkWeeklyReports,
        weeklyReportsSeoCount: seo.weeklyReportsSeoCount,
      });

      if (seo.googleSheetLinks && seo.googleSheetLinks.length > 0) {
        setGoogleSheetLinks(seo.googleSheetLinks);
      }

      if (
        seo.googleSheetLinksWeeklyReports &&
        seo.googleSheetLinksWeeklyReports.length > 0
      ) {
        setGoogleSheetLinksWeeklyReports(seo.googleSheetLinksWeeklyReports);
      }
    }
  }, [seo, isEdit, form]);

  const handleScreenshotChange = (info) => {
    if (info.file.status === "removed") {
      setScreenshotFile(null);
      // If editing and removing existing file, we need to clear it
      // The backend will handle this if we send null/undefined
      return;
    }
    const file = info.file.originFileObj || info.file;
    if (file && file instanceof File) {
      setScreenshotFile(file);
    } else if (info.file.url && !info.file.originFileObj) {
      // This is the existing file from Cloudinary, don't set it as a new file
      setScreenshotFile(null);
    }
  };

  const handleCredentialsChange = (info) => {
    if (info.file.status === "removed") {
      setCredentialsFile(null);
      // If editing and removing existing file, we need to clear it
      // The backend will handle this if we send null/undefined
      return;
    }
    const file = info.file.originFileObj || info.file;
    if (file && file instanceof File) {
      setCredentialsFile(file);
    } else if (info.file.url && !info.file.originFileObj) {
      // This is the existing file from Cloudinary, don't set it as a new file
      setCredentialsFile(null);
    }
  };

  const beforeUpload = () => {
    return false; // Prevent auto upload
  };

  const addGoogleSheetLink = () => {
    setGoogleSheetLinks([...googleSheetLinks, ""]);
  };

  const removeGoogleSheetLink = (index) => {
    setGoogleSheetLinks(googleSheetLinks.filter((_, i) => i !== index));
  };

  const updateGoogleSheetLink = (index, value) => {
    const updated = [...googleSheetLinks];
    updated[index] = value;
    setGoogleSheetLinks(updated);
  };

  const addGoogleSheetLinkWeeklyReports = () => {
    setGoogleSheetLinksWeeklyReports([...googleSheetLinksWeeklyReports, ""]);
  };

  const removeGoogleSheetLinkWeeklyReports = (index) => {
    setGoogleSheetLinksWeeklyReports(
      googleSheetLinksWeeklyReports.filter((_, i) => i !== index),
    );
  };

  const updateGoogleSheetLinkWeeklyReports = (index, value) => {
    const updated = [...googleSheetLinksWeeklyReports];
    updated[index] = value;
    setGoogleSheetLinksWeeklyReports(updated);
  };

  const onFinish = async (values) => {
    try {
      // Filter out empty Google Sheet links
      const validGoogleSheetLinks = googleSheetLinks.filter(
        (link) => link && link.trim(),
      );

      const validGoogleSheetLinksWeeklyReports =
        googleSheetLinksWeeklyReports.filter((link) => link && link.trim());

      const payload = {
        ...values,
        googleSheetLinks: validGoogleSheetLinks,
        googleSheetLinksWeeklyReports: validGoogleSheetLinksWeeklyReports,
      };

      // Only include files if new ones are selected
      if (screenshotFile) {
        payload.websiteAuditScreenshot = screenshotFile;
      }

      if (credentialsFile) {
        payload.credentialsFile = credentialsFile;
      }

      if (isEdit) {
        await updateSEO({ id, ...payload }).unwrap();
        message.success("SEO entry updated successfully!");
      } else {
        await createSEO(payload).unwrap();
        message.success("SEO entry created successfully!");
      }

      navigate("..");
    } catch (error) {
      message.error(error?.data?.message || "Failed to save SEO entry");
    }
  };

  if (isLoadingSEO) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 24,
          gap: 16,
        }}
      >
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("..")}
        >
          Back
        </Button>
        <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
          {isEdit ? "Edit SEO Entry" : "Create SEO Entry"}
        </h1>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            contentWork: false,
            onpageSeo: false,
            technicalSeo: false,
            localSeo: false,
            keywordResearch: false,
            offPageSeo: false,
            offPageSeoCount: 0,
            weeklyReportsSeoCount: 0,
          }}
        >
          <Form.Item
            name="websiteLink"
            label="Website Link"
            rules={[
              { required: true, message: "Please enter website link" },
              { type: "url", message: "Please enter a valid URL" },
            ]}
          >
            <Input placeholder="https://example.com" />
          </Form.Item>

          <Form.Item
            name="websiteAuditScreenshot"
            label="Website Audit Screenshot"
          >
            <Upload
              name="websiteAuditScreenshot"
              listType="picture-card"
              maxCount={1}
              beforeUpload={beforeUpload}
              onChange={handleScreenshotChange}
              onRemove={() => {
                setScreenshotFile(null);
                return true;
              }}
              accept="image/*"
              fileList={
                screenshotFile
                  ? [
                      {
                        uid: "-1",
                        name: screenshotFile.name || "screenshot.jpg",
                        status: "done",
                        url: URL.createObjectURL(screenshotFile),
                        originFileObj: screenshotFile,
                      },
                    ]
                  : seo?.websiteAuditScreenshot
                    ? [
                        {
                          uid: "-2",
                          name: "Current Screenshot",
                          status: "done",
                          url: seo.websiteAuditScreenshot,
                        },
                      ]
                    : []
              }
            >
              {!screenshotFile && !seo?.websiteAuditScreenshot && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item name="keywords" label="Keywords">
            <TextArea
              rows={3}
              placeholder="Enter target keywords (comma-separated)"
            />
          </Form.Item>

          <Form.Item name="secondaryKeywords" label="Secondary Keywords">
            <TextArea
              rows={3}
              placeholder="Enter secondary/additional keywords (comma-separated)"
            />
          </Form.Item>

          <Divider>SEO Services</Divider>

          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="contentWork" valuePropName="checked">
                <Checkbox>Content Work</Checkbox>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="onpageSeo" valuePropName="checked">
                <Checkbox>On-page SEO</Checkbox>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="technicalSeo" valuePropName="checked">
                <Checkbox>Technical SEO</Checkbox>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="localSeo" valuePropName="checked">
                <Checkbox>Local SEO</Checkbox>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="keywordResearch" valuePropName="checked">
                <Checkbox>Keyword Research</Checkbox>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="offPageSeo" valuePropName="checked">
                <Checkbox>Off-page SEO</Checkbox>
              </Form.Item>
            </Col>
          </Row>

          <Divider>Off-page SEO Details</Divider>

          <Form.Item
            name="profileLinkOffPageSeo"
            label="Profile Link (Off-page SEO)"
          >
            <Input placeholder="Enter profile link for off-page SEO" />
          </Form.Item>

          <Form.Item label="Google Sheet Links">
            {googleSheetLinks.map((link, index) => (
              <Space
                key={index}
                style={{ display: "flex", marginBottom: 8 }}
                align="baseline"
              >
                <Input
                  placeholder="Enter Google Sheet link"
                  value={link}
                  onChange={(e) => updateGoogleSheetLink(index, e.target.value)}
                  style={{ flex: 1 }}
                />
                {googleSheetLinks.length > 1 && (
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeGoogleSheetLink(index)}
                  />
                )}
              </Space>
            ))}
            <Button
              type="dashed"
              onClick={addGoogleSheetLink}
              icon={<PlusOutlined />}
              style={{ width: "100%", marginTop: 8 }}
            >
              Add Google Sheet Link
            </Button>
          </Form.Item>

          <Form.Item
            name="offPageSeoCount"
            label="Off-page SEO Count"
            rules={[
              { type: "number", min: 0, message: "Count must be 0 or greater" },
            ]}
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="Enter off-page SEO count"
            />
          </Form.Item>

          <Divider>Weekly Reports SEO Details</Divider>

          <Form.Item
            name="profileLinkWeeklyReports"
            label="Profile Link (Weekly Reports SEO)"
          >
            <Input placeholder="Enter profile link for weekly reports SEO" />
          </Form.Item>

          <Form.Item label="Google Sheet Links (Weekly Reports)">
            {googleSheetLinksWeeklyReports.map((link, index) => (
              <Space
                key={index}
                style={{ display: "flex", marginBottom: 8 }}
                align="baseline"
              >
                <Input
                  placeholder="Enter Google Sheet link"
                  value={link}
                  onChange={(e) =>
                    updateGoogleSheetLinkWeeklyReports(index, e.target.value)
                  }
                  style={{ flex: 1 }}
                />
                {googleSheetLinksWeeklyReports.length > 1 && (
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeGoogleSheetLinkWeeklyReports(index)}
                  />
                )}
              </Space>
            ))}
            <Button
              type="dashed"
              onClick={addGoogleSheetLinkWeeklyReports}
              icon={<PlusOutlined />}
              style={{ width: "100%", marginTop: 8 }}
            >
              Add Google Sheet Link
            </Button>
          </Form.Item>

          <Form.Item
            name="weeklyReportsSeoCount"
            label="Weekly Reports SEO Count"
            rules={[
              { type: "number", min: 0, message: "Count must be 0 or greater" },
            ]}
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="Enter weekly reports SEO count"
            />
          </Form.Item>

          <Divider>Credentials</Divider>

          <Form.Item
            name="credentialsFile"
            label="Credentials Upload"
            tooltip="Upload client credentials file (hidden by default in list view)"
          >
            <Upload
              name="credentialsFile"
              maxCount={1}
              beforeUpload={beforeUpload}
              onChange={handleCredentialsChange}
              onRemove={() => {
                setCredentialsFile(null);
                return true;
              }}
              accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
              fileList={
                credentialsFile
                  ? [
                      {
                        uid: "-1",
                        name: credentialsFile.name || "credentials",
                        status: "done",
                        originFileObj: credentialsFile,
                      },
                    ]
                  : seo?.credentialsFile
                    ? [
                        {
                          uid: "-2",
                          name:
                            seo.credentialsFileName ||
                            "Current Credentials File",
                          status: "done",
                          url: seo.credentialsFile,
                        },
                      ]
                    : []
              }
            >
              <Button icon={<UploadOutlined />}>Upload Credentials</Button>
            </Upload>
            {seo?.credentialsFile && !credentialsFile && (
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">
                  Current file:{" "}
                  <a
                    href={seo.credentialsFile}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {seo.credentialsFileName || "Credentials File"}
                  </a>
                </Text>
              </div>
            )}
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={isCreating || isUpdating}
                size="large"
              >
                {isEdit ? "Update" : "Create"} SEO Entry
              </Button>
              <Button onClick={() => navigate("..")} size="large">
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default SEOForm;
