import axios from 'axios'

// Mock user for testing
const USER_ID = '11111111-1111-1111-1111-111111111111' // Use the specified UUID for testing

// Create axios instance with base URL pointing to the NestJS backend
const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${USER_ID}` // Add Bearer token for auth
  }
})

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    // Log authentication errors
    if (error.response && error.response.status === 401) {
      console.error('Authentication error:', error.response.data)
    }
    return Promise.reject(error)
  }
)

export default api
