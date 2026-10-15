import axios, { type InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "./api-config";
import {tokenStorage} from "./token-storage";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10_000,
    withCredentials: true,
})

api.interceptors.request.use((config) => {
  const accessToken = tokenStorage.getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// Satu promise bersama: kalau 5 request kena 401 bersamaan, refresh cuma jalan sekali
let refreshPromise: Promise<string> | null = null;

function refreshAccessToken(): Promise<string> {
  refreshPromise ??= axios
    .post<{ token: string }>(
      `${API_BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true },
    )
    .then((res) => {
      tokenStorage.setAccessToken(res.data.token);
      return res.data.token;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as RetryableConfig | undefined;

    const isAuthRoute =
    /\/auth\/(login|register|refresh|logout)(?:\?|$)/.test(
        original?.url ?? "",
    );

    if (
      error.response?.status !== 401 ||
      !original ||
      original._retry ||
      isAuthRoute
    ) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      const token = await refreshAccessToken();
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    } catch (refreshError) {
      tokenStorage.clearTokens();
      window.dispatchEvent(new Event("auth:logout"));
      return Promise.reject(refreshError);
    }
  },
);

export default api;