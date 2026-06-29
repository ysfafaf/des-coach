import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api', // Sesuaikan dengan port server CI4 kamu
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;