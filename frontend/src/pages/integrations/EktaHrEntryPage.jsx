import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Spin, Typography } from "antd";
import { useGetIntegrationsQuery } from "../../api/integrationApi";

const { Text } = Typography;

const EktaHrEntryPage = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useGetIntegrationsQuery();

  useEffect(() => {
    if (isLoading) return;
    const ektaIntegration = data?.data?.integrations?.find(
      (i) => i.type === "ekta",
    );
    if (ektaIntegration?._id) {
      navigate(`/settings/integrations/ekta/${ektaIntegration._id}`, {
        replace: true,
      });
    } else {
      navigate(`/settings/integrations/ekta/new`, { replace: true });
    }
  }, [data, isLoading, navigate]);

  return (
    <div style={{ padding: 24 }}>
      <Spin />
      <div style={{ marginTop: 12 }}>
        <Text type="secondary">Loading Ekta HR configuration...</Text>
      </div>
    </div>
  );
};

export default EktaHrEntryPage;
