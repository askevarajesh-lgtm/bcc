import { useAuth } from "../../contexts/AuthContext";
import React, { useState, useEffect, useMemo } from "react";
import { notifySuccess, notifyError } from '../../utils/notify';
import {
  Card,
  Tag,
  Select,
  Button,
  Space,
  message,
  Tooltip,
  Popconfirm,
  Empty,
  List,
  Typography,
  Divider,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useGetProjectsQuery } from "../../api/projectApi";
import {
  useGetAllWorkflowConfigsQuery,
  useCreateOrUpdateWorkflowConfigMutation,
} from "../../api/taskApi";
import { useGetDepartmentsDynamicQuery } from "../../api/accessControlApi";

const { Option } = Select;
const { Text, Title } = Typography;

const ProjectWorkflowAssignment = () => {
  const { data: projectsData, refetch: refetchProjects } =
    useGetProjectsQuery();
  const { data: allConfigsData, refetch: refetchConfigs } =
    useGetAllWorkflowConfigsQuery();
  const { data: departmentsResp } = useGetDepartmentsDynamicQuery();
  const [createOrUpdateWorkflow, { isLoading }] =
    useCreateOrUpdateWorkflowConfigMutation();

  const [isMobile, setIsMobile] = useState(false);
  const { user: user } = useAuth();
  const userRole = user?.role;
  const [expandedTemplates, setExpandedTemplates] = useState({});

  const projects =
    projectsData?.data?.data || projectsData?.data?.projects || [];
  const allConfigs = allConfigsData?.data?.configs || [];

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Get department templates (projectType templates without projectId)
  const departmentTemplates = allConfigs.filter(
    (config) => config.projectType && !config.projectId,
  );

  // Get project-specific workflows
  const projectWorkflows = allConfigs.filter(
    (config) => config.projectId && !config.projectType,
  );

  const departments = departmentsResp?.data?.departments || [];
  const departmentOptions = useMemo(() => {
    return departments
      .filter((d) => {
        // Hide "General" from non-admin/client roles
        if (d.slug === "general" || d.name?.toLowerCase() === "general") {
          return ["admin", "super_admin", "client"].includes(userRole);
        }
        return true;
      })
      .map((dept) => ({
        value: dept._id,
        label: dept.name,
        color: "#1890ff",
      }));
  }, [departments, userRole]);

  // Helper to get project type from project
  const getProjectType = (project) => {
    const websiteDeptId = departments.find(
      (d) => d.slug === "website-designing" || d.slug === "website-designing",
    )?._id;
    const seoDeptId = departments.find((d) => d.slug === "seo")?._id;
    const dmDeptId = departments.find(
      (d) => d.slug === "digital-marketing" || d.slug === "digital-marketing",
    )?._id;
    const techDeptId = departments.find(
      (d) => d.slug === "tech-team" || d.slug === "tech_team",
    )?._id;

    if (
      project.departments &&
      Array.isArray(project.departments) &&
      project.departments.length > 0
    ) {
      if (
        project.departments.includes(websiteDeptId) ||
        project.departments.includes("website-designing")
      )
        return websiteDeptId || "website-designing";
      if (
        project.departments.includes(seoDeptId) ||
        project.departments.includes("seo")
      )
        return seoDeptId || "seo";
      if (
        project.departments.includes(dmDeptId) ||
        project.departments.includes("digital-marketing")
      )
        return dmDeptId || "digital-marketing";
      if (
        project.departments.includes(techDeptId) ||
        project.departments.includes("tech_team")
      )
        return techDeptId || "tech_team";
    }

    const name = (project.name || "").toLowerCase();
    if (name.includes("bde") || name.includes("sales")) return "bde";
    if (name.includes("website") || name.includes("design"))
      return websiteDeptId || "website-designing";
    if (name.includes("seo")) return seoDeptId || "seo";
    if (name.includes("digital marketing"))
      return dmDeptId || "digital-marketing";

    return null;
  };

  // Get projects assigned to a template
  const getProjectsForTemplate = (template) => {
    // Get projects that match this template's department
    const matchingProjects = projects.filter((project) => {
      const projectType = getProjectType(project);
      return projectType === template.projectType;
    });

    // Separate into assigned and unassigned
    const assigned = [];
    const unassigned = [];

    matchingProjects.forEach((project) => {
      const projectSpecific = projectWorkflows.find(
        (w) =>
          w.projectId &&
          (w.projectId._id?.toString() === project._id.toString() ||
            w.projectId.toString() === project._id.toString()),
      );

      if (projectSpecific) {
        // Check if this project-specific workflow is based on this template
        const isBasedOnTemplate =
          projectSpecific.statuses?.length === template.statuses?.length &&
          projectSpecific.color === template.color;

        if (isBasedOnTemplate) {
          assigned.push(project);
        } else {
          unassigned.push(project);
        }
      } else {
        // No project-specific workflow, uses department template
        assigned.push(project);
      }
    });

    return { assigned, unassigned };
  };

  const handleAssignProject = async (template, projectId) => {
    try {
      const project = projects.find((p) => p._id === projectId);
      if (!project) {
        notifyError('workflow-assign', 'global', "Project not found");
        return;
      }

      // Create a project-specific workflow based on the template
      await createOrUpdateWorkflow({
        name: `${template.name} - ${project.name}`,
        projectId: project._id,
        projectType: null,
        color: template.color,
        statuses: template.statuses,
        isActive: true,
      }).unwrap();

      notifySuccess('workflow-assign', project._id || 'global', `Template assigned to ${project.name}`);
      refetchConfigs();
      refetchProjects();
    } catch (error) {
      notifyError('workflow-assign', projectId || 'global', error?.data?.message || "Failed to assign template");
    }
  };

  const handleRemoveAssignment = async (template, projectId) => {
    try {
      // Find and delete the project-specific workflow
      const projectWorkflow = projectWorkflows.find(
        (w) =>
          w.projectId &&
          (w.projectId._id?.toString() === projectId.toString() ||
            w.projectId.toString() === projectId.toString()),
      );

      if (projectWorkflow) {
        // TODO: Implement delete workflow config API endpoint
        message.info(
          "Remove assignment functionality will be implemented with delete API",
        );
        // For now, we'll need to add a delete endpoint
        refetchConfigs();
      }
    } catch (error) {
      notifyError('workflow-assign', projectId || 'global', "Failed to remove assignment");
    }
  };

  const toggleTemplate = (templateId) => {
    setExpandedTemplates((prev) => ({
      ...prev,
      [templateId]: !prev[templateId],
    }));
  };

  if (departmentTemplates.length === 0) {
    return (
      <Card
        title="Project Workflow Assignment"
        size={isMobile ? "small" : "default"}
      >
        <Empty
          description={
            <div>
              <Text
                type="secondary"
                style={{ fontSize: isMobile ? "12px" : "14px" }}
              >
                No workflow templates available. Please create templates in the
                "Workflow Templates" tab first.
              </Text>
            </div>
          }
        />
      </Card>
    );
  }

  return (
    <div style={{ width: "100%" }}>
      <Card
        title="Project Workflow Assignment"
        size={isMobile ? "small" : "default"}
      >
        <div
          style={{
            marginBottom: 24,
            color: "#666",
            fontSize: isMobile ? "12px" : "14px",
          }}
        >
          <Text type="secondary">
            Assign projects to workflow templates. Projects will follow the
            assigned template's status flow. Projects automatically use their
            department's template if not specifically assigned.
          </Text>
        </div>

        <Space direction="vertical" style={{ width: "100%" }} size="large">
          {departmentTemplates.map((template) => {
            const deptOption = departmentOptions.find(
              (o) => o.value === template.projectType,
            );
            const { assigned, unassigned } = getProjectsForTemplate(template);
            const isExpanded = expandedTemplates[template._id];
            const sortedStatuses = [...(template.statuses || [])].sort(
              (a, b) => a.order - b.order,
            );

            return (
              <Card
                key={template._id}
                size="small"
                style={{
                  borderLeft: `4px solid ${template.color || "#1890ff"}`,
                  backgroundColor: isExpanded
                    ? isMobile
                      ? "#fafafa"
                      : "#f9f9f9"
                    : undefined,
                }}
                title={
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "8px",
                    }}
                  >
                    <Space wrap>
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 4,
                          backgroundColor: template.color || "#1890ff",
                          border: "1px solid #d9d9d9",
                        }}
                      />
                      <Title level={5} style={{ margin: 0 }}>
                        {template.name}
                      </Title>
                      <Tag color={deptOption?.color || "default"}>
                        {deptOption?.label ||
                          template.projectType?.replace(/_/g, " ")}
                      </Tag>
                      <Tag color="blue">{assigned.length} Assigned</Tag>
                      {unassigned.length > 0 && (
                        <Tag color="orange">{unassigned.length} Available</Tag>
                      )}
                    </Space>
                    <Button
                      type="text"
                      size="small"
                      icon={isExpanded ? <CloseOutlined /> : <PlusOutlined />}
                      onClick={() => toggleTemplate(template._id)}
                    >
                      {isExpanded ? "Collapse" : "Expand"}
                    </Button>
                  </div>
                }
              >
                {/* Status Flow Preview */}
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ fontSize: isMobile ? "12px" : "13px" }}>
                    Status Flow:{" "}
                  </Text>
                  <Space wrap size={[4, 4]}>
                    {sortedStatuses.map((status, idx) => (
                      <Tag
                        key={idx}
                        color={status.color}
                        style={{
                          margin: 0,
                          fontSize: isMobile ? "10px" : "11px",
                        }}
                      >
                        {idx + 1}. {status.name}
                      </Tag>
                    ))}
                  </Space>
                </div>

                {isExpanded && (
                  <>
                    <Divider style={{ margin: "16px 0" }} />

                    {/* Assigned Projects */}
                    {assigned.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <Text
                          strong
                          style={{
                            fontSize: isMobile ? "12px" : "13px",
                            marginBottom: 8,
                            display: "block",
                          }}
                        >
                          Assigned Projects ({assigned.length})
                        </Text>
                        <List
                          size="small"
                          dataSource={assigned}
                          renderItem={(project) => (
                            <List.Item
                              style={{ padding: isMobile ? "8px 0" : "12px 0" }}
                              actions={[
                                <Popconfirm
                                  key="remove"
                                  title="Remove assignment? Project will use department template."
                                  onConfirm={() =>
                                    handleRemoveAssignment(
                                      template,
                                      project._id,
                                    )
                                  }
                                  okText="Yes"
                                  cancelText="No"
                                >
                                  <Button
                                    type="link"
                                    danger
                                    size="small"
                                    icon={<DeleteOutlined />}
                                  >
                                    Remove
                                  </Button>
                                </Popconfirm>,
                              ]}
                            >
                              <List.Item.Meta
                                title={
                                  <Space>
                                    {project.color && (
                                      <div
                                        style={{
                                          width: 12,
                                          height: 12,
                                          borderRadius: 2,
                                          backgroundColor: project.color,
                                          display: "inline-block",
                                        }}
                                      />
                                    )}
                                    <Text strong>{project.name}</Text>
                                    <Tag
                                      color="green"
                                      style={{
                                        fontSize: isMobile ? "10px" : "11px",
                                      }}
                                    >
                                      <CheckOutlined /> Assigned
                                    </Tag>
                                  </Space>
                                }
                                description={
                                  <Text
                                    type="secondary"
                                    style={{
                                      fontSize: isMobile ? "11px" : "12px",
                                    }}
                                  >
                                    {project.departments
                                      ?.map((d) => d.replace(/_/g, " "))
                                      .join(", ") || "No departments"}
                                  </Text>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      </div>
                    )}

                    {/* Available Projects to Assign */}
                    {unassigned.length > 0 && (
                      <div>
                        <Text
                          strong
                          style={{
                            fontSize: isMobile ? "12px" : "13px",
                            marginBottom: 8,
                            display: "block",
                          }}
                        >
                          Available Projects ({unassigned.length})
                        </Text>
                        <Select
                          placeholder="Select project to assign this template"
                          style={{ width: "100%" }}
                          onChange={(value) =>
                            handleAssignProject(template, value)
                          }
                          loading={isLoading}
                          size={isMobile ? "small" : "default"}
                          showSearch
                          filterOption={(input, option) =>
                            (option?.children || "")
                              .toLowerCase()
                              .includes(input.toLowerCase())
                          }
                        >
                          {unassigned.map((project) => (
                            <Option key={project._id} value={project._id}>
                              <Space>
                                {project.color && (
                                  <div
                                    style={{
                                      width: 12,
                                      height: 12,
                                      borderRadius: 2,
                                      backgroundColor: project.color,
                                      display: "inline-block",
                                    }}
                                  />
                                )}
                                {project.name}
                                <Tag style={{ fontSize: "10px" }}>
                                  {project.departments
                                    ?.map((d) => d.replace(/_/g, " "))
                                    .join(", ") || "No dept"}
                                </Tag>
                              </Space>
                            </Option>
                          ))}
                        </Select>
                      </div>
                    )}

                    {assigned.length === 0 && unassigned.length === 0 && (
                      <Empty
                        description={
                          <Text
                            type="secondary"
                            style={{ fontSize: isMobile ? "11px" : "12px" }}
                          >
                            No projects available for this department template
                          </Text>
                        }
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        style={{ padding: "20px 0" }}
                      />
                    )}
                  </>
                )}
              </Card>
            );
          })}
        </Space>
      </Card>
    </div>
  );
};

export default ProjectWorkflowAssignment;
