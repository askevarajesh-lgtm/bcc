import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, Tag, Table, Card, Button, Skeleton, message } from 'antd';
import { Download, FileText, Calendar, CreditCard, Box, Zap, Shield, HelpCircle } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const BrandBillingTab = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  
  const [loading, setLoading] = useState(false);
  const [packageDetails, setPackageDetails] = useState(null);

  useEffect(() => {
    if (user && user.brandPackageDetails) {
      setPackageDetails(user.brandPackageDetails);
    }
  }, [user]);

  // Card styles
  const cardStyle = {
    background: isDark ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
    borderRadius: 16,
    padding: '24px',
    boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.02)',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  };

  const planAmount = packageDetails?.price || '0';
  const interval = packageDetails?.billingInterval || 'Monthly';
  
  // Estimate next billing date based on user creation date
  let nextBillingDate = dayjs(user?.createdAt).add(1, 'month');
  if (interval === 'Yearly') {
    nextBillingDate = dayjs(user?.createdAt).add(1, 'year');
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
          Subscription & Billing
        </Title>
        <Text style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Manage your workspace subscription, billing details, and payment methods.
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        {/* Current Plan Overview */}
        <Col span={24} md={16}>
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <Text style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: 1, textTransform: 'uppercase' }}>
                  CURRENT SUBSCRIPTION
                </Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                  <Title level={3} style={{ margin: 0, fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>
                    {packageDetails?.name || user?.packageName || 'Enterprise Package'}
                  </Title>
                  <Tag style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'none', borderRadius: 6, fontWeight: 700, padding: '2px 10px' }}>
                    Active
                  </Tag>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'baseline' }}>
                  ₹{Number(planAmount).toLocaleString()}
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginLeft: 4 }}>
                    /{interval === 'Yearly' ? 'yr' : 'mo'}
                  </span>
                </span>
              </div>
            </div>

            <div style={{ background: isDark ? 'rgba(0, 0, 0, 0.2)' : '#f8fafc', padding: 16, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Calendar size={14} color="var(--text-secondary)" />
                  <Text style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Next Payment Due</Text>
                </div>
                <Text style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {nextBillingDate.format('MMM DD, YYYY')}
                </Text>
              </div>
              <div style={{ width: 1, height: 40, background: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0' }}></div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <CreditCard size={14} color="var(--text-secondary)" />
                  <Text style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Payment Method</Text>
                </div>
                <Text style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Invoice via Email
                </Text>
              </div>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', gap: 12 }}>
              <Button 
                type="primary" 
                size="large" 
                style={{ fontWeight: 600, borderRadius: 8, background: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}
                onClick={() => message.info('Please contact your administrator to upgrade your package.')}
              >
                Upgrade Package
              </Button>
              <Button 
                size="large" 
                style={{ fontWeight: 600, borderRadius: 8, color: 'var(--text-secondary)' }}
                onClick={() => message.info('Please contact your administrator to modify or cancel your subscription.')}
              >
                Cancel Subscription
              </Button>
            </div>
          </div>
        </Col>

        {/* Features / Details */}
        <Col span={24} md={8}>
          <div style={cardStyle}>
            <Text style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16, display: 'block' }}>
              PACKAGE INCLUDES
            </Text>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ background: 'rgba(51, 149, 255, 0.1)', padding: 8, borderRadius: 8, color: '#3395FF' }}>
                  <Box size={18} />
                </div>
                <div>
                  <Text style={{ display: 'block', fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>User Licenses</Text>
                  <Text style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Up to {packageDetails?.userCount || 5} active team members</Text>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: 8, borderRadius: 8, color: '#10b981' }}>
                  <Zap size={18} />
                </div>
                <div>
                  <Text style={{ display: 'block', fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>Core Features</Text>
                  <Text style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Full access to workspace & analytics</Text>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: 8, borderRadius: 8, color: '#f59e0b' }}>
                  <Shield size={18} />
                </div>
                <div>
                  <Text style={{ display: 'block', fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>Priority Support</Text>
                  <Text style={{ color: 'var(--text-secondary)', fontSize: 13 }}>24/7 technical assistance</Text>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: 24 }}>
              <Button type="text" icon={<HelpCircle size={14} />} style={{ padding: 0, color: 'var(--accent-primary)', fontWeight: 600 }}>
                View full package details
              </Button>
            </div>
          </div>
        </Col>

        {/* Payment History */}
        <Col span={24}>
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                Billing History
              </Text>
              <Button icon={<Download size={14} />} style={{ borderRadius: 6, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Export
              </Button>
            </div>
            
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <FileText size={32} color="var(--text-tertiary)" style={{ marginBottom: 12, opacity: 0.5 }} />
              <Text style={{ display: 'block', fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>
                No past billing records found
              </Text>
              <Text style={{ display: 'block', fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>
                Your future invoices and receipts will appear here.
              </Text>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default BrandBillingTab;
