import React, { useState, useEffect } from "react";
import { Tabs } from "antd";
import WorkflowTemplateManager from "./WorkflowTemplateManager";
import ProjectWorkflowAssignment from "./ProjectWorkflowAssignment";
import DigitalMarketingTeamSettings from "./DigitalMarketingTeamSettings";

const TaskSettings = () => {
  const [activeTab, setActiveTab] = useState("templates");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div style={{ width: "100%" }}>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type={isMobile ? "line" : "card"}
        size={isMobile ? "small" : "default"}
      >
        <Tabs.TabPane tab="Workflow Templates" key="templates">
          <WorkflowTemplateManager />
        </Tabs.TabPane>
        {/* Hiding Project Assignment tab as requested, preserving code */}
        {/* <Tabs.TabPane tab="Project Assignment" key="assignment">
          <ProjectWorkflowAssignment />
        </Tabs.TabPane> */}
        <Tabs.TabPane tab="Digital Marketing Team" key="dm-team">
          <DigitalMarketingTeamSettings />
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default TaskSettings;
