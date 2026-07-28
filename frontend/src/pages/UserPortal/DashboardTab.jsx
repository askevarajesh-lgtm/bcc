import React, { useState, useEffect } from 'react';
import { Typography, Card, Row, Col, Spin, Button, Modal, Tabs, Input, message } from 'antd';
import { motion } from 'framer-motion';
import { CheckSquare, Clock, AlertCircle, FileText } from 'lucide-react';
import { useGetTasksQuery } from '../../api/taskApi';
import { useGetTodayNoteQuery, useCreateOrUpdateTodayNoteMutation } from '../../api/notepadApi';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

const UserDashboard = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const { user } = useAuth();
  const isUserRole = user?.role === 'user';

  const { data: tasksData, isLoading } = useGetTasksQuery({ limit: 1000 });
  const tasks = tasksData?.data?.data || tasksData?.data?.tasks || [];

  const activeTasks = tasks.filter(t => !['COMPLETED', 'APPROVED', 'VALIDATED', 'DELIVERED', 'DONE', 'COMPLETE'].includes(t.status?.toUpperCase()));
  const today = dayjs().startOf('day');
  const nextWeek = dayjs().add(7, 'day').endOf('day');

  const dueThisWeekCount = activeTasks.filter(t => {
    if (!t.dueDate) return false;
    const due = dayjs(t.dueDate);
    return (due.isAfter(today) || due.isSame(today, 'day')) && due.isBefore(nextWeek);
  }).length;

  const overdueCount = activeTasks.filter(t => {
    if (!t.dueDate) return false;
    return dayjs(t.dueDate).isBefore(today, 'day');
  }).length;

  // Daily Reports State
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [noteContent, setNoteContent] = useState("");

  const { data: noteData, isLoading: isNoteLoading, refetch: refetchNote } = useGetTodayNoteQuery();
  const [createOrUpdateNote, { isLoading: isSavingNote }] = useCreateOrUpdateTodayNoteMutation();

  useEffect(() => {
    if (isReportModalVisible && noteData?.data?.note?.content) {
      setNoteContent(noteData.data.note.content);
    }
  }, [isReportModalVisible, noteData]);

  const handleSaveNote = async () => {
    const { error } = await createOrUpdateNote({ content: noteContent });
    if (error) {
      message.error(error.message || "Failed to save note");
    } else {
      message.success("Daily report saved successfully!");
      setIsReportModalVisible(false);
      refetchNote();
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <motion.div variants={itemVariants}>
          <Title level={2} style={{ margin: '0 0 8px 0', fontWeight: 800 }}>Welcome to your Dashboard</Title>
          <Text type="secondary" style={{ fontSize: 16 }}>Here is an overview of your active tasks and recent activities.</Text>
        </motion.div>

        <motion.div variants={itemVariants} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ padding: '4px 12px', border: '1px solid var(--border-color)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-container)' }}>
            <Text style={{ fontWeight: 500 }}>{dayjs().format('DD MMM YYYY')}</Text>
            <Clock size={16} color="var(--text-secondary)" />
          </div>
          {isUserRole && (
            <Button 
              type="primary" 
              danger 
              icon={<FileText size={16} />} 
              onClick={() => setIsReportModalVisible(true)}
              style={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}
            >
              Reports
            </Button>
          )}
        </motion.div>
      </div>

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
                  <Title level={3} style={{ margin: 0, fontWeight: 800 }}>
                    {isLoading ? <Spin size="small" /> : activeTasks.length}
                  </Title>
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
                  <Title level={3} style={{ margin: 0, fontWeight: 800 }}>
                    {isLoading ? <Spin size="small" /> : dueThisWeekCount}
                  </Title>
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
                  <Title level={3} style={{ margin: 0, fontWeight: 800 }}>
                    {isLoading ? <Spin size="small" /> : overdueCount}
                  </Title>
                </div>
              </div>
            </Card>
          </motion.div>
        </Col>
      </Row>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#cf1322', paddingBottom: 8 }}>
            <FileText size={18} />
            <span style={{ fontWeight: 600 }}>Daily Notepad</span>
          </div>
        }
        open={isReportModalVisible}
        onCancel={() => setIsReportModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsReportModalVisible(false)} style={{ borderRadius: 6 }}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            danger
            loading={isSavingNote}
            onClick={handleSaveNote}
            icon={<FileText size={14} />}
            style={{ borderRadius: 6, display: 'inline-flex', alignItems: 'center' }}
          >
            Save Note
          </Button>,
        ]}
        width={700}
        styles={{ header: { borderBottom: '1px solid #f0f0f0' } }}
      >
        <Tabs defaultActiveKey="note" tabBarStyle={{ marginBottom: 16 }}>
          <TabPane 
            tab={
              <span style={{ color: '#cf1322', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={16} /> Today's Note
              </span>
            } 
            key="note"
          >
            <Spin spinning={isNoteLoading}>
              <TextArea
                rows={12}
                placeholder="What did you work on today?"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                maxLength={5000}
                showCount
                style={{ borderRadius: 8, marginTop: 8 }}
              />
            </Spin>
          </TabPane>
          <TabPane 
            tab={
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckSquare size={16} /> Google Sheet
              </span>
            } 
            key="sheet"
          >
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Text>Google Sheet integration coming soon...</Text>
            </div>
          </TabPane>
        </Tabs>
      </Modal>

    </motion.div>
  );
};

export default UserDashboard;
