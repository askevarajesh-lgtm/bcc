import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Spin, Result, Typography } from "antd";
import QRCode from "qrcode";

const { Title } = Typography;

const QREmbedView = () => {
  const { qrId } = useParams();
  const [qrConfig, setQrConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrUrl, setQrUrl] = useState("");

  const resolveColor = (color) => {
    if (!color) return '#3b82f6';
    if (color === 'var(--accent-primary)') return '#3b82f6';
    if (color.startsWith('#')) return color;
    return '#3b82f6';
  };

  useEffect(() => {
    fetchQR();
  }, [qrId]);

  const fetchQR = async () => {
    try {
      const res = await fetch(`/api/qrs/${qrId}/public`);
      const data = await res.json();
      if (data.success && data.data) {
        setQrConfig(data.data);
      } else {
        setQrConfig(null);
      }
    } catch (err) {
      console.error(err);
      setQrConfig(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!qrConfig) return;

    const trackingUrl = qrConfig.scanLink;

    const fg = resolveColor(qrConfig.foreground);
    const bg = resolveColor(qrConfig.background);

    QRCode.toDataURL(trackingUrl, {
      width: 250,
      margin: 2,
      color: {
        dark: fg,
        light: bg
      }
    })
      .then(url => setQrUrl(url))
      .catch(err => console.error(err));
  }, [qrConfig]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", background: "transparent" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!qrConfig) {
    return (
      <Result
        status="404"
        title="QR Code Not Found"
      />
    );
  }

  const bg = resolveColor(qrConfig.background);
  const fg = resolveColor(qrConfig.foreground);
  const borderRadius = qrConfig.shape === 'Rounded' ? '24px' : '12px';

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      height: "100vh", 
      background: "transparent",
      fontFamily: "inherit"
    }}>
      <div style={{ 
        background: bg, 
        padding: 16, 
        borderRadius: borderRadius, 
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
        border: "1px solid #e2e8f0",
        display: "inline-block",
        textAlign: "center"
      }}>
        {qrUrl ? (
          <img src={qrUrl} alt={qrConfig.name} style={{ width: 180, height: 180, display: "block" }} />
        ) : (
          <Spin size="large" />
        )}
        <Title level={5} style={{ marginTop: 12, marginBottom: 0, fontWeight: 700, color: fg }}>
          {qrConfig.name}
        </Title>
      </div>
    </div>
  );
};

export default QREmbedView;
