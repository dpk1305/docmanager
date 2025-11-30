import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:5000/api',
  withCredentials: true,
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token || localStorage.getItem('docmanager:accessToken') || ''
  if (token) {
    config.headers = config.headers || {}
    ;(config.headers as any).Authorization = `Bearer ${token}`
  }
  return config
})

