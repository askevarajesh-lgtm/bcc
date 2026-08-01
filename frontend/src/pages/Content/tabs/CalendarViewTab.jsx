import React, { useState, useEffect } from 'react';
import { Typography, Card, Button, Spin, message } from 'antd';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { contentApi } from '../../../api/contentApi';
import { useContentModule } from '../ContentModuleContext';

const { Title, Text } = Typography;

const typeColors = {
  blog: 'var(--accent-primary)',
  social: '#0d9488',
  ad: '#f59e0b',
  email: '#8b5cf6',
  landing: '#ec4899'
};

const CalendarViewTab = ({ itemVariants }) => {
  const { refreshToken } = useContentModule();
  const [loading, setLoading] = useState(false);
  const [calendarData, setCalendarData] = useState({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isPlanning, setIsPlanning] = useState(false);

  useEffect(() => {
    const fetchCalendar = async () => {
      setLoading(true);
      try {
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        const res = await contentApi.getCalendar(month, year);
        if (res.success) {
          const eventsByDate = {};
          res.data.items.forEach(item => {
             const d = new Date(item.scheduledDate).getDate();
             if(!eventsByDate[d]) eventsByDate[d] = [];
             eventsByDate[d].push({ 
                title: item.title, 
                type: item.platform || 'Unknown', 
                color: typeColors[item.platform?.toLowerCase()] || '#10b981' 
             });
          });
          setCalendarData(eventsByDate);
        }
      } catch (error) {
        message.error('Failed to load calendar');
      } finally {
        setLoading(false);
      }
    };
    fetchCalendar();
  }, [currentDate, refreshToken]);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const today = () => setCurrentDate(new Date());

  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  
  // Generating a grid
  const days = [];
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  
  // empty cells before 1st
  for(let i = 0; i < firstDayOfMonth; i++) {
    days.push({ date: null, events: [] });
  }
  // days of month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ date: i, events: calendarData[i] || [] });
  }
  // remaining cells
  while (days.length % 7 !== 0) {
    days.push({ date: null, events: [] });
  }

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const handleAutoPlan = async () => {
    setIsPlanning(true);
    try {
      const res = await contentApi.generateContent({
        topic: 'Plan a month of content for this client based on the intake brief.',
        contentType: 'content-calendar-planner',
        tone: 'Professional'
      });
      if (res.success) {
        message.success({ content: 'Calendar Auto-Planned successfully! Awaiting Gate 1 Approval.', key: 'plan' });
        // Refresh calendar logic would go here
      } else {
        message.error({ content: 'Failed to auto-plan calendar', key: 'plan' });
      }
    } catch (error) {
      message.error({ content: 'Error connecting to Planner agent', key: 'plan' });
    } finally {
      setIsPlanning(false);
    }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}>
      <motion.div variants={itemVariants}>
        <Spin fullscreen spinning={isPlanning} tip="Running Content Calendar Planner agent..." size="large" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>{monthName}</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>Click a pill to open the detail drawer</Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button 
            type="primary"
            onClick={handleAutoPlan}
            style={{ background: 'linear-gradient(90deg, #8b5cf6, var(--accent-primary))', border: 'none', fontWeight: 600, boxShadow: 'var(--shadow-md)' }}
          >
            Auto-Plan Month
          </Button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-secondary)', padding: 4, borderRadius: 10, border: '1px solid var(--border-color)' }}>
              <Button type="text" onClick={prevMonth} icon={<ChevronLeft size={16} />} style={{ padding: '0 8px', height: 32 }} />
              <Button type="text" onClick={today} style={{ fontWeight: 600, padding: '0 12px', height: 32 }}>Today</Button>
              <Button type="text" onClick={nextMonth} icon={<ChevronRight size={16} />} style={{ padding: '0 8px', height: 32 }} />
            </div>
          </div>
        </div>

        <Card className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }} bodyStyle={{ padding: 0 }}>
          <Spin spinning={loading}>
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: 900 }}>
                {/* Header Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                  {daysOfWeek.map(day => (
                    <div key={day} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--text-secondary)', borderRight: '1px solid var(--border-color)' }}>
                      {day}
                    </div>
                  ))}
                </div>

                {/* Grid Rows */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(120px, auto)' }}>
                  {days.map((cell, i) => (
                    <div key={i} style={{ 
                      borderRight: (i + 1) % 7 !== 0 ? '1px solid var(--border-color)' : 'none', 
                      borderBottom: '1px solid var(--border-color)',
                      padding: 8,
                      background: cell.date === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() ? 'var(--bg-primary)' : 'transparent',
                      border: cell.date === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() ? '2px solid var(--accent-secondary)' : 'none',
                      margin: cell.date === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() ? -1 : 0,
                      zIndex: cell.date === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() ? 2 : 1,
                      position: 'relative'
                    }}>
                      {cell.date && <Text type="secondary" style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8, paddingLeft: 4 }}>{cell.date}</Text>}
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {cell.events.map((ev, idx) => (
                          <div key={idx} style={{ 
                            background: ev.color, 
                            color: '#fff', 
                            fontSize: 11, 
                            fontWeight: 600, 
                            padding: '4px 8px', 
                            borderRadius: 4, 
                            whiteSpace: 'nowrap', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis',
                            cursor: 'pointer'
                          }}>
                            {ev.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Spin>

          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { type: 'Blog', color: 'var(--accent-primary)' },
              { type: 'Social', color: '#0d9488' },
              { type: 'Ad Copy', color: '#f59e0b' },
              { type: 'Email', color: '#8b5cf6' },
              { type: 'Landing Page', color: '#ec4899' }
            ].map(l => (
              <div key={l.type} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color }} />
                <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>{l.type}</Text>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default CalendarViewTab;
