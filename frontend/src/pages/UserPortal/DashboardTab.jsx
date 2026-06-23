import React from 'react';
import { Typography, Card, Row, Col } from 'antd';
import { motion } from 'framer-motion';
import { CheckSquare, Clock, AlertCircle } from 'lucide-react';

const { Title, Text } = Typography;

const UserDashboard = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} style={{ marginBottom: 32 }}>
        <Title level={2} style={{ margin: '0 0 8px 0', fontWeight: 800 }}>Welcome to your Dashboard</Title>
        <Text type="secondary" style={{ fontSize: 16 }}>Here is an overview of your active tasks and recent activities.</Text>
      </motion.div>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <motion.div variants={itemVariants}>
            <Card className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ background: 'var(--accent-info)', padding: 12, borderRadius: 12 }}>
                  <CheckSquare size={24} color="#fff" />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>Active Tasks</Text>
                  <Title level={3} style={{ margin: 0, fontWeight: 800 }}>12</Title>
                </div>
              </div>
            </Card>
          </motion.div>
        </Col>
        
        <Col xs={24} md={8}>
          <motion.div variants={itemVariants}>
            <Card className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ background: 'var(--accent-warning)', padding: 12, borderRadius: 12 }}>
                  <Clock size={24} color="#fff" />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>Due This Week</Text>
                  <Title level={3} style={{ margin: 0, fontWeight: 800 }}>5</Title>
                </div>
              </div>
            </Card>
          </motion.div>
        </Col>

        <Col xs={24} md={8}>
          <motion.div variants={itemVariants}>
            <Card className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ background: 'var(--accent-danger)', padding: 12, borderRadius: 12 }}>
                  <AlertCircle size={24} color="#fff" />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>Overdue</Text>
                  <Title level={3} style={{ margin: 0, fontWeight: 800 }}>0</Title>
                </div>
              </div>
            </Card>
          </motion.div>
        </Col>
      </Row>
    </motion.div>
  );
};

export default UserDashboard;
