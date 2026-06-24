import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Form, Input, Select, Checkbox, Radio, DatePicker, Button, Typography, message, Result, Spin } from "antd";

const { Title, Text } = Typography;

const FormEmbedView = () => {
  const { formId } = useParams();
  const [formConfig, setFormConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchForm();
  }, [formId]);

  const fetchForm = async () => {
    try {
      const res = await fetch(`/api/forms/${formId}/public`);
      const data = await res.json();
      if (data.success && data.data) {
        setFormConfig(data.data);
      } else {
        setFormConfig(null);
      }
    } catch (err) {
      console.error(err);
      setFormConfig(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Inject custom head code if available
    if (formConfig && formConfig.settings?.customHeadCode) {
      const script = document.createElement("div");
      script.innerHTML = formConfig.settings.customHeadCode;
      document.head.appendChild(script);
      return () => { document.head.removeChild(script); };
    }
  }, [formConfig]);

  useEffect(() => {
    // Inject custom body code if available
    if (formConfig && formConfig.settings?.customBodyCode) {
      const script = document.createElement("div");
      script.innerHTML = formConfig.settings.customBodyCode;
      document.body.appendChild(script);
      return () => { document.body.removeChild(script); };
    }
  }, [formConfig]);

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/forms/${formId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        // Fire Meta Pixel if configured
        if (formConfig?.settings?.trackingPixels?.fireMetaLeadEvent && window.fbq) {
          window.fbq('track', 'Lead');
        }
      } else {
        message.error(data.error || "Failed to submit form.");
      }
    } catch (err) {
      message.error("An error occurred during submission.");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "transparent" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!formConfig) {
    return (
      <Result
        status="404"
        title="Form Not Found"
        subTitle="Sorry, the form you are looking for does not exist or has been disabled."
      />
    );
  }

  const { settings = {}, fields = [] } = formConfig;

  if (submitted) {
    return (
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 20px" }}>
        <Result
          status="success"
          title="Submission Successful!"
          subTitle={settings.successMessage || "Thank you — we received your submission."}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 20px", fontFamily: "inherit" }}>
      {settings.headline && (
        <Title level={2} style={{ textAlign: "center", marginBottom: 8, color: settings.accentColor || 'inherit' }}>
          {settings.headline}
        </Title>
      )}
      {settings.subHeadline && (
        <Text style={{ display: "block", textAlign: "center", marginBottom: 32, fontSize: 16, color: "#6b7280" }}>
          {settings.subHeadline}
        </Text>
      )}

      <Form form={form} layout="vertical" onFinish={onFinish}>
        {fields.map(field => (
          <Form.Item 
            key={field._id || field.id} 
            label={<span style={{ fontWeight: 600 }}>{field.label}</span>} 
            name={field.label} 
            rules={[{ required: field.required, message: `Please input your ${field.label}!` }]}
          >
            {field.type === 'Text Area' ? <Input.TextArea rows={4} placeholder={field.placeholder} /> :
             field.type === 'Select' ? <Select placeholder={field.placeholder} options={field.options?.map(o => ({label: o, value: o})) || []} /> :
             field.type === 'Checkbox Group' ? <Checkbox.Group options={field.options || []} /> :
             field.type === 'Radio Group' ? <Radio.Group options={field.options || []} /> :
             field.type === 'Date Field' ? <DatePicker style={{ width: '100%' }} /> :
             <Input size="large" placeholder={field.placeholder} />}
          </Form.Item>
        ))}
        
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={submitting}
            block 
            style={{ 
              height: 56, 
              borderRadius: 12, 
              backgroundColor: settings.accentColor || "#3b82f6", 
              border: 'none', 
              fontWeight: 800, 
              fontSize: 16 
            }}
          >
            {settings.submitButtonLabel || "Submit"}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default FormEmbedView;
