const Project = require("./project.model");
const Task = require("../tasks/task.model");
const Invoice = require("./shimInvoiceModel");
const ClientCompany = require("./shimProjectModel");
const User = require("./shimUserModel");
const { Service } = require("./shimOperationModel");
const { logAudit } = require("./shimAuditHelper");
const { createTimelineEvent } = require("./shimTimelineHelper");

/**
 * Auto-create projects from invoice when invoice status changes to 'sent' or 'paid'
 * Note: Manual project creation is allowed for draft invoices via the createProject endpoint
 * @param {String} invoiceId - Invoice ID
 * @param {String} tenantCompanyId - Tenant company ID
 */
const autoCreateProjectsFromInvoice = async (invoiceId, tenantCompanyId) => {
  const invoice = await Invoice.findById(invoiceId)
    .populate("clientId")
    .populate("companyId")
    .populate("salespersonId");

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  // Only auto-create projects for sent or paid invoices
  // Manual project creation from draft invoices is allowed via createProject endpoint
  if (!["sent", "paid"].includes(invoice.status)) {
    return {
      message:
        "Projects are only auto-created for sent or paid invoices. Draft invoices require manual project creation.",
    };
  }

  const createdProjects = [];

  for (let i = 0; i < invoice.items.length; i++) {
    const item = invoice.items[i];

    if (!item.serviceId) {
      continue; // Skip items without master item reference
    }

    // Fetch the master item manually
    const masterItem = await Service.findById(item.serviceId);

    if (!masterItem) {
      continue; // Skip if master item not found
    }

    const { getMilestoneWorkflowType } = require("./project.service");
    // Only create project for PACKAGE type items
    if (masterItem.itemType !== "PACKAGE") {
      continue;
    }

    // Check if project already exists for this invoice item
    const existingProject = await Project.findOne({
      invoiceId: invoice._id,
      invoiceItemId: i,
      tenantCompanyId,
    });

    if (existingProject) {
      continue; // Project already exists
    }

    // Auto-generate project name
    const clientCompany = invoice.clientId || invoice.companyId;
    const projectName = `${clientCompany.name} - ${masterItem.name} - ${invoice.invoiceNumber || "Draft"}`;

    // Digital Marketing / Content Tracking
    let numberOfPosters = masterItem.numberOfPosters || 0;
    let numberOfVideos = masterItem.numberOfVideos || 0;
    let numberOfShoots = masterItem.numberOfShoots || 0;

    // If it's a plan, extract counts from deliverables
    if (item.planId) {
      const { Plan } = require("./shimOperationModel");
      const plan = await Plan.findById(item.planId);
      if (plan && plan.deliverables) {
        const posterDeliv = plan.deliverables.find(
          (d) => d.type === "image" || d.type === "poster",
        );
        const videoDeliv = plan.deliverables.find((d) => d.type === "video");
        const shootDeliv = plan.deliverables.find((d) => d.type === "shoot");

        if (posterDeliv) numberOfPosters = posterDeliv.quantity;
        if (videoDeliv) numberOfVideos = videoDeliv.quantity;
        if (shootDeliv) numberOfShoots = shootDeliv.quantity;
      }
    }

    // Create project
    const project = await Project.create({
      name: projectName,
      description: masterItem.description || "",
      clientId: invoice.clientId?._id || invoice.companyId?._id,
      companyId: tenantCompanyId,
      createdBy: invoice.salespersonId?._id || invoice.createdBy?._id,
      status: "created",
      invoiceId: invoice._id,
      invoiceItemId: i,
      masterItemId: masterItem._id,
      planId: item.planId || null,
      billingType: item.billingType,
      invoiceType: invoice.type,
      invoiceDate: invoice.createdAt,
      departments: [masterItem.department],
      maxAllowedCorrections: masterItem.allowedCorrections || 2,
      correctionCount: 0,
      clientReview: {
        status: "pending",
      },
      milestoneWorkflowType: getMilestoneWorkflowType(masterItem.name),
      // Digital Marketing / Content Tracking
      numberOfPosters,
      numberOfVideos,
      numberOfShoots,
      remainingPosters: numberOfPosters,
      remainingVideos: numberOfVideos,
      remainingShoots: numberOfShoots,
    });

    // DO NOT auto-generate tasks here - tasks should only be created after workflow approval
    // Tasks will be created when project workflow is approved (see approveWorkflow endpoint in project.service.js)

    // Keep project status as 'created' - workflow needs to be sent and approved before tasks are allocated
    // Project status will be updated to 'in_progress' only after workflow approval and task creation

    // Log audit
    await logAudit({
      userId: invoice.salespersonId?._id || invoice.createdBy?._id,
      action: "project_auto_created",
      details: {
        projectId: project._id,
        invoiceId: invoice._id,
        invoiceItemId: i,
        masterItemId: masterItem._id,
      },
    });

    createdProjects.push(project);
  }

  return {
    message: `Created ${createdProjects.length} project(s) from invoice`,
    projects: createdProjects,
  };
};

/**
 * Auto-generate tasks from Master Item task templates
 * @param {String} projectId - Project ID
 * @param {Object} masterItem - Master Item document
 * @param {String} tenantCompanyId - Tenant company ID
 * @param {String} clientCompanyId - Client company ID
 * @param {String} createdByUserId - User ID who created the project
 */
const autoGenerateTasksFromMasterItem = async (
  projectId,
  masterItem,
  tenantCompanyId,
  clientCompanyId,
  createdByUserId,
) => {
  const Project = require("./project.model");
  const project = await Project.findById(projectId).populate("companyId");

  if (!project) {
    throw new Error("Project not found");
  }

  // Get project dates
  const projectStartDate = project.startDate
    ? new Date(project.startDate)
    : new Date();
  const projectEndDate = project.endDate
    ? new Date(project.endDate)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default to 30 days if no end date
  const projectDuration = projectEndDate.getTime() - projectStartDate.getTime();

  // Find all admin users in the tenant company (execution team members will be manually assigned)
  const adminUsers = await User.find({
    role: { $in: ["admin", "super_admin"] },
    companyId: tenantCompanyId,
    isActive: true,
  }).select("_id name email role");

  // Use only admin users for default assignment
  const assignedUsers = adminUsers.map((admin) => admin._id);
  const uniqueAssignedUsers = [
    ...new Set(assignedUsers.map((id) => id.toString())),
  ];

  if (!masterItem.taskTemplates || masterItem.taskTemplates.length === 0) {
    // No task templates - create default tasks for assigned users and admins
    if (uniqueAssignedUsers.length > 0) {
      const defaultTasks = [];
      const defaultTaskTitles = [
        "Project Setup & Planning",
        "Content Creation & Development",
        "Review & Quality Check",
        "Final Delivery & Handoff",
      ];

      // Get user details for better task naming
      const userDetails = await User.find({
        _id: { $in: uniqueAssignedUsers },
      }).select("name role");

      const userMap = new Map(userDetails.map((u) => [u._id.toString(), u]));

      for (let i = 0; i < uniqueAssignedUsers.length; i++) {
        const userId = uniqueAssignedUsers[i];
        const user = userMap.get(userId);
        const userRole = user?.role || "team_member";

        // Create meaningful task title based on user role and task index
        let taskTitle;
        if (uniqueAssignedUsers.length === 1) {
          // Single user - create a general project task
          taskTitle = `${masterItem.name || "Project"} - Main Task`;
        } else {
          // Multiple users - distribute default tasks
          const taskIndex = i % defaultTaskTitles.length;
          taskTitle = `${masterItem.name || "Project"} - ${defaultTaskTitles[taskIndex]}`;
        }

        // Calculate dates for this task (distribute across project duration)
        const taskProgress =
          uniqueAssignedUsers.length > 1
            ? i / (uniqueAssignedUsers.length - 1)
            : 0;
        const taskStartDate = new Date(
          projectStartDate.getTime() + projectDuration * taskProgress,
        );
        const taskDueDate = new Date(taskStartDate);
        taskDueDate.setDate(taskDueDate.getDate() + 7); // Default 7 days duration
        if (taskDueDate > projectEndDate) {
          taskDueDate.setTime(projectEndDate.getTime());
        }

        // Map master item department to valid task department
        const departmentMap = {
          digital_marketing: "digital-marketing",
          seo: "seo",
          graphic_designing: "website-designing", // Map graphic_designing to website_designing
          tech_team: "web-application-development", // Map tech_team to web_application_development
        };
        const taskDepartment =
          departmentMap[masterItem.department] || "website-designing"; // Default fallback

        const task = await Task.create({
          title: taskTitle,
          description: `Task assigned for ${masterItem.name || "project"} execution`,
          department: taskDepartment,
          projectId,
          companyId: clientCompanyId,
          tenantCompanyId,
          assignedTo: userId,
          assignedBy: createdByUserId,
          status: "assigned",
          startDate: taskStartDate,
          dueDate: taskDueDate,
          priority: "medium",
        });
        defaultTasks.push(task);

        await logAudit({
          userId: createdByUserId,
          action: "task_auto_created",
          details: {
            taskId: task._id,
            projectId,
            assignedTo: userId,
          },
        });
      }
      return defaultTasks;
    }
    return [];
  }

  const createdTasks = [];
  const taskMap = new Map(); // Map template index to created task

  // Calculate date range for task distribution (projectDuration already calculated above)
  const taskCount = masterItem.taskTemplates.length;

  // Create tasks in order (respecting dependencies)
  for (let i = 0; i < masterItem.taskTemplates.length; i++) {
    const template = masterItem.taskTemplates[i];

    // Distribute tasks across project date range
    const taskProgress = taskCount > 1 ? i / (taskCount - 1) : 0;
    const taskStartDate = new Date(
      projectStartDate.getTime() + projectDuration * taskProgress,
    );
    const taskDueDate = new Date(taskStartDate);

    // Add estimated hours to due date
    const estimatedHours = template.estimatedHours || 24;
    taskDueDate.setHours(taskDueDate.getHours() + estimatedHours);

    // Ensure due date doesn't exceed project end date
    if (taskDueDate > projectEndDate) {
      taskDueDate.setTime(projectEndDate.getTime());
    }

    // Find assigned user based on role or execution team
    let assignedTo = null;
    if (template.assignedRole === "client") {
      // Client tasks - leave unassigned for now
      assignedTo = null;
    } else {
      // Priority 1: Try to find user by role first (if role matches)
      assignedTo = await findUserByRole(template.assignedRole, tenantCompanyId);

      // Priority 2: If no user found by role, assign to admins in round-robin
      if (!assignedTo && uniqueAssignedUsers.length > 0) {
        const userIndex = i % uniqueAssignedUsers.length;
        assignedTo = { _id: uniqueAssignedUsers[userIndex] };
      }
    }

    // Find dependent tasks
    const dependsOnTasks = (template.dependsOn || [])
      .map((depIndex) => taskMap.get(depIndex))
      .filter(Boolean);

    // Determine task status
    let taskStatus = "created";
    if (template.assignedRole === "client") {
      taskStatus = "created"; // Client tasks start as created
    } else if (assignedTo) {
      taskStatus = "assigned"; // Internal tasks with assignee
    }

    // Map master item department to valid task department
    const departmentMap = {
      digital_marketing: "digital-marketing",
      seo: "seo",
      graphic_designing: "website-designing", // Map graphic_designing to website_designing
      tech_team: "web-application-development", // Map tech_team to web_application_development
    };
    const taskDepartment =
      departmentMap[masterItem.department] || "website-designing"; // Default fallback

    // Create task
    const task = await Task.create({
      title: template.title,
      description: template.description || "",
      department: taskDepartment,
      projectId,
      companyId: clientCompanyId,
      tenantCompanyId,
      assignedTo: assignedTo?._id || createdByUserId, // Fallback to project creator if no assignee
      assignedBy: createdByUserId,
      status: taskStatus,
      taskType: template.taskType,
      postingPlatform: template.postingPlatform || null,
      dependsOn: dependsOnTasks.map((t) => t._id),
      requiresClientReview: template.taskType === "client_review",
      startDate: taskStartDate,
      dueDate: taskDueDate,
      priority: "medium",
    });

    taskMap.set(i, task);
    createdTasks.push(task);

    // Create timeline event for task creation
    try {
      await createTimelineEvent({
        eventType: "task_created",
        entityType: "Task",
        entityId: task._id,
        performedByUserId: createdByUserId,
        description: `Task "${template.title}" created and assigned${assignedTo ? ` to ${assignedTo.name}` : ""}`,
        metadata: {
          taskId: task._id.toString(),
          taskTitle: template.title,
          projectId: projectId.toString(),
          taskType: template.taskType,
          assignedTo: assignedTo ? assignedTo._id.toString() : null,
          assignedToName: assignedTo ? assignedTo.name : null,
          department: taskDepartment,
        },
        companyId: tenantCompanyId,
      });
    } catch (timelineError) {
      console.error(
        "[Project Auto] Failed to create timeline event for task:",
        timelineError,
      );
      // Don't throw - timeline failure shouldn't break task creation
    }

    // Log audit
    await logAudit({
      userId: createdByUserId,
      action: "task_auto_created",
      details: {
        taskId: task._id,
        projectId,
        templateIndex: i,
        taskType: template.taskType,
      },
    });
  }

  // If there are admins not assigned to any task, create a general project task for them
  if (uniqueAssignedUsers.length > createdTasks.length) {
    const unassignedUsers = uniqueAssignedUsers.filter((userId) => {
      return !createdTasks.some(
        (task) => task.assignedTo?.toString() === userId.toString(),
      );
    });

    // Get user details for better task naming
    const userDetails = await User.find({
      _id: { $in: unassignedUsers },
    }).select("name role");

    const userMap = new Map(userDetails.map((u) => [u._id.toString(), u]));

    for (let i = 0; i < unassignedUsers.length; i++) {
      const userId = unassignedUsers[i];
      const user = userMap.get(userId);

      // Create meaningful task title
      const taskTitle = `${masterItem.name || "Project"} - Support & Coordination`;

      // Calculate dates for this task (distribute across remaining project duration)
      const remainingDuration =
        projectEndDate.getTime() - projectStartDate.getTime();
      const taskProgress =
        unassignedUsers.length > 1 ? i / (unassignedUsers.length - 1) : 0;
      const taskStartDate = new Date(
        projectStartDate.getTime() + remainingDuration * taskProgress,
      );
      const taskDueDate = new Date(taskStartDate);
      taskDueDate.setDate(taskDueDate.getDate() + 7); // Default 7 days duration
      if (taskDueDate > projectEndDate) {
        taskDueDate.setTime(projectEndDate.getTime());
      }

      // Map master item department to valid task department
      const departmentMap = {
        digital_marketing: "digital-marketing",
        seo: "seo",
        graphic_designing: "website-designing", // Map graphic_designing to website_designing
        tech_team: "web-application-development", // Map tech_team to web_application_development
      };
      const taskDepartment =
        departmentMap[masterItem.department] || "website-designing"; // Default fallback

      const task = await Task.create({
        title: taskTitle,
        description: `Support and coordination task for ${masterItem.name || "project"}`,
        department: taskDepartment,
        projectId,
        companyId: clientCompanyId,
        tenantCompanyId,
        assignedTo: userId,
        assignedBy: createdByUserId,
        status: "assigned",
        startDate: taskStartDate,
        dueDate: taskDueDate,
        priority: "medium",
      });
      createdTasks.push(task);

      await logAudit({
        userId: createdByUserId,
        action: "task_auto_created",
        details: {
          taskId: task._id,
          projectId,
          assignedTo: userId,
        },
      });
    }
  }

  return createdTasks;
};

/**
 * Find user by role in tenant company
 * @param {String} role - User role
 * @param {String} tenantCompanyId - Tenant company ID
 * @returns {Object|null} User document or null
 */
const findUserByRole = async (role, tenantCompanyId) => {
  // Map template roles to user roles
  const roleMap = {
    digital_marketing_executive: "digital_marketing_manager",
    designer: "designer",
    editor: "editor",
    developer: "developer",
    operations_head: "operations_head",
  };

  const userRole = roleMap[role] || role;

  const user = await User.findOne({
    role: userRole,
    companyId: tenantCompanyId,
    isActive: true,
  });

  return user;
};

/**
 * Find client primary contact (for future implementation)
 * @param {String} clientCompanyId - Client company ID
 * @returns {Object|null} User document or null
 */
const findClientPrimaryContact = async (clientCompanyId) => {
  // TODO: Implement client user assignment
  // For now, return null - tasks will be assigned manually
  return null;
};

module.exports = {
  autoCreateProjectsFromInvoice,
  autoGenerateTasksFromMasterItem,
  findUserByRole,
};
