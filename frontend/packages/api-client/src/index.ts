import axios from 'axios';

const BASE_URL = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL)
  ?? (typeof import.meta !== 'undefined' ? (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL : undefined)
  ?? 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach access token
apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401
apiClient.interceptors.response.use(
  (res) => res,
  async (error: { response?: { status: number }; config: Record<string, unknown> }) => {
    if (error.response?.status === 401) {
      try {
        const { data } = await axios.post(`${BASE_URL}/api/auth/token/refresh`, {}, { withCredentials: true });
        const token = (data as { accessToken: string }).accessToken;
        localStorage.setItem('access_token', token);
        (error.config as { headers?: Record<string, string> }).headers = {
          ...(error.config as { headers?: Record<string, string> }).headers,
          Authorization: `Bearer ${token}`,
        };
        return axios(error.config as Parameters<typeof axios>[0]);
      } catch {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

// Auth API
export const authApi = {
  sendOtp: (phone: string) => apiClient.post('/api/auth/otp/send', { phone }),
  verifyOtp: (phone: string, otp: string) => apiClient.post('/api/auth/otp/verify', { phone, otp }),
  logout: () => apiClient.post('/api/auth/logout'),
  getMe: () => apiClient.get('/api/auth/me'),
};

// Orders API
export const ordersApi = {
  create: (token: string, data: object) => apiClient.post(`/api/checkout-sessions/${token}/orders`, data),
  get: (id: string, accessCode?: string) =>
    apiClient.get(`/api/orders/${id}`, { params: { access_code: accessCode } }),
  track: (id: string, accessCode?: string) =>
    apiClient.get(`/api/orders/${id}/track`, { params: { access_code: accessCode } }),
  listForOrg: (orgId: string) => apiClient.get(`/api/orgs/${orgId}/orders`),
  updateStatus: (id: string, status: string) =>
    apiClient.patch(`/api/orders/${id}/status`, { status }),
};

// Checkout API
export const checkoutApi = {
  createSession: (data: object) => apiClient.post('/api/checkout-sessions', data),
  getSession: (token: string) => apiClient.get(`/api/checkout-sessions/${token}`),
};

// Payments API
export const paymentsApi = {
  initiate: (orderId: string, provider: string) =>
    apiClient.post(`/api/orders/${orderId}/payments/initiate`, { provider }),
  refund: (orderId: string, reason: string) =>
    apiClient.post(`/api/orders/${orderId}/payments/refund`, { reason }),
};

// Logistics API
export const logisticsApi = {
  getQuotes: (orderId: string) => apiClient.get(`/api/orders/${orderId}/shipments/quote`),
  book: (orderId: string, data: object) =>
    apiClient.post(`/api/orders/${orderId}/shipments/book`, data),
  getShipment: (orderId: string) => apiClient.get(`/api/orders/${orderId}/shipments`),
};

// Disputes API
export const disputesApi = {
  open: (orderId: string, reason: string) =>
    apiClient.post(`/api/orders/${orderId}/disputes`, { reason }),
  list: (orderId: string) => apiClient.get(`/api/orders/${orderId}/disputes`),
  get: (id: string) => apiClient.get(`/api/disputes/${id}`),
};

// Products API
export const productsApi = {
  create: (orgId: string, data: object) =>
    apiClient.post(`/api/orgs/${orgId}/products`, data),
  listForOrg: (orgId: string) => apiClient.get(`/api/orgs/${orgId}/products`),
  get: (id: string) => apiClient.get(`/api/products/${id}`),
  update: (id: string, data: object) => apiClient.patch(`/api/products/${id}`, data),
  delete: (id: string) => apiClient.delete(`/api/products/${id}`),
};
