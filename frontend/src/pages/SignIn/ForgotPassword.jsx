import React, { useState, useEffect } from 'react';
import { Alert, Button, Card, Form, Input, message, Typography, Steps } from 'antd';
import { motion } from 'framer-motion';
import { Mail, Lock, KeyRound, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './SignIn.css';

const { Title, Text } = Typography;

const shellVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
  },
};

const renderPasswordIcon = (visible) => (
  <span className="bcc-signin-password-toggle" aria-hidden="true">
    {visible ? <EyeOff size={18} /> : <Eye size={18} />}
  </span>
);

const ForgotPassword = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  const [platformLogo, setPlatformLogo] = useState(null);
  const [platformLogoDark, setPlatformLogoDark] = useState(null);

  useEffect(() => {
    const fetchPlatformConfig = async () => {
      try {
        const res = await api.get('/superadmin/platform-config');
        if (res.data.success) {
          if (res.data.data.logo) setPlatformLogo(res.data.data.logo);
          if (res.data.data.logoDark) setPlatformLogoDark(res.data.data.logoDark);
        }
      } catch (err) {
        console.error("Could not load platform config:", err);
      }
    };
    fetchPlatformConfig();
  }, []);

  const handleSendOtp = async (values) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/forgot-password', { email: values.email });
      if (!res.data.success) {
        throw new Error(res.data.error || 'Failed to send OTP.');
      }
      setEmail(values.email);
      message.success(res.data.message || 'OTP Sent!');
      setCurrentStep(1);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (values) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/verify-otp', { email, otp: values.otp });
      if (!res.data.success) {
        throw new Error(res.data.error || 'Invalid OTP.');
      }
      setOtp(values.otp);
      message.success('OTP Verified');
      setCurrentStep(2);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (values) => {
    setLoading(true);
    setError('');
    if (values.password !== values.confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }
    try {
      const res = await api.post('/auth/reset-password', { email, otp, newPassword: values.password });
      if (!res.data.success) {
        throw new Error(res.data.error || 'Failed to reset password.');
      }
      message.success('Password successfully reset. You can now log in.');
      navigate('/signin');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bcc-signin-page" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex', minHeight: '100vh', width: '100vw' }}>
      <span className="bcc-signin-page__glow bcc-signin-page__glow--one" aria-hidden="true" />
      <span className="bcc-signin-page__glow bcc-signin-page__glow--two" aria-hidden="true" />
      <span className="bcc-signin-page__glow bcc-signin-page__glow--three" aria-hidden="true" />

      <motion.div variants={shellVariants} initial="hidden" animate="visible" style={{ width: '100%', maxWidth: 480, zIndex: 1, padding: 20 }}>
        <Card bordered={false} className="bcc-signin-card" styles={{ body: { padding: 0 } }}>
          <div className="bcc-signin-card__inner" style={{ width: '100%' }}>
            <motion.div variants={itemVariants} className="bcc-signin-brand">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, width: '100%' }}>
                <img 
                  src={isDark ? (platformLogoDark || platformLogo || '/logo-dark.png') : (platformLogo || platformLogoDark || '/logo-light.png')} 
                  alt="Logo" 
                  style={{ maxHeight: 64, objectFit: 'contain' }} 
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="bcc-signin-heading" style={{ marginBottom: 30, textAlign: 'center', width: '100%' }}>
              <Title level={3}>Reset Password</Title>
              <Text>
                {currentStep === 0 && "Enter your email to receive an OTP."}
                {currentStep === 1 && "Enter the 6-digit OTP sent to your email."}
                {currentStep === 2 && "Enter your new password below."}
              </Text>
            </motion.div>

            {error && (
              <motion.div variants={itemVariants} style={{ marginBottom: 20, width: '100%' }}>
                <Alert message={error} type="error" showIcon />
              </motion.div>
            )}

            <motion.div variants={itemVariants} style={{ width: '100%' }}>
              {currentStep === 0 && (
                <Form layout="vertical" onFinish={handleSendOtp} size="large" className="bcc-signin-form">
                  <Form.Item name="email" rules={[{ required: true, message: 'Please input your email!' }, { type: 'email', message: 'Enter a valid email!' }]}>
                    <Input prefix={<Mail size={18} className="bcc-signin-field__icon" />} placeholder="Enter registered email" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" block loading={loading} className="bcc-signin-submit">Send OTP</Button>
                </Form>
              )}

              {currentStep === 1 && (
                <Form layout="vertical" onFinish={handleVerifyOtp} size="large" className="bcc-signin-form">
                  <Form.Item name="otp" rules={[{ required: true, message: 'Please enter the OTP!' }]}>
                    <Input prefix={<KeyRound size={18} className="bcc-signin-field__icon" />} placeholder="6-digit OTP" maxLength={6} style={{ letterSpacing: '4px', textAlign: 'center', fontWeight: 'bold' }} />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" block loading={loading} className="bcc-signin-submit">Verify OTP</Button>
                </Form>
              )}

              {currentStep === 2 && (
                <Form layout="vertical" onFinish={handleResetPassword} size="large" className="bcc-signin-form">
                  <Form.Item name="password" rules={[{ required: true, message: 'Enter new password!' }, { min: 8, message: 'Minimum 8 characters!' }]}>
                    <Input.Password prefix={<Lock size={18} className="bcc-signin-field__icon" />} placeholder="New Password" iconRender={renderPasswordIcon} />
                  </Form.Item>
                  <Form.Item name="confirmPassword" rules={[{ required: true, message: 'Confirm new password!' }]}>
                    <Input.Password prefix={<Lock size={18} className="bcc-signin-field__icon" />} placeholder="Confirm Password" iconRender={renderPasswordIcon} />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" block loading={loading} className="bcc-signin-submit">Set New Password</Button>
                </Form>
              )}
              
              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <a href="/signin" style={{ fontSize: '0.875rem', color: 'var(--text-color-secondary)', textDecoration: 'none' }}>Back to Sign In</a>
              </div>
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
