import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Typography, Row, Col, Card, Button, Tabs, Tag, message } from 'antd';
import { motion } from 'framer-motion';
import { Search, BarChart2, FileText, CheckCircle2, Edit2, Eye, EyeOff, Plus, Play, Shield, Activity, Mail, FileCheck, Video, BookOpen, ArrowRight } from 'lucide-react';
import Content from '../Content/Content';
import AIStudio from '../AIStudio/AIStudio';
import MarketplaceSEO from './SEO/MarketplaceSEO';
import { useAuth } from '../../contexts/AuthContext';
import { useGetMarketplacePurchasesQuery, useInitiatePurchaseMutation, useVerifyPurchaseMutation } from '../../api/marketplaceApi';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const Marketplace = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth();
  const isAgencyRole = ['agency_super_admin', 'agency_manager', 'agency'].includes(role);

  const getActiveMarketplaceTab = () => {
    if (location.pathname.includes('/marketplace/content')) return '2';
    if (location.pathname.includes('/marketplace/ai-studio') || location.pathname.includes('/marketplace/aistudio')) return '3';
    return '1';
  };

  const handleMarketplaceTabChange = (key) => {
    const isClient = location.pathname.startsWith('/client');
    const prefix = isClient ? '/client/marketplace' : '/agency/marketplace';
    if (key === '1') navigate(`${prefix}/seo/dashboard`);
    else if (key === '2') navigate(`${prefix}/content`);
    else if (key === '3') navigate(`${prefix}/ai-studio`);
  };

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

  const { data: purchasesData, refetch: refetchPurchases } = useGetMarketplacePurchasesQuery();
  const [initiatePurchase] = useInitiatePurchaseMutation();
  const [verifyPurchase] = useVerifyPurchaseMutation();

  const [purchasingPlan, setPurchasingPlan] = useState(null);
  const [mockPurchased, setMockPurchased] = useState([]);

  const purchasedPlans = React.useMemo(() => {
    const plans = { seo: false, content: false, design: false };
    if (purchasesData?.data?.modules) {
      purchasesData.data.modules.forEach(m => {
        plans[m] = true;
      });
    }
    mockPurchased.forEach(m => plans[m] = true);
    return plans;
  }, [purchasesData, mockPurchased]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePurchase = async (plan, amountInInr) => {
    // TEMPORARY MOCK FLOW
    setPurchasingPlan(plan);
    setTimeout(() => {
      setMockPurchased(prev => [...prev, plan]);
      message.success("Payment successful! Module unlocked.");
      setPurchasingPlan(null);
    }, 3000);

    /* --- ORIGINAL PAYMENT INTEGRATION (UNDER DEVELOPMENT) ---
    try {
      const res = await loadRazorpayScript();
      if (!res) {
        message.error("Razorpay SDK failed to load. Are you online?");
        return;
      }

      // Initiate order
      const { data: orderData, error: initiateError } = await initiatePurchase({ moduleName: plan, amount: amountInInr });
      if (initiateError) {
        throw new Error(initiateError.data?.message || "Failed to initiate purchase");
      }

      const { orderId, amount, currency, keyId } = orderData.data;

      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: "Marketplace Module",
        description: `Purchase for ${plan.toUpperCase()} Module`,
        order_id: orderId,
        handler: async function (response) {
          try {
            const verifyRes = await verifyPurchase({
              moduleName: plan,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyRes.error) {
              throw new Error(verifyRes.error.data?.message || "Payment verification failed");
            }

            message.success("Payment successful! Module unlocked.");
            refetchPurchases();
          } catch (err) {
            message.error(err.message);
          }
        },
        prefill: {
          name: "M1 Labs User",
          email: "user@example.com",
        },
        theme: {
          color: "var(--accent-primary)",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (err) {
      message.error(err.message || "Something went wrong during checkout");
    }
    ---------------------------------------------------------- */
  };

  const PricingCard = ({ title, subtitle, price, features, onPurchase, loading }) => {
    const gradId = `flowerGrad-${title.replace(/\s+/g, '')}`;

    return (
      <div style={{
        padding: '60px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh',
      }}>
        <Card 
          className="glassmorphism"
          style={{ 
            maxWidth: 420, 
            width: '100%', 
            borderRadius: 24, 
            boxShadow: 'var(--shadow-md, 0 10px 40px rgba(0,0,0,0.1))',
            border: '1px solid var(--border-color, rgba(0,0,0,0.05))',
            background: 'var(--bg-secondary, #FDFCF7)', // Adapts to theme
            position: 'relative',
            overflow: 'hidden'
          }} 
          bodyStyle={{ padding: '40px 32px' }}
        >
          {/* Decorative Flower Star on top right */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 160,
            height: 160,
            zIndex: 0,
            pointerEvents: 'none',
            transform: 'translate(20%, -20%)'
          }}>
            <svg viewBox="0 0 100 100" width="100%" height="100%">
              <defs>
                <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFA07A" />
                  <stop offset="30%" stopColor="#FF69B4" />
                  <stop offset="70%" stopColor="#DA70D6" />
                  <stop offset="100%" stopColor="#FFD700" />
                </linearGradient>
              </defs>
              <path d="M50 10 C 60 10, 65 20, 70 25 C 80 20, 90 25, 90 35 C 90 40, 85 45, 80 50 C 85 55, 90 60, 90 70 C 90 80, 80 85, 70 80 C 65 85, 60 95, 50 95 C 40 95, 35 85, 30 80 C 20 85, 10 80, 10 70 C 10 60, 15 55, 20 50 C 15 45, 10 40, 10 35 C 10 25, 20 20, 30 25 C 35 20, 40 10, 50 10 Z" fill={`url(#${gradId})`} opacity="0.9" />
              {/* Inner star matches the card's adaptive background */}
              <path d="M50 28 Q 50 50 28 50 Q 50 50 50 72 Q 50 50 72 50 Q 50 50 50 28 Z" fill="var(--bg-secondary, #FDFCF7)" />
            </svg>
          </div>

          {/* Card Content - elevated above background */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            
            <div style={{ 
              display: 'inline-block',
              borderRadius: 20, 
              padding: '6px 16px', 
              background: 'var(--bg-primary, #FFFFFF)', 
              color: 'var(--text-primary, #333)',
              border: '1px solid var(--border-color, transparent)',
              fontWeight: 500,
              fontSize: '13px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              marginBottom: 32
            }}>
              {price} USD / month
            </div>

            <Title level={2} style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary, #111)', fontSize: '28px' }}>
              {title}
            </Title>
            <Text style={{ display: 'block', marginTop: 6, marginBottom: 32, fontSize: '15px', color: 'var(--text-secondary, #A09D96)' }}>
              {subtitle}
            </Text>
            
            <Text style={{ display: 'block', marginBottom: 20, color: 'var(--text-secondary, #A09D96)', fontSize: '13px' }}>
              What's included:
            </Text>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {features.map((feature, idx) => (
                 <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ marginTop: 2 }}>
                       {/* Small bold icons adaptive to theme */}
                       {idx === 0 && <CheckCircle2 size={18} color="var(--text-primary, #111)" strokeWidth={2.5} />}
                       {idx === 1 && <BarChart2 size={18} color="var(--text-primary, #111)" strokeWidth={2.5} />}
                       {idx === 2 && <Shield size={18} color="var(--text-primary, #111)" strokeWidth={2.5} />}
                       {idx > 2 && <Activity size={18} color="var(--text-primary, #111)" strokeWidth={2.5} />}
                    </div>
                    <Text style={{ fontSize: '14px', color: 'var(--text-primary, #222)', fontWeight: 500 }}>
                      {feature}
                    </Text>
                 </div>
              ))}
            </div>

            <Text style={{ display: 'block', marginTop: 32, marginBottom: 8, color: 'var(--text-secondary, #A09D96)', fontSize: '13px' }}>
              Ready to start?
            </Text>
            
            <div style={{ 
              padding: '6px 6px 6px 16px', 
              background: 'var(--bg-primary, #EAE8E1)', 
              borderRadius: 12, 
              border: '1px solid var(--border-color, transparent)',
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                 <Shield size={14} color="var(--text-secondary, #666)" />
                 <Text style={{ fontSize: '13px', color: 'var(--text-secondary, #666)', fontWeight: 500 }}>Secure Access</Text>
              </div>
              <Button 
                type="primary" 
                loading={loading}
                style={{ 
                  borderRadius: 8, 
                  fontWeight: 600,
                  padding: '0 20px',
                  height: 38
                }} 
                onClick={onPurchase}
              >
                Purchase
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} style={{ marginBottom: 32 }}>
        <Title level={2} style={{ margin: '4px 0 0 0', fontWeight: 900 }}>Marketplace</Title>
      </motion.div>

      <Tabs activeKey={getActiveMarketplaceTab()} onChange={handleMarketplaceTabChange} style={{ marginTop: 16 }}>
        <TabPane tab="SEO" key="1">
          <motion.div variants={itemVariants} style={{ marginBottom: 48, marginTop: 16 }}>
            {purchasedPlans.seo ? (
              <MarketplaceSEO />
            ) : (
              <PricingCard 
                title="SEO & AEO Agent" 
                subtitle="Unlock full access to AI-powered SEO tools and automated audits." 
                price="25" 
                features={[
                  "Complete SEO & AEO Toolkit", 
                  "Automated Technical Audits", 
                  "AI Keyword Strategy Builder", 
                  "Competitor Analysis & Reporting"
                ]}
                onPurchase={() => handlePurchase('seo', 2075)} 
                loading={purchasingPlan === 'seo'}
              />
            )}
          </motion.div>
        </TabPane>
        <TabPane tab="Content" key="2">
          <motion.div variants={itemVariants} style={{ marginBottom: 48, marginTop: 16 }}>
            {purchasedPlans.content ? (
              <Content />
            ) : (
              <PricingCard 
                title="Content Agent" 
                subtitle="Supercharge your content pipeline with generative AI and publishing." 
                price="20" 
                features={[
                  "End-to-End Content Pipeline", 
                  "AI Article Generation", 
                  "Content Calendar & Planning", 
                  "1-Click CMS Publishing"
                ]}
                onPurchase={() => handlePurchase('content', 1660)} 
                loading={purchasingPlan === 'content'}
              />
            )}
          </motion.div>
        </TabPane>
        <TabPane tab="AI Studio" key="3">
          <motion.div variants={itemVariants} style={{ marginBottom: 48, marginTop: 16 }}>
            {purchasedPlans.design ? (
              <AIStudio />
            ) : (
              <PricingCard 
                title="Design Agent" 
                subtitle="Generate high-quality visual assets powered by generative AI." 
                price="20" 
                features={[
                  "AI Image & Visual Generation", 
                  "High-Quality Design Exports", 
                  "Asset Library & Organization", 
                  "Video Generation Tools"
                ]}
                onPurchase={() => handlePurchase('design', 1660)} 
                loading={purchasingPlan === 'design'}
              />
            )}
          </motion.div>
        </TabPane>
      </Tabs>

    </motion.div>

  );
};

export default Marketplace;
