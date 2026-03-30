import axios from 'axios';
import { getAuth } from 'firebase/auth';

const axiosClient = axios.create({
  baseURL: '/api',
});

axiosClient.interceptors.request.use(
  async config => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  error => Promise.reject(error),
);

export default axiosClient;
