import api from './api';

const PREFIX = '/hrms';

export const hrmsService = {
  // Employees
  getEmployees: async (params) => {
    const response = await api.get(`${PREFIX}/employees`, { params });
    return response.data;
  },
  getEmployee: async (id) => {
    const response = await api.get(`${PREFIX}/employees/${id}`);
    return response.data;
  },
  createEmployee: async (data) => {
    const response = await api.post(`${PREFIX}/employees`, data);
    return response.data;
  },
  updateEmployee: async (id, data) => {
    const response = await api.put(`${PREFIX}/employees/${id}`, data);
    return response.data;
  },
  deleteEmployee: async (id) => {
    const response = await api.delete(`${PREFIX}/employees/${id}`);
    return response.data;
  },

  // Departments
  getDepartments: async () => {
    const response = await api.get(`${PREFIX}/departments`);
    return response.data;
  },
  createDepartment: async (data) => {
    const response = await api.post(`${PREFIX}/departments`, data);
    return response.data;
  },

  // Designations
  getDesignations: async () => {
    const response = await api.get(`${PREFIX}/designations`);
    return response.data;
  },
  createDesignation: async (data) => {
    const response = await api.post(`${PREFIX}/designations`, data);
    return response.data;
  },

  // Attendance
  getAttendances: async (params) => {
    const response = await api.get(`${PREFIX}/attendance`, { params });
    return response.data;
  },
  clockIn: async (data) => {
    const response = await api.post(`${PREFIX}/attendance/clock-in`, data);
    return response.data;
  },
  clockOut: async (data) => {
    const response = await api.post(`${PREFIX}/attendance/clock-out`, data);
    return response.data;
  },

  // Leaves
  getLeaves: async (params) => {
    const response = await api.get(`${PREFIX}/leaves`, { params });
    return response.data;
  },
  applyLeave: async (data) => {
    const response = await api.post(`${PREFIX}/leaves`, data);
    return response.data;
  },
  updateLeaveStatus: async (id, data) => {
    const response = await api.put(`${PREFIX}/leaves/${id}/status`, data);
    return response.data;
  },

  // Payroll
  getPayrolls: async (params) => {
    const response = await api.get(`${PREFIX}/payroll`, { params });
    return response.data;
  },
  generatePayroll: async (data) => {
    const response = await api.post(`${PREFIX}/payroll`, data);
    return response.data;
  },
  updatePayrollStatus: async (id, data) => {
    const response = await api.put(`${PREFIX}/payroll/${id}/status`, data);
    return response.data;
  },

  // Performance
  getPerformances: async (params) => {
    const response = await api.get(`${PREFIX}/performance`, { params });
    return response.data;
  },
  createPerformanceReview: async (data) => {
    const response = await api.post(`${PREFIX}/performance`, data);
    return response.data;
  },
  updatePerformanceReview: async (id, data) => {
    const response = await api.put(`${PREFIX}/performance/${id}`, data);
    return response.data;
  },

  // Recruitment
  getRecruitments: async (params) => {
    const response = await api.get(`${PREFIX}/recruitment`, { params });
    return response.data;
  },
  createRecruitment: async (data) => {
    const response = await api.post(`${PREFIX}/recruitment`, data);
    return response.data;
  },
  addCandidate: async (id, data) => {
    const response = await api.post(`${PREFIX}/recruitment/${id}/candidates`, data);
    return response.data;
  },
  updateCandidateStatus: async (id, candidateId, data) => {
    const response = await api.put(`${PREFIX}/recruitment/${id}/candidates/${candidateId}`, data);
    return response.data;
  },

  // Training
  getTrainings: async (params) => {
    const response = await api.get(`${PREFIX}/training`, { params });
    return response.data;
  },
  createTraining: async (data) => {
    const response = await api.post(`${PREFIX}/training`, data);
    return response.data;
  },
  updateTrainingProgress: async (id, data) => {
    const response = await api.put(`${PREFIX}/training/${id}/progress`, data);
    return response.data;
  },

  // Assets
  getAssets: async (params) => {
    const response = await api.get(`${PREFIX}/assets`, { params });
    return response.data;
  },
  createAsset: async (data) => {
    const response = await api.post(`${PREFIX}/assets`, data);
    return response.data;
  },
  assignAsset: async (id, data) => {
    const response = await api.put(`${PREFIX}/assets/${id}/assign`, data);
    return response.data;
  },
  returnAsset: async (id, data) => {
    const response = await api.put(`${PREFIX}/assets/${id}/return`, data);
    return response.data;
  },

  // Analytics
  getDashboardStats: async () => {
    const response = await api.get(`${PREFIX}/analytics/stats`);
    return response.data;
  }
};
