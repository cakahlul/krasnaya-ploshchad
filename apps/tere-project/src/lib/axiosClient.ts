import axios from 'axios';
import { getAuth } from 'firebase/auth';

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_AIOC_SERVICE,
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
