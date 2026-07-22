const fs = require('fs');

const updateTab = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add imports
  content = content.replace(/import \{ Typography[^}]*\} from 'antd';/, "import { Typography, Row, Col, Table, Button, Tag, Modal, Form, Input, Select, message, Drawer, Space, Card, Timeline } from 'antd';");
  
  // Add state and handlers
  if (!content.includes('const [drawerVisible, setDrawerVisible] = useState(false);')) {
    const stateRegex = /const \[selectedTicket, setSelectedTicket\] = useState\(null\);/;
    const newStates = `const [selectedTicket, setSelectedTicket] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [noteText, setNoteText] = useState('');

  const getStatusColor = (status) => {
    switch(status) {
      case 'Normal': return 'success';
      case 'At Risk': return 'warning';
      case 'Breached': return 'error';
      case 'Resolved': return 'blue';
      default: return 'default';
    }
  };

  const handleView = async (slaId) => {
    try {
      const res = await slaApi.getSlaById(slaId);
      setSelectedTicket(res.data);
      setDrawerVisible(true);
    } catch (error) {
      message.error('Failed to load ticket details');
    }
  };

  const handleEscalate = async (slaId) => {
    try {
      await slaApi.escalateSla(slaId);
      message.success('Ticket escalated successfully');
      fetchSupportTickets();
      if (selectedTicket && selectedTicket._id === slaId) handleView(slaId);
    } catch (error) {
      message.error('Failed to escalate ticket');
    }
  };

  const handleResolve = async (slaId) => {
    try {
      await slaApi.updateSla(slaId, { status: 'Resolved' });
      message.success('Ticket resolved successfully');
      fetchSupportTickets();
      if (selectedTicket && selectedTicket._id === slaId) handleView(slaId);
    } catch (error) {
      message.error('Failed to resolve ticket');
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim() || !selectedTicket) return;
    try {
      await slaApi.addSlaNote(selectedTicket._id, noteText);
      message.success('Note added successfully');
      setNoteText('');
      handleView(selectedTicket._id);
    } catch (error) {
      message.error('Failed to add note');
    }
  };`;
    content = content.replace(stateRegex, newStates);
  }

  // Update Action Button
  content = content.replace(/setSelectedTicket\(record\);\s*setViewTicketModalVisible\(true\);/, 'handleView(record.original._id);');

  // Replace Modal with Drawer
  const modalStart = /<Modal[\s\S]*?title=\{[\s\S]*?Ticket Details[\s\S]*?destroyOnClose\s*>/;
  const modalEnd = /<\/Modal>\s*<\/motion\.div>/;
  
  if (content.match(modalStart)) {
    const drawerContent = `
      <Drawer
        title={selectedTicket ? \`\${selectedTicket.slaId || 'Ticket'} Details\` : 'Ticket Details'}
        placement="right"
        width={500}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        className="glassmorphism-drawer"
      >
        {selectedTicket && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Card title="Overview" size="small" style={{ borderRadius: 12 }}>
              <p><strong>Title:</strong> {selectedTicket.title}</p>
              <p><strong>Trigger:</strong> {selectedTicket.triggerType}</p>
              <p><strong>Status:</strong> <Tag color={getStatusColor(selectedTicket.status)}>{selectedTicket.status}</Tag></p>
              <p><strong>Priority:</strong> <strong style={{ color: getPriorityColor(selectedTicket.priority) }}>{selectedTicket.priority}</strong></p>
              <p><strong>Due Date:</strong> {new Date(selectedTicket.dueDate).toLocaleString()}</p>
              <p><strong>Description:</strong> {selectedTicket.description}</p>
              <p><strong>Client:</strong> {selectedTicket.clientId?.name || 'N/A'}</p>
              <p><strong>Agency:</strong> {selectedTicket.agencyId?.name || 'N/A'}</p>
            </Card>
            
            <Card title="Actions" size="small" style={{ borderRadius: 12 }}>
              <Space wrap>
                {selectedTicket.status !== 'Resolved' && (
                  <>
                    <Button type="primary" style={{ background: 'var(--accent-success)', borderColor: 'var(--accent-success)' }} onClick={() => handleResolve(selectedTicket._id)}>Mark Resolved</Button>
                    <Button danger onClick={() => handleEscalate(selectedTicket._id)}>Escalate</Button>
                  </>
                )}
              </Space>
            </Card>

            <Card title="Notes" size="small" style={{ borderRadius: 12 }}>
              <div style={{ marginBottom: 16 }}>
                <Input.TextArea 
                  rows={2} 
                  placeholder="Add a note..." 
                  value={noteText} 
                  onChange={e => setNoteText(e.target.value)} 
                />
                <Button type="primary" size="small" style={{ marginTop: 8 }} onClick={handleAddNote}>Add Note</Button>
              </div>
              <Timeline style={{ marginTop: 16 }}>
                {selectedTicket.notes?.map((n, i) => (
                  <Timeline.Item key={i} color="blue">
                    <Typography.Text strong>{n.createdBy?.name || 'User'}</Typography.Text> <Typography.Text type="secondary" style={{ fontSize: 12 }}>{new Date(n.createdAt).toLocaleString()}</Typography.Text>
                    <p style={{ margin: '4px 0 0' }}>{n.text}</p>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>

            <Card title="Activity Timeline" size="small" style={{ borderRadius: 12 }}>
              <Timeline>
                <Timeline.Item color="gray">
                  <Typography.Text strong>Created</Typography.Text> <Typography.Text type="secondary" style={{ fontSize: 12 }}>{new Date(selectedTicket.createdAt).toLocaleString()}</Typography.Text>
                </Timeline.Item>
                {selectedTicket.activityTimeline?.map((act, i) => (
                  <Timeline.Item key={i} color="blue">
                    <Typography.Text strong>{act.action}</Typography.Text> - <Typography.Text type="secondary" style={{ fontSize: 12 }}>{new Date(act.createdAt).toLocaleString()}</Typography.Text>
                    <p style={{ margin: '4px 0 0' }}>{act.details}</p>
                  </Timeline.Item>
                ))}
                {selectedTicket.resolvedAt && (
                  <Timeline.Item color="green">
                    <Typography.Text strong>Resolved</Typography.Text> <Typography.Text type="secondary" style={{ fontSize: 12 }}>{new Date(selectedTicket.resolvedAt).toLocaleString()}</Typography.Text>
                  </Timeline.Item>
                )}
              </Timeline>
            </Card>
          </div>
        )}
      </Drawer>
    </motion.div>`;

    // Remove the old Modal
    const startIdx = content.search(modalStart);
    const endIdxStr = content.substring(startIdx);
    const endMatch = endIdxStr.match(modalEnd);
    
    if (startIdx !== -1 && endMatch) {
        content = content.substring(0, startIdx) + drawerContent + content.substring(startIdx + endMatch.index + endMatch[0].length);
    }
  }

  // Make sure viewTicketModalVisible is removed
  content = content.replace(/const \[viewTicketModalVisible, setViewTicketModalVisible\] = useState\(false\);\n?/, '');

  fs.writeFileSync(filePath, content);
};

updateTab('src/pages/ClientPortal/tabs/SupportTab.jsx');
updateTab('src/pages/AgencyPortal/tabs/SupportTab.jsx');
