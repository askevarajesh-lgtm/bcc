const axios = require('axios');

const getBasicAuthToken = () => {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  
  if (!login || !password) {
    console.warn('DataForSEO credentials missing from environment variables');
    return null;
  }

  return Buffer.from(`${login}:${password}`).toString('base64');
};

const dataForSeoClient = axios.create({
  baseURL: 'https://api.dataforseo.com/v3',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to add auth header
dataForSeoClient.interceptors.request.use((config) => {
  const token = getBasicAuthToken();
  if (token) {
    config.headers['Authorization'] = `Basic ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

module.exports = dataForSeoClient;
