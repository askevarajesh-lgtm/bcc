import {
  Button,
  DatePicker,
  Dropdown,
  Form,
  Input,
  Modal,
  Select,
  Space,
  TimePicker,
  Upload,
  message,
  Row,
  Col,
  Typography,
  Divider,
  Checkbox,
  Radio,
  Alert,
} from "antd";
import {
  HeartOutlined,
  MessageOutlined,
  SendOutlined,
  UserOutlined,
  UploadOutlined,
  FacebookFilled,
  InstagramFilled,
  LinkedinFilled,
  PinterestFilled,
  YoutubeFilled,
  ShopOutlined,
} from "@ant-design/icons";
import { Tabs } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { useMemo } from "react";
import { useEffect } from "react";

const { Text } = Typography;

const PLATFORM_CAPABILITIES = {
  youtube: ["video"],
  instagram: ["image", "video"],
  facebook: ["text", "image", "video"],
  linkedin: ["text", "image", "video"],
  google_business: ["text", "image"],
  pinterest: ["image"],
};

const POST_TYPE_OPTIONS = [
  { label: "Image", value: "image" },
  { label: "Video", value: "video" },
  { label: "Text", value: "text" },
];

const PLATFORM_POST_OPTIONS = {
  youtube: [
    { label: "Video", value: "video_standard" },
    { label: "Shorts", value: "video_short" },
  ],
  facebook: [
    { label: "Feed", value: "feed" },
    { label: "Reel", value: "reel" },
  ],
  instagram: [
    { label: "Feed", value: "feed" },
    { label: "Reel", value: "reel" },
  ],
  linkedin: [{ label: "Feed", value: "feed" }],
  google_business: [
    { label: "Update", value: "update" },
    { label: "Offer", value: "offer" },
    { label: "Announcement", value: "announcement" },
  ],
};

const LOGICAL_POST_OPTIONS = [
  { label: "Standard (Feed / Video)", value: "standard" },
  { label: "Short-form (Reel / Shorts)", value: "short" },
];

const PostPreview = ({
  title,
  caption,
  media,
  postType,
  platform = "generic",
}) => {
  const mediaUrl = useMemo(() => {
    if (!media || media.length === 0) return null;
    const file = media[0];
    if (file.originFileObj) {
      return URL.createObjectURL(file.originFileObj);
    }
    return file.url;
  }, [media]);

  const platformIcon = useMemo(() => {
    switch (platform) {
      case "facebook":
        return <FacebookFilled style={{ color: "#1877f2" }} />;
      case "instagram":
        return <InstagramFilled style={{ color: "#e4405f" }} />;
      case "linkedin":
        return <LinkedinFilled style={{ color: "#0a66c2" }} />;
      case "youtube":
        return <YoutubeFilled style={{ color: "#ff0000" }} />;
      case "google_business":
        return <ShopOutlined style={{ color: "#4285f4" }} />;
      case "pinterest":
        return <PinterestFilled style={{ color: "#E60023" }} />;
      default:
        return null;
    }
  }, [platform]);

  return (
    <div className="post-preview-container">
      <div className="post-preview-card">
        <div className="post-preview-header">
          <div className="post-preview-avatar" style={{ position: "relative" }}>
            <UserOutlined />
            {platformIcon && (
              <div
                style={{
                  position: "absolute",
                  bottom: -2,
                  right: -2,
                  background: "#fff",
                  borderRadius: "50%",
                  fontSize: 12,
                  width: 16,
                  height: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 4px rgba(0,0,0,0.2)",
                }}
              >
                {platformIcon}
              </div>
            )}
          </div>
          <div className="post-preview-user-info">
            <span className="post-preview-username">Your Page</span>
            <span className="post-preview-time">
              Just now • {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </span>
          </div>
        </div>

        <div className="post-preview-content">
          {postType !== "text" && (
            <div className="post-preview-media">
              {mediaUrl ? (
                postType === "video" ? (
                  <video src={mediaUrl} autoPlay muted loop />
                ) : (
                  <img src={mediaUrl} alt="Preview" />
                )
              ) : (
                <div style={{ textAlign: "center", color: "#94a3b8" }}>
                  <UploadOutlined
                    style={{ fontSize: 32, display: "block", marginBottom: 8 }}
                  />
                  <Text type="secondary">Media placeholder</Text>
                </div>
              )}
            </div>
          )}
          <div className="post-preview-caption">
            {platform === "youtube" && title && (
              <div
                style={{
                  fontWeight: 700,
                  marginBottom: 8,
                  fontSize: 14,
                  color: "#1e293b",
                }}
              >
                {title}
              </div>
            )}
            {caption ? (
              <div style={{ whiteSpace: "pre-wrap" }}>{caption}</div>
            ) : (
              <Text type="secondary" italic>
                Your caption will appear here...
              </Text>
            )}
          </div>
        </div>

        <div className="post-preview-footer">
          <HeartOutlined />
          <MessageOutlined />
          <SendOutlined />
        </div>
      </div>
    </div>
  );
};

export default function PostEditor({
  open,
  post,
  accounts = [],
  onClose,
  onSaved,
  isAdminView,
  activeClientId,
}) {
  const [form] = Form.useForm();
  const [postMode, setPostMode] = useState("immediate");
  const [saving, setSaving] = useState(false);
  const [previewTab, setPreviewTab] = useState("all");
  const postType = Form.useWatch("postType", form) || "image";
  const caption = Form.useWatch("caption", form);
  const campaign = Form.useWatch("campaign", form);
  const media = Form.useWatch("media", form);
  const selectedPlatformIds = Form.useWatch("platforms", form) || [];
  const [platformOptions, setPlatformOptions] = useState({});
  const [pinterestBoardsData, setPinterestBoardsData] = useState({});
  const [selectedBoards, setSelectedBoards] = useState({});
  const [loadingBoards, setLoadingBoards] = useState(false);

  const accountOptions = useMemo(() => {
    const grouped = (accounts || []).reduce((acc, account) => {
      const platformKey = account.platform || "unknown";
      if (!acc[platformKey]) acc[platformKey] = [];
      acc[platformKey].push(account);
      return acc;
    }, {});

    // Map platforms that are already "occupied"
    const occupiedPlatforms = new Set(
      (accounts || [])
        .filter((acc) => selectedPlatformIds.includes(acc.id))
        .map((acc) => acc.platform),
    );

    return Object.entries(grouped).map(([platform, platformAccounts]) => ({
      label: platform.charAt(0).toUpperCase() + platform.slice(1),
      options: platformAccounts.map((account) => ({
        label: account.page_name || account.username || account.id,
        value: account.id,
        // Disable if another account from the same platform is already selected
        disabled:
          occupiedPlatforms.has(platform) &&
          !selectedPlatformIds.includes(account.id),
      })),
    }));
  }, [accounts, selectedPlatformIds]);

  const allowedPostTypes = useMemo(() => {
    if (selectedPlatformIds.length === 0) {
      return ["image", "video", "text"];
    }

    const selectedPlatforms = (accounts || [])
      .filter((acc) => selectedPlatformIds.includes(acc.id))
      .map((acc) => acc.platform);

    if (selectedPlatforms.length === 0) return ["image", "video", "text"];

    // Intersection of capabilities
    let common = PLATFORM_CAPABILITIES[selectedPlatforms[0]] || [];
    for (let i = 1; i < selectedPlatforms.length; i++) {
      const caps = PLATFORM_CAPABILITIES[selectedPlatforms[i]] || [];
      common = common.filter((type) => caps.includes(type));
    }
    return common;
  }, [selectedPlatformIds, accounts]);

  const postTypeOptions = useMemo(() => {
    return POST_TYPE_OPTIONS.filter((opt) =>
      allowedPostTypes.includes(opt.value),
    );
  }, [allowedPostTypes]);

  const selectedPlatforms = useMemo(() => {
    const uniquePlatforms = [
      ...new Set(
        (accounts || [])
          .filter((acc) => selectedPlatformIds.includes(acc.id))
          .map((acc) => acc.platform),
      ),
    ];
    return uniquePlatforms;
  }, [selectedPlatformIds, accounts]);

  const availablePostOptions = useMemo(() => {
    return selectedPlatforms.reduce((acc, p) => {
      acc[p] = PLATFORM_POST_OPTIONS[p] || [];
      return acc;
    }, {});
  }, [selectedPlatforms]);

  useEffect(() => {
    const next = { ...platformOptions };
    let changed = false;
    selectedPlatforms.forEach((p) => {
      if (!next[p]) {
        next[p] = (PLATFORM_POST_OPTIONS[p] || [])[0]?.value;
        changed = true;
      }
    });
    if (changed) setPlatformOptions(next);
  }, [selectedPlatforms, platformOptions]);

  // Fetch Pinterest Boards
  useEffect(() => {
    let cancelled = false;
    const fetchPinterestBoards = async () => {
      const pinterestAccountIds = (accounts || []).filter(a => selectedPlatformIds.includes(a.id) && a.platform === "pinterest").map(a => a.id);
      
      const newBoardsData = { ...pinterestBoardsData };
      let fetchNeeded = false;
      for (const p_id of pinterestAccountIds) {
         if (!newBoardsData[p_id]) {
            fetchNeeded = true;
         }
      }
      
      if (!fetchNeeded) return;

      setLoadingBoards(true);
      try {
        const { campaignScheduledApi } = await import("./api.js");
        for (const p_id of pinterestAccountIds) {
          if (!newBoardsData[p_id]) {
            try {
              const boards = await campaignScheduledApi.getPinterestBoards(p_id, activeClientId);
              newBoardsData[p_id] = boards || [];
            } catch (err) {
              console.error("Failed to fetch boards for account " + p_id, err);
              newBoardsData[p_id] = []; // fallback to prevent infinite re-fetches
            }
          }
        }
        if (!cancelled) setPinterestBoardsData(newBoardsData);
      } catch (err) {
        if (!cancelled) message.error("Failed to fetch Pinterest boards");
      } finally {
        if (!cancelled) setLoadingBoards(false);
      }
    };
    fetchPinterestBoards();
    return () => { cancelled = true; };
  }, [selectedPlatformIds, accounts, activeClientId, pinterestBoardsData]);

  useEffect(() => {
    if (
      selectedPlatforms.length > 0 &&
      previewTab !== "all" &&
      !selectedPlatforms.includes(previewTab)
    ) {
      setPreviewTab("all");
    }
  }, [selectedPlatforms, previewTab]);

  const postModeLabel = useMemo(
    () => (postMode === "immediate" ? "Immediate Post" : "Scheduled Post"),
    [postMode],
  );

  useEffect(() => {
    const existingMedia = post?.media_url || post?.mediaUrl || "";
    const inferredPostType = !existingMedia
      ? "text"
      : /\.(mp4|mov|avi|webm|mkv)$/i.test(existingMedia) ||
          existingMedia.includes("/video/upload/")
        ? "video"
        : "image";

    form.setFieldsValue({
      postType: post ? inferredPostType : "image",
      caption: post?.caption || "",
      campaign: post?.campaign || "",
      date: post?.scheduled_iso
        ? dayjs(post.scheduled_iso)
        : post?.scheduledDate
          ? dayjs(post.scheduledDate)
          : dayjs().add(1, "day"),
      time: post?.scheduled_iso
        ? dayjs(post.scheduled_iso)
        : post?.scheduledTime
          ? dayjs(post.scheduledTime, "HH:mm")
          : dayjs("09:00", "HH:mm"),
      platforms: post?.platforms || [],
      media: [],
    });
    setPlatformOptions(post?.post_option || {});
    setSelectedBoards(post?.boards || {});
    setPostMode(post?.post_mode || post?.postMode || "immediate");
  }, [post, form, open, accounts]);

  // Validation: ensure postType is valid for selected platforms
  useEffect(() => {
    if (!allowedPostTypes.includes(postType) && allowedPostTypes.length > 0) {
      form.setFieldValue("postType", allowedPostTypes[0]);
      form.setFieldValue("media", []);
      message.info(
        `Post type reset to ${allowedPostTypes[0]} due to platform restrictions.`,
      );
    }
  }, [allowedPostTypes, postType, form]);

  const buildPostPayload = (values, mode) => {
    const uploadedFile = values.media?.[0];
    const mediaFile = uploadedFile?.originFileObj || null;
    const mediaUrl =
      values.postType === "text"
        ? undefined
        : uploadedFile?.originFileObj
          ? URL.createObjectURL(uploadedFile.originFileObj)
          : uploadedFile?.url || post?.media_url || post?.mediaUrl || undefined;

    const isScheduled = mode === "scheduled";
    const resolvedDate = isScheduled ? values.date : dayjs();
    const resolvedTime = isScheduled ? values.time : dayjs();
    const uniqueAccountIds = [...new Set(values.platforms || [])];

    return {
      id: post?.id || `p-${Date.now()}`,
      caption: values.caption,
      campaign: values.campaign,
      mediaUrl,
      type: values.postType === "text" ? "Text Post" : "Post Composer",
      status:
        mode === "draft" ? "Draft" : isScheduled ? "Scheduled" : "Scheduled",
      postMode:
        mode === "immediate"
          ? "immediate"
          : mode === "draft"
            ? "draft"
            : "scheduled",
      scheduledDate: resolvedDate.format("YYYY-MM-DD"),
      scheduledTime: resolvedTime.format("HH:mm"),
      scheduledISO: resolvedDate
        .hour(resolvedTime.hour())
        .minute(resolvedTime.minute())
        .second(0)
        .millisecond(0)
        .toISOString(),
      platforms: uniqueAccountIds,
      post_option: platformOptions,
      boards: selectedBoards,
      mediaFile,
    };
  };

  const onSubmit = async (values) => {
    if (saving) return;
    setSaving(true);
    try {
      await onSaved(buildPostPayload(values, postMode), postMode);
    } finally {
      setSaving(false);
    }
  };

  const onSaveDraft = async () => {
    if (saving) return;
    try {
      const values = await form.validateFields([
        "caption",
        "campaign",
        "platforms",
      ]);
      setSaving(true);
      await onSaved(buildPostPayload(values, "draft"), "draft");
    } catch (err) {
      // Form validation failed
    } finally {
      setSaving(false);
    }
  };

  const handlePrimaryAction = () => {
    if (saving) return;
    form.submit();
  };

  const postActionMenu = {
    items: [
      { key: "immediate", label: "Immediate Post" },
      { key: "scheduled", label: "Scheduled Post" },
    ],
    onClick: ({ key }) => {
      setPostMode(key);
    },
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={post ? "Edit Post" : "Create Post"}
      width={1000}
      centered
      footer={null}
      destroyOnClose
      className="post-editor-modal"
      styles={{
        body: {
          maxHeight: "calc(100vh - 100px)",
          overflowX: "hidden",
          overflowY: "auto",
          padding: 0,
        },
      }}
    >
      <Row gutter={0}>
        <Col
          xs={24}
          lg={14}
          style={{
            padding: 24,
            borderRight: "1px solid #f0f0f0",
            minHeight: "500px",
          }}
        >
          <Form
            layout="vertical"
            form={form}
            onFinish={onSubmit}
          >
            <Form.Item
              label="Accounts"
              name="platforms"
              rules={[
                { required: true, message: "At least one account is required" },
              ]}
            >
              <Select
                mode="multiple"
                options={accountOptions}
                placeholder="Select accounts to publish to"
                optionFilterProp="label"
                onChange={(nextIds) => {
                  form.setFieldValue("platforms", nextIds);
                }}
              />
            </Form.Item>

            {selectedPlatformIds.length > 0 && accounts.some(a => selectedPlatformIds.includes(a.id) && a.platform === "pinterest") && (
              <div style={{ marginBottom: 24 }}>
                <Text strong>Pinterest Boards</Text>
                {selectedPlatformIds.map(accountId => {
                   const account = accounts.find(a => a.id === accountId);
                   if (!account || account.platform !== "pinterest") return null;
                   const pageName = account.page_name || account.username || account.id;
                   const boards = pinterestBoardsData[accountId] || [];
                   return (
                     <div key={accountId} style={{ marginTop: 8 }}>
                       <Text style={{ display: "block", marginBottom: 4 }}>Board for {pageName}</Text>
                       <Select 
                         style={{ width: "100%" }}
                         placeholder="Select a board"
                         loading={loadingBoards}
                         value={selectedBoards[accountId]}
                         onChange={(val) => setSelectedBoards(prev => ({ ...prev, [accountId]: val }))}
                       >
                         {boards.map(b => (
                           <Select.Option key={b.id} value={b.id}>{b.name}</Select.Option>
                         ))}
                       </Select>
                     </div>
                   );
                })}
              </div>
            )}

            <Form.Item
              label="Post Type"
              name="postType"
              rules={[{ required: true, message: "Post type is required" }]}
            >
              <Select
                options={postTypeOptions}
                onChange={() => form.setFieldValue("media", [])}
              />
            </Form.Item>

            {postType !== "text" && (
              <Form.Item
                label="Media Upload"
                name="media"
                valuePropName="fileList"
                getValueFromEvent={(e) => e?.fileList || []}
                rules={[
                  { required: true, message: `Please upload a ${postType}` },
                ]}
              >
                <Upload
                  beforeUpload={() => false}
                  maxCount={1}
                  accept={postType === "video" ? "video/*" : "image/*"}
                  listType="text"
                >
                  <Button icon={<UploadOutlined />}>
                    {postType === "video" ? "Upload Video" : "Upload Image"}
                  </Button>
                </Upload>
              </Form.Item>
            )}

            <Form.Item
              label="Title"
              name="campaign"
              rules={[{ required: true, message: "Title is required" }]}
            >
              <Input placeholder="Enter post title" maxLength={100} showCount />
            </Form.Item>

            <Form.Item
              label="Caption"
              name="caption"
              rules={[{ required: true, message: "Caption is required" }]}
            >
              <Input.TextArea
                rows={4}
                placeholder="What do you want to talk about?"
                maxLength={5000}
                showCount
              />
            </Form.Item>

            {postMode === "scheduled" && (
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label="Date"
                    name="date"
                    rules={[{ required: true, message: "Date is required" }]}
                  >
                    <DatePicker style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Time"
                    name="time"
                    rules={[{ required: true, message: "Time is required" }]}
                  >
                    <TimePicker format="HH:mm" style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
            )}
            <Divider style={{ margin: "12px 0 24px" }} />
            <Space wrap>
              <Button onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={onSaveDraft} loading={saving} disabled={saving}>
                Save as Draft
              </Button>
              <Dropdown.Button
                type="primary"
                menu={postActionMenu}
                onClick={handlePrimaryAction}
                loading={saving}
                disabled={saving}
              >
                {postModeLabel}
              </Dropdown.Button>
            </Space>
          </Form>
        </Col>
        <Col
          xs={24}
          lg={10}
          style={{
            padding: 24,
            background: "#fafafa",
            minHeight: "500px",
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <Text strong type="secondary">
              Post Preview
            </Text>
          </div>
          <Tabs
            activeKey={previewTab}
            onChange={setPreviewTab}
            size="small"
            items={[
              { key: "all", label: "All" },
              ...selectedPlatforms.map((p) => ({
                key: p,
                label: (
                  <Space size={4}>
                    {p === "facebook" && (
                      <FacebookFilled style={{ color: "#1877f2" }} />
                    )}
                    {p === "instagram" && (
                      <InstagramFilled style={{ color: "#e4405f" }} />
                    )}
                    {p === "linkedin" && (
                      <LinkedinFilled style={{ color: "#0a66c2" }} />
                    )}
                    {p === "youtube" && (
                      <YoutubeFilled style={{ color: "#ff0000" }} />
                    )}
                    {p === "google_business" && (
                      <ShopOutlined style={{ color: "#4285f4" }} />
                    )}
                    {p === "pinterest" && (
                      <PinterestFilled style={{ color: "#E60023" }} />
                    )}
                    <span style={{ fontSize: 12, textTransform: "capitalize" }}>
                      {p.replace("_", " ")}
                    </span>
                  </Space>
                ),
              })),
            ]}
          />
          <div style={{ marginTop: 12 }}>
            {previewTab !== "all" && postType !== "text" && (
              <div
                style={{
                  background: "#fff",
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  marginBottom: 16,
                }}
              >
                <Text
                  strong
                  style={{
                    fontSize: 12,
                    display: "block",
                    marginBottom: 8,
                    color: "#64748b",
                  }}
                >
                  POST OPTION
                </Text>
                <Space size={16}>
                  {(PLATFORM_POST_OPTIONS[previewTab] || []).map((opt) => (
                    <Checkbox
                      key={opt.value}
                      checked={platformOptions[previewTab] === opt.value}
                      onChange={() =>
                        setPlatformOptions({
                          ...platformOptions,
                          [previewTab]: opt.value,
                        })
                      }
                      style={{ fontSize: 13 }}
                    >
                      {opt.label}
                    </Checkbox>
                  ))}
                </Space>
              </div>
            )}
            {previewTab === "all" ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 24 }}
              >
                {selectedPlatforms.length > 0 ? (
                  selectedPlatforms.map((p) => (
                    <PostPreview
                      key={p}
                      title={campaign}
                      caption={caption}
                      media={media}
                      postType={postType}
                      platform={p}
                    />
                  ))
                ) : (
                  <PostPreview
                    title={campaign}
                    caption={caption}
                    media={media}
                    postType={postType}
                  />
                )}
              </div>
            ) : (
              <PostPreview
                title={campaign}
                caption={caption}
                media={media}
                postType={postType}
                platform={previewTab}
              />
            )}
          </div>
          <div style={{ marginTop: 24 }}>
            <Text type="secondary" size="small">
              * This is a generic preview. Layout may vary slightly by platform.
            </Text>
          </div>
        </Col>
      </Row>
    </Modal>
  );
}
