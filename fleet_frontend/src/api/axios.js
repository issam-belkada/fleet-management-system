import axios from 'axios';

const axiosClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('ACCESS_TOKEN'); 
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si on reçoit un 401, on nettoie tout et on redirige
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('ACCESS_TOKEN');
      localStorage.removeItem('USER');
      // On évite la redirection si on est déjà sur login pour stopper les boucles
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;