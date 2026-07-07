import React from 'react';
import { Typography, Card, Row, Col, Button, Empty, Spin, Tag, Tooltip, message } from 'antd';
import { Copy, Download, Trash2, Image as ImageIcon, Video } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAIStudio } from '../context/AIStudioContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const AssetLibraryTab = () => {
  const { assets, loadingAssets, deleteAsset } = useAIStudio();

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    message.success('URL copied to clipboard');
  };

  if (loadingAssets) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <Card bordered={false} className="glassmorphism" style={{ borderRadius: 12, textAlign: 'center', padding: '60px 0' }}>
        <Empty description="No AI assets saved yet." />
      </Card>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4}>Asset Library</Title>
        <Text type="secondary">All your generated images and videos in one place.</Text>
      </div>

      <Row gutter={[24, 24]}>
        {assets.map((asset, index) => (
          <Col xs={24} sm={12} md={8} lg={6} key={asset._id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              style={{ height: '100%' }}
            >
              <Card
                hoverable
                cover={
                  <div style={{ height: 180, overflow: 'hidden', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {asset.type === 'video' ? (
                      <>
                        <video src={asset.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', top: 8, right: 8 }}>
                          <Tag color="purple" style={{ margin: 0 }}><Video size={12} /> Video</Tag>
                        </div>
                      </>
                    ) : (
                      <>
                        <img alt="AI Asset" src={asset.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', top: 8, right: 8 }}>
                          <Tag color="blue" style={{ margin: 0 }}><ImageIcon size={12} /> Image</Tag>
                        </div>
                      </>
                    )}
                  </div>
                }
                actions={[
                  <Tooltip title="Copy URL" key="copy">
                    <Button type="text" icon={<Copy size={16} />} onClick={() => handleCopyUrl(asset.url)} />
                  </Tooltip>,
                  <Tooltip title="Download" key="download">
                    <Button type="text" icon={<Download size={16} />} onClick={() => window.open(asset.url, '_blank')} />
                  </Tooltip>,
                  <Tooltip title="Delete" key="delete">
                    <Button type="text" danger icon={<Trash2 size={16} />} onClick={() => deleteAsset(asset._id)} />
                  </Tooltip>
                ]}
                className="glassmorphism"
                style={{ borderRadius: 12, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}
                bodyStyle={{ flex: 1, padding: 16 }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Text ellipsis={{ tooltip: asset.prompt }} style={{ fontWeight: 500, fontSize: 14 }}>
                    {asset.prompt}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {dayjs(asset.createdAt).format('MMM D, YYYY h:mm A')}
                  </Text>
                </div>
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default AssetLibraryTab;
