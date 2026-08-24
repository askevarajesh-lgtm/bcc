import React, { useState } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  message,
  Card,
  Typography,
  Popconfirm,
  Modal,
  Descriptions,
  Image,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  FileOutlined,
  LockOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  useGetSEOQuery,
  useDeleteSEOMutation,
  useGetSEODashboardStatsQuery,
  useGetSEOUniqueWebsitesQuery,
} from "../../api/seoApi";
import { useActionPermissions } from "../../hooks/useActionPermissions";
import { PERMISSION_ACTIONS } from "../../utils/actionPermissions";
import DebouncedSearchInput from "../../components/common/DebouncedSearchInput";
import usePagination from "../../hooks/usePagination";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const SEOList = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { pagination, queryParams, handleTableChange, handleSearchChange } =
    usePagination({ defaultPageSize: 10 });
  const { data, isLoading } = useGetSEOQuery(queryParams);
  const { data: statsData } = useGetSEODashboardStatsQuery(); // Get dashboard stats for accurate totals
  const { data: websitesData, isLoading: isLoadingWebsites } =
    useGetSEOUniqueWebsitesQuery();
  const [deleteSEO, { isLoading: isDeleting }] = useDeleteSEOMutation();

  const { canAdd, canEdit, canDelete, canView } =
    useActionPermissions("/seo-panel");

  const [selectedSEO, setSelectedSEO] = useState(null);
  const [isCredentialsModalVisible, setIsCredentialsModalVisible] =
    useState(false);
  const [viewMode, setViewMode] = useState("entries"); // 'entries' or 'websites'
  const [selectedWebsite, setSelectedWebsite] = useState(null);
  const [isWebsiteModalVisible, setIsWebsiteModalVisible] = useState(false);

  const paginationData = data?.data?.pagination;
  const seoEntries = data?.data?.data || [];
  
  const totalRef = React.useRef(0);
  if (paginationData?.total !== undefined) {
    totalRef.current = paginationData.total;
  }
  const total = paginationData?.total || seoEntries.length || totalRef.current;

  const uniqueWebsites = websitesData?.data || [];

  // Get totals from dashboard stats (calculated from ALL entries, not just current page)
  const stats = statsData?.data?.stats;
  const totalWebsiteOffPageCount = stats?.totalOffPageSeoCount || 0;
  const todayOffPageCount = stats?.todayOffPageSeoCount || 0;
  const totalUniqueWebsites = stats?.totalWebsites || uniqueWebsites.length;

  const handleDelete = async (id) => {
    try {
      await deleteSEO(id).unwrap();
      message.success("SEO entry deleted successfully");
    } catch (error) {
      message.error(error?.data?.message || "Failed to delete SEO entry");
    }
  };

  const handleViewCredentials = (record) => {
    setSelectedSEO(record);
    setIsCredentialsModalVisible(true);
  };

  // Sort SEO entries by creation date to find first created
  const sortedSEOEntries = [...seoEntries].sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return dateA - dateB;
  });
  const firstCreatedSEO =
    sortedSEOEntries.length > 0 ? sortedSEOEntries[0] : null;

  const columns = [
    {
      title: "Website Link",
      dataIndex: "websiteLink",
      key: "websiteLink",
      width: 200,
      ellipsis: {
        showTitle: false,
      },
      render: (link, record) => {
        const isFirst = firstCreatedSEO && record._id === firstCreatedSEO._id;
        return (
          <Space size="small" wrap>
            {isFirst && (
              <Tag color="gold" style={{ margin: 0, fontSize: "11px" }}>
                First
              </Tag>
            )}
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: "12px" }}
            >
              {link.length > 30 ? `${link.substring(0, 30)}...` : link}
            </a>
          </Space>
        );
      },
    },
    {
      title: "Keywords",
      dataIndex: "keywords",
      key: "keywords",
      width: 250,
      ellipsis: {
        showTitle: false,
      },
      render: (keywords) => {
        if (!keywords) return <Text type="secondary">N/A</Text>;

        // Split keywords by comma, newline, or semicolon and filter out empty strings
        const keywordList = keywords
          .split(/[,\n;]/)
          .map((k) => k.trim())
          .filter((k) => k.length > 0);

        if (keywordList.length === 0) return <Text type="secondary">N/A</Text>;

        // Show first 2 keywords as tags, then show count if more
        const displayKeywords = keywordList.slice(0, 2);
        const remainingCount = keywordList.length - 2;

        return (
          <Space wrap size={[4, 4]}>
            {displayKeywords.map((keyword, idx) => (
              <Tag
                key={idx}
                color="blue"
                style={{ margin: 0, fontSize: "11px" }}
              >
                {keyword.length > 20
                  ? `${keyword.substring(0, 20)}...`
                  : keyword}
              </Tag>
            ))}
            {remainingCount > 0 && (
              <Tag color="default" style={{ margin: 0, fontSize: "11px" }}>
                +{remainingCount}
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: "Services",
      key: "services",
      width: 200,
      ellipsis: {
        showTitle: false,
      },
      render: (_, record) => {
        const services = [];
        if (record.contentWork) services.push("Content");
        if (record.onpageSeo) services.push("On-page");
        if (record.technicalSeo) services.push("Technical");
        if (record.localSeo) services.push("Local");
        if (record.keywordResearch) services.push("Keywords");
        if (record.offPageSeo) services.push("Off-page");

        if (services.length === 0) {
          return (
            <Text type="secondary" style={{ fontSize: "12px" }}>
              None
            </Text>
          );
        }

        // Show first 3 services, then count
        const displayServices = services.slice(0, 3);
        const remainingCount = services.length - 3;

        return (
          <Space wrap size={[4, 4]}>
            {displayServices.map((service, idx) => (
              <Tag
                key={idx}
                color="blue"
                style={{ margin: 0, fontSize: "11px", padding: "0 6px" }}
              >
                {service}
              </Tag>
            ))}
            {remainingCount > 0 && (
              <Tag
                color="default"
                style={{ margin: 0, fontSize: "11px", padding: "0 6px" }}
              >
                +{remainingCount}
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: "Created By",
      key: "createdBy",
      width: 140,
      ellipsis: true,
      render: (_, record) =>
        record.createdBy?.name || <Text type="secondary">N/A</Text>,
    },
    {
      title: "Off-page Count",
      dataIndex: "offPageSeoCount",
      key: "offPageSeoCount",
      width: 120,
      align: "center",
      render: (count) => count || 0,
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      fixed: window.innerWidth <= 768 ? false : "right",
      align: "center",
      render: (_, record) => (
        <Space>
          {canView && (
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => navigate(`view/${record._id}`)}
            >
              View
            </Button>
          )}
          {canEdit && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => navigate(`edit/${record._id}`)}
            >
              Edit
            </Button>
          )}
          {record.credentialsFile && (
            <Button
              type="link"
              icon={<LockOutlined />}
              onClick={() => handleViewCredentials(record)}
            >
              Credentials
            </Button>
          )}
          {canDelete && (
            <Popconfirm
              title="Delete SEO Entry"
              description="Are you sure you want to delete this SEO entry?"
              onConfirm={() => handleDelete(record._id)}
              okText="Delete"
              okType="danger"
              cancelText="Cancel"
            >
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                loading={isDeleting}
              >
                Delete
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const websiteColumns = [
    {
      title: "Website Link",
      dataIndex: "websiteLink",
      key: "websiteLink",
      render: (link) => (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: "12px" }}
        >
          {link}
        </a>
      ),
    },
    {
      title: "Total Keywords",
      dataIndex: "totalKeywordsCount",
      key: "totalKeywordsCount",
      width: 150,
      align: "center",
    },
    {
      title: "Entries",
      dataIndex: "entryCount",
      key: "entryCount",
      width: 100,
      align: "center",
    },
    {
      title: "Off-page Count",
      dataIndex: "totalOffPageCount",
      key: "totalOffPageCount",
      width: 150,
      align: "center",
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      fixed: window.innerWidth <= 768 ? false : "right",
      align: "center",
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedWebsite(record);
            setIsWebsiteModalVisible(true);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Title level={2}>SEO Entries</Title>
        <Space>
          <Button
            icon={<FileOutlined />}
            onClick={() => navigate("reports/client-user")}
          >
            Client & User Report
          </Button>
          {canAdd && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate("new")}
            >
              Create SEO Entry
            </Button>
          )}
        </Space>
      </div>

      {/* Off-page Backlink Count Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8} lg={8}>
          <Card
            hoverable
            onClick={() => setViewMode(viewMode === "websites" ? "entries" : "websites")}
            style={{
              cursor: "pointer",
              border: viewMode === "websites" ? "2px solid var(--primary-color, var(--accent-primary))" : "1px solid #f0f0f0",
              borderRadius: "12px",
              boxShadow: viewMode === "websites" ? "0 4px 12px rgba(24, 144, 255, 0.15)" : "0 2px 8px rgba(0, 0, 0, 0.04)",
              transition: "all 0.3s ease",
            }}
            bodyStyle={{ padding: "20px" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <Text type="secondary" style={{ fontSize: "14px", fontWeight: 500 }}>Total Websites</Text>
              <div style={{ background: "#e6f7ff", padding: "8px", borderRadius: "8px", color: "var(--accent-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <GlobalOutlined style={{ fontSize: "18px" }} />
              </div>
            </div>
            <Statistic value={totalUniqueWebsites} valueStyle={{ fontSize: "28px", fontWeight: 600, color: "#1f1f1f" }} />
            <Text type="secondary" style={{ fontSize: "12px", marginTop: 8, display: "block" }}>
              Total unique websites under SEO management
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={8} lg={8}>
          <Card
            style={{
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              border: "1px solid #f0f0f0",
            }}
            bodyStyle={{ padding: "20px" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <Text type="secondary" style={{ fontSize: "14px", fontWeight: 500 }}>Total Off-page Backlink Count</Text>
              <div style={{ background: "#f6ffed", padding: "8px", borderRadius: "8px", color: "#52c41a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <LinkOutlined style={{ fontSize: "18px" }} />
              </div>
            </div>
            <Statistic value={totalWebsiteOffPageCount} valueStyle={{ fontSize: "28px", fontWeight: 600, color: "#1f1f1f" }} />
            <Text type="secondary" style={{ fontSize: "12px", marginTop: 8, display: "block" }}>
              Sum of all off-page counts from SEO entries
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={8} lg={8}>
          <Card
            style={{
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              border: "1px solid #f0f0f0",
            }}
            bodyStyle={{ padding: "20px" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <Text type="secondary" style={{ fontSize: "14px", fontWeight: 500 }}>Daily Count (From Off-page)</Text>
              <div style={{ background: "#fffbe6", padding: "8px", borderRadius: "8px", color: "#faad14", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircleOutlined style={{ fontSize: "18px" }} />
              </div>
            </div>
            <Statistic value={todayOffPageCount} valueStyle={{ fontSize: "28px", fontWeight: 600, color: "#1f1f1f" }} />
            <Text type="secondary" style={{ fontSize: "12px", marginTop: 8, display: "block" }}>
              Sum of off-page counts added today across all entries
            </Text>
          </Card>
        </Col>
      </Row>

      <Card
        style={{
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          border: "1px solid #f0f0f0",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            {viewMode === "entries" ? "SEO Entries" : "Unique Websites"}
          </Title>
          {viewMode === "entries" && (
            <DebouncedSearchInput
              placeholder="Search by website link or keywords..."
              onChange={handleSearchChange}
              style={{ width: "100%", maxWidth: 400 }}
            />
          )}
        </div>

        {viewMode === "entries" ? (
          <Table
            columns={columns}
            dataSource={seoEntries}
            rowKey="_id"
            loading={isLoading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: total,
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} entries`,
              pageSizeOptions: ["10", "20", "50", "100"],
            }}
            onChange={handleTableChange}
            scroll={{ x: 1000 }}
            size="small"
          />
        ) : (
          <Table
            columns={websiteColumns}
            dataSource={uniqueWebsites}
            rowKey="websiteLink"
            loading={isLoadingWebsites}
            pagination={{
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} websites`,
            }}
            scroll={{ x: "max-content" }}
            size="small"
          />
        )}
      </Card>

      {/* Credentials Modal */}
      <Modal
        title="SEO Credentials"
        open={isCredentialsModalVisible}
        onCancel={() => {
          setIsCredentialsModalVisible(false);
          setSelectedSEO(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setIsCredentialsModalVisible(false);
              setSelectedSEO(null);
            }}
          >
            Close
          </Button>,
        ]}
        width={600}
      >
        {selectedSEO && (
          <div>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Website Link">
                <a
                  href={selectedSEO.websiteLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {selectedSEO.websiteLink}
                </a>
              </Descriptions.Item>
              <Descriptions.Item label="Credentials File">
                {selectedSEO.credentialsFile ? (
                  <div>
                    <Text>
                      {selectedSEO.credentialsFileName || "Credentials File"}
                    </Text>
                    <br />
                    <a
                      href={selectedSEO.credentialsFile}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ marginTop: 8, display: "inline-block" }}
                    >
                      <Button type="link" icon={<FileOutlined />}>
                        Download Credentials
                      </Button>
                    </a>
                  </div>
                ) : (
                  <Text type="secondary">No credentials uploaded</Text>
                )}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
      {/* Website Detail Modal */}
      <Modal
        title={`Website Details: ${selectedWebsite?.websiteLink}`}
        open={isWebsiteModalVisible}
        onCancel={() => {
          setIsWebsiteModalVisible(false);
          setSelectedWebsite(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setIsWebsiteModalVisible(false);
              setSelectedWebsite(null);
            }}
          >
            Close
          </Button>,
        ]}
        width={900}
      >
        {selectedWebsite && (
          <div>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Statistic
                  title="Total Entries"
                  value={selectedWebsite.entryCount}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Total Keywords"
                  value={selectedWebsite.totalKeywordsCount}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Total Off-page"
                  value={selectedWebsite.totalOffPageCount}
                />
              </Col>
            </Row>

            <Title level={5}>Keywords</Title>
            <Space wrap style={{ marginBottom: 24 }}>
              {selectedWebsite.allKeywords.map((keyword, idx) => (
                <Tag key={idx} color="blue">
                  {keyword}
                </Tag>
              ))}
              {selectedWebsite.allKeywords.length === 0 && (
                <Text type="secondary">No keywords found</Text>
              )}
            </Space>

            <Title level={5}>Detail Entries</Title>
            <Table
              dataSource={selectedWebsite.entries}
              rowKey="_id"
              size="small"
              pagination={false}
              scroll={{ x: "max-content" }}
              columns={[
                {
                  title: "Date",
                  dataIndex: "createdAt",
                  key: "createdAt",
                  render: (date) => dayjs(date).format("DD MMM YYYY"),
                },
                {
                  title: "Keywords",
                  dataIndex: "keywords",
                  key: "keywords",
                  render: (keywords) => (
                    <Space wrap>
                      {keywords?.split(/[,\n;]/).map((k, idx) => (
                        <Tag
                          key={idx}
                          color="default"
                          style={{ fontSize: "11px" }}
                        >
                          {k.trim()}
                        </Tag>
                      ))}
                    </Space>
                  ),
                },
                {
                  title: "Off-page Count",
                  dataIndex: "offPageSeoCount",
                  key: "offPageSeoCount",
                  align: "center",
                },
                {
                  title: "Action",
                  key: "action",
                  width: 80,
                  fixed: window.innerWidth <= 768 ? false : "right",
                  render: (_, record) => (
                    <Button
                      type="link"
                      onClick={() => navigate(`view/${record._id}`)}
                    >
                      View
                    </Button>
                  ),
                },
              ]}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SEOList;
