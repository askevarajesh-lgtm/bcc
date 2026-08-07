import api from '../services/api';

export const getDashboardData = async (clientId, industry) => {
    let url = '/benchmark/dashboard?';
    if (clientId) url += `clientId=${clientId}&`;
    if (industry) url += `industry=${industry}`;
    const response = await api.get(url);
    return response.data;
};

export const getTableData = async (industry) => {
    let url = '/benchmark/table?';
    if (industry) url += `industry=${industry}`;
    const response = await api.get(url);
    return response.data;
};

export const getIndustries = async () => {
    const response = await api.get('/benchmark/industries');
    return response.data;
};

export const createBenchmark = async (data) => {
    const response = await api.post('/benchmark', data);
    return response.data;
};

export const syncData = async () => {
    const response = await api.post('/benchmark/sync');
    return response.data;
};
