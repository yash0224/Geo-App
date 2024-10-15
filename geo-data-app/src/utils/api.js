import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080',  // Replace with your actual API base URL
});

api.interceptors.request.use((config) => {
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MjkwNjM1MzIsInVzZXJfaWQiOjE1fQ.8Tm0nlnC5meqImXbNSvxI0EIssLWIPY6HfgSmmQ9iLs";
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // Ensure "Bearer" is added before the token
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
