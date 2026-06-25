import React, { useMemo } from "react";
import { Button, Card, Col, Row, Space, Tag, Typography } from "antd";

const { Title, Text } = Typography;

export default function ContentCalendar({ posts, onEdit, onCreateNew }) {
  const grouped = useMemo(() => {
    return posts.reduce((acc, post) => {
      if (!acc[post.campaign]) acc[post.campaign] = [];
      acc[post.campaign].push(post);
      return acc;
    }, {});
  }, [posts]);

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <Title level={5} style={{ margin: 0 }}>
        Campaign Buckets
      </Title>
      <Row gutter={[16, 16]}>
        {Object.entries(grouped).map(([name, campaignPosts]) => (
          <Col xs={24} md={12} lg={8} key={name}>
            <Card
              title={name}
              extra={<Text type="secondary">{campaignPosts.length} posts</Text>}
              className="campaign-scheduler-surface campaign-scheduler-campaign-card"
            >
              <Space direction="vertical" style={{ width: "100%" }}>
                {campaignPosts.map((post) => (
                  <Card
                    key={post.id}
                    size="small"
                    className="campaign-scheduler-inner-post-card"
                    style={{ cursor: "pointer" }}
                    onClick={() => onEdit(post)}
                  >
                    <Text>{post.caption}</Text>
                    <br />
                    <Space style={{ marginTop: 6 }}>
                      <Tag>{post.scheduledDate}</Tag>
                      <Tag color="blue">{post.status}</Tag>
                    </Space>
                  </Card>
                ))}
                <Button type="dashed" block onClick={onCreateNew}>
                  Add Post to Campaign
                </Button>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </Space>
  );
}
