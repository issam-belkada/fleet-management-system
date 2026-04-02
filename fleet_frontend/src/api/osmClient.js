// api/osmClient.js
import axios from 'axios';

const osmClient = axios.create({
    baseURL: 'https://nominatim.openstreetmap.org',
    timeout: 8000,
    headers: {
        'Accept': 'application/json',
    }
});

// ✅ Supprimer le header X-Requested-With qui déclenche le preflight CORS
delete osmClient.defaults.headers.common['X-Requested-With'];

osmClient.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 429) {
            console.error("Nominatim rate limit — attends 1 seconde entre les requêtes");
        }
        return Promise.reject(error);
    }
);

export default osmClient;