import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarOutlined,
  CommentOutlined,
  LikeOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import { Card, Empty, Input, Pagination, Tag, Typography } from "antd";

const { Text, Title } = Typography;

function getPostMetrics(post) {
  const likes = Number(post?.likes);
  const comments = Number(post?.comments);
  const shares = Number(post?.shares);

  if (
    [likes, comments, shares].every(
      (value) => Number.isFinite(value) && value >= 0,
    )
  ) {
    return { likes, comments, shares };
  }

  return { likes: 0, comments: 0, shares: 0 };
}

function getPlatformLabels(platformIds = [], accounts = []) {
  return platformIds.map((id) => {
    const account = accounts.find((item) => item.id === id);
    if (!account) return id;
    const platform = account.platform
      ? `${account.platform.charAt(0).toUpperCase()}${account.platform.slice(1)}`
      : "Platform";
    const name = account.page_name || account.username || account.id;
    return `${platform} (${name})`;
  });
}

function getScheduleText(post) {
  const date = post.scheduledDate || post.scheduled_date || "-";
  const time = post.scheduledTime || post.scheduled_time || "";
  return `${date}${time ? `, ${time}` : ""}`;
}

export default function CampaignLogsView({ posts = [], accounts = [] }) {
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const publishedPosts = useMemo(
    () => posts.filter((post) => post.status === "Published"),
    [posts],
  );

  const filteredPosts = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return publishedPosts;

    return publishedPosts.filter((post) => {
      return (
        (post.caption || "").toLowerCase().includes(search) ||
        (post.campaign || "").toLowerCase().includes(search)
      );
    });
  }, [publishedPosts, query]);

  // Reset to first page when query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPosts.slice(start, start + pageSize);
  }, [filteredPosts, currentPage, pageSize]);

  return (
    <div className="campaign-logs-page">
      <div className="campaign-logs-head">
        <div>
          <Title level={5} style={{ margin: 0 }}>
            Campaign Logs
          </Title>
          <Text type="secondary">
            Published posts with engagement performance
          </Text>
        </div>
        <Input.Search
          allowClear
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by caption or campaign"
          className="campaign-logs-search"
        />
      </div>

      {filteredPosts.length === 0 ? (
        <Card className="campaign-scheduler-surface">
          <Empty description="No published posts available for logs yet." />
        </Card>
      ) : (
        <>
          <div className="campaign-logs-list">
            {paginatedPosts.map((post) => {
              const metrics = getPostMetrics(post);
              const platformLabels = getPlatformLabels(
                post.platforms || [],
                accounts,
              );

              return (
                <Card
                  key={post.id}
                  className="campaign-scheduler-surface campaign-log-row campaign-log-card"
                >
                  <div className="campaign-log-single-row">
                    <div className="campaign-log-left">
                      <div className="campaign-log-card-head">
                        <div className="campaign-log-title-wrap">
                          <Tag color="green">Published</Tag>
                          <Tag>{post.campaign || "General"}</Tag>
                          <Text className="campaign-log-date">
                            <CalendarOutlined /> {getScheduleText(post)}
                          </Text>
                        </div>
                        <Text className="campaign-log-id">
                          #{String(post.id || "").slice(0, 8)}
                        </Text>
                      </div>

                      <Title level={6} className="campaign-log-caption">
                        {post.caption || "-"}
                      </Title>

                      <div className="campaign-log-platforms">
                        {platformLabels.length > 0 ? (
                          platformLabels.map((label) => (
                            <Tag
                              key={`${post.id}-${label}`}
                              className="campaign-log-platform-tag"
                            >
                              {label}
                            </Tag>
                          ))
                        ) : (
                          <Text type="secondary">
                            No platform mapping found
                          </Text>
                        )}
                      </div>
                    </div>

                    <div className="campaign-log-metric-group">
                      <div className="campaign-log-metric-stat">
                        <span className="campaign-log-metric-icon-small like">
                          <LikeOutlined />
                        </span>
                        <div className="campaign-log-metric-info">
                          <Text strong>{metrics.likes}</Text>
                          <Text type="secondary" className="metric-label">
                            Likes
                          </Text>
                        </div>
                      </div>
                      <div className="campaign-log-metric-stat">
                        <span className="campaign-log-metric-icon-small comment">
                          <CommentOutlined />
                        </span>
                        <div className="campaign-log-metric-info">
                          <Text strong>{metrics.comments}</Text>
                          <Text type="secondary" className="metric-label">
                            Comments
                          </Text>
                        </div>
                      </div>
                      <div className="campaign-log-metric-stat">
                        <span className="campaign-log-metric-icon-small share">
                          <ShareAltOutlined />
                        </span>
                        <div className="campaign-log-metric-info">
                          <Text strong>{metrics.shares}</Text>
                          <Text type="secondary" className="metric-label">
                            Shares
                          </Text>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 16,
            }}
          >
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredPosts.length}
              onChange={(page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              }}
              showSizeChanger
              pageSizeOptions={["5", "10", "20", "50"]}
              showTotal={(total) => `Total ${total} items`}
            />
          </div>
        </>
      )}
    </div>
  );
}
