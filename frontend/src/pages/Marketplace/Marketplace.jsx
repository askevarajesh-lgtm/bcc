import React, { useState } from 'react';
import { Typography, Row, Col, Card, Button, Tabs, Tag } from 'antd';
import { motion } from 'framer-motion';
import { Search, BarChart2, FileText, CheckCircle2, Edit2, Eye, EyeOff, Plus, Play, Shield, Activity, Mail, FileCheck, Video, BookOpen } from 'lucide-react';
import SEOWorkspace from './SEOWorkspace';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const Marketplace = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

  const stats = [
    { label: 'PRODUCTS LISTED', value: '12', sub: 'Active across all categories', color: 'var(--text-primary)' },
    { label: 'REVENUE THIS MONTH', value: '₹1,84,000', sub: '+12%', subColor: 'var(--accent-primary)', color: 'var(--text-primary)' },
    { label: 'ORDERS THIS MONTH', value: '8', sub: '+3', subColor: 'var(--accent-primary)', color: 'var(--text-primary)' },
    { label: 'ACTIVE SUBSCRIPTIONS', value: '3', sub: 'Recurring revenue', color: 'var(--text-primary)' },
  ];

  const servicePackages = [
    {
      id: 1,
      title: 'SEO Starter Package',
      price: '₹25,000/mo',
      icon: <Search size={24} color="var(--accent-primary)" />,
      desc: 'Perfect for businesses starting their SEO journey. Includes technical audit, 10 keyword optimisations, monthly report.',
      bullets: ['Technical SEO audit', '10 target keywords', 'Monthly ranking report', '2 blog posts/month'],
      status: 'Active — Visible to clients',
      activeClients: 3
    },
    {
      id: 2,
      title: 'Ads Management — Starter',
      price: '₹35,000/mo + 10% ad spend',
      icon: <BarChart2 size={24} color="var(--accent-info)" />,
      desc: 'Google + Meta campaign management with weekly reporting.',
      bullets: ['Google Ads setup & management', 'Meta Ads management', 'Weekly performance reports', 'A/B testing (2 creatives/mo)'],
      status: 'Active — Visible to clients',
      activeClients: 5
    },
    {
      id: 3,
      title: 'Full-Service Marketing Retainer',
      price: '₹1,20,000/mo',
      icon: <FileText size={24} color="var(--accent-secondary)" />,
      desc: 'Complete marketing management: SEO, Ads, Social, Content.',
      bullets: ['All of the above', 'Social media (4 platforms)', 'Content calendar', 'Monthly strategy call'],
      status: 'Active — Visible to clients',
      activeClients: 8
    }
  ];

  const templates = [
    { icon: <Search size={16} />, title: 'Real Estate Lead Gen Funnel', price: '₹4,999', purchases: '642', rating: '4.9', tag: 'Funnel' },
    { icon: <FileText size={16} />, title: 'Agency Report Template — Premium', price: '₹2,999', purchases: '1,240', rating: '4.8', tag: 'Template' },
    { icon: <CheckCircle2 size={16} />, title: 'Site Visit Booking Form Pack', price: '₹1,999', purchases: '680', rating: '4.7', tag: 'Form' },
    { icon: <Play size={16} />, title: 'Real Estate Social Media Pack (30 posts)', price: '₹3,499', purchases: '420', rating: '4.9', tag: 'Social' },
    { icon: <Mail size={16} />, title: 'Real Estate Email Nurture Sequence', price: '₹2,499', purchases: '380', rating: '4.8', tag: 'Email' },
    { icon: <Activity size={16} />, title: '90-Day Marketing Playbook Template', price: '₹9,999', purchases: '284', rating: '4.9', tag: 'Strategy' },
  ];

  const addons = [
    { icon: <Shield size={28} color="var(--accent-info)" />, bg: 'rgba(59, 130, 246, 0.1)', title: 'AI Agent Pack (3 extra agents)', price: '₹4,999/mo', desc: 'Churn Predictor • Competitor Monitor • Lead Scorer' },
    { icon: <Globe size={28} color="var(--accent-primary)" />, bg: 'rgba(16, 185, 129, 0.1)', title: 'White-Label Portal', price: '₹2,999/mo per client', desc: 'Custom domain • Full branding per client' },
    { icon: <BarChart2 size={28} color="var(--accent-warning)" />, bg: 'rgba(245, 158, 11, 0.1)', title: 'Advanced Analytics', price: '₹3,999/mo', desc: 'Attribution modelling • Predictive analytics • Custom dashboards' },
  ];

  const reports = [
    { icon: <FileCheck size={24} />, title: 'Complete Website Audit Report', price: '₹8,000 one-time', desc: 'One-time purchase. Delivered in 3 days.', bullets: ['Technical SEO audit', 'Content gap analysis', 'Competitor benchmarking', 'Action plan & priorities'], status: 'Draft', activeClients: 0 },
    { icon: <BarChart2 size={24} />, title: 'Competitor Analysis Report', price: '₹5,000 one-time', desc: 'Identify top 3 competitors, keyword overlap, backlink profiles, social media strategy.', bullets: ['Top 3 competitors', 'Keyword overlap analysis', 'Backlink profile comparison', 'Social strategy tear-down'], status: 'Active', activeClients: 2 },
    { icon: <Search size={24} />, title: 'Keyword Research & Mapping', price: '₹6,500 one-time', desc: 'Comprehensive keyword discovery and mapping to target pages for your site.', bullets: ['Primary & secondary keywords', 'Search intent mapping', 'Content recommendations', 'Difficulty scoring'], status: 'Active', activeClients: 1 }
  ];

  const training = [
    { icon: <Video size={28} color="var(--accent-secondary)" />, bg: 'rgba(139, 92, 246, 0.1)', title: 'Agency Scaling Masterclass', price: '₹14,999', desc: 'Learn how to scale your agency to ₹1Cr/mo. Includes video lessons, templates, and SOPs.', format: 'Video Course', duration: '6 hours' },
    { icon: <BookOpen size={28} color="var(--accent-primary)" />, bg: 'rgba(16, 185, 129, 0.1)', title: 'Meta Ads Certification prep', price: '₹4,999', desc: 'Complete study guide and practice tests for the Meta Blueprint certification.', format: 'PDF + Quizzes', duration: 'Self-paced' },
  ];

  // Helper for Globe icon
  function Globe({ size, color }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>;
  }

  // Retail Tag Card Component
  const RetailTagCard = ({ children, style, bodyStyle }) => (
    <Card
      className="glassmorphism"
      bodyStyle={{ padding: '32px 24px', ...bodyStyle }}
      style={{
        borderRadius: '32px 32px 12px 12px',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
        background: 'var(--bg-secondary)',
        position: 'relative',
        ...style
      }}
    >
      {/* The Hole Punch */}
      <div style={{
        position: 'absolute',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 14,
        height: 14,
        borderRadius: '50%',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
      }} />
      {children}
    </Card>
  );

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} style={{ marginBottom: 32 }}>
        <Text type="secondary" style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5 }}>MARKETPLACE</Text>
        <Title level={2} style={{ margin: '4px 0 8px 0', fontWeight: 800 }}>SEO Workspace</Title>
      </motion.div>

      {/* SEO Workspace Content */}
      <motion.div variants={itemVariants} style={{ marginBottom: 48 }}>
        <SEOWorkspace />
      </motion.div>

    </motion.div>

  );
};

export default Marketplace;
