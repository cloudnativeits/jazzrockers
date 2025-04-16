// API configuration
const API_BASE_URL = 'http://localhost:5000';

// Interface for API request options
interface ApiRequestOptions {
  headers?: Record<string, string>;
  body?: any;
}

/**
 * Makes an API request with the given method and endpoint
 * @param method HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param endpoint API endpoint (e.g., '/api/users')
 * @param data Optional data to send with the request
 * @returns Promise with the response
 */
export async function apiRequest(
  method: string,
  endpoint: string,
  data?: any
): Promise<Response> {
  const options: ApiRequestOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Add request body for non-GET requests
  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }

  // Get the stored auth token
  const token = localStorage.getItem('authToken');
  if (token) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      ...options,
    });

    // Handle unauthorized responses
    if (response.status === 401) {
      // Clear stored token
      localStorage.removeItem('authToken');
      // Redirect to login page
      window.location.href = '/login';
      throw new Error('Unauthorized access');
    }

    // Handle other error responses
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return response;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}
