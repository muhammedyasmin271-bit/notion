const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// API service class for handling HTTP requests
class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    // Get auth token from localStorage
    getAuthToken() {
        return localStorage.getItem('token');
    }

    // Set auth token in localStorage
    setAuthToken(token) {
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }

    // Create headers with auth token
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (includeAuth) {
            const token = this.getAuthToken();
            if (token) {
                headers['x-auth-token'] = token;
            }
        }

        return headers;
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(options.includeAuth !== false),
            ...options,
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Authentication methods
    async login(username, password) {
        try {
            // First try server authentication
            const response = await this.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password }),
                includeAuth: false,
            });

            if (response.token) {
                this.setAuthToken(response.token);
            }

            return response;
        } catch (error) {
            // Fallback to localStorage authentication for created users
            const loginUsers = JSON.parse(localStorage.getItem('loginUsers') || '[]');
            const user = loginUsers.find(u => u.username === username && u.password === password);
            
            if (user) {
                // Create a mock token for localStorage users
                const mockToken = btoa(JSON.stringify({
                    id: user.id,
                    username: user.username,
                    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
                }));
                
                this.setAuthToken(mockToken);
                
                return {
                    token: mockToken,
                    user: {
                        id: user.id,
                        username: user.username,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    }
                };
            }
            
            // If no user found in localStorage either, throw the original error
            throw error;
        }
    }

    async register(userData) {
        let response;
        
        if (userData instanceof FormData) {
            // Handle file upload registration
            response = await this.upload('/auth/register', userData);
        } else {
            // Handle regular JSON registration
            response = await this.request('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData),
                includeAuth: false,
            });
        }

        if (response.token) {
            this.setAuthToken(response.token);
        }

        return response;
    }

    async logout() {
        try {
            await this.request('/auth/logout', {
                method: 'POST',
            });
        } catch (error) {
            console.warn('Logout request failed:', error);
        } finally {
            this.setAuthToken(null);
        }
    }

    async getCurrentUser() {
        try {
            return await this.request('/auth/me');
        } catch (error) {
            // Fallback for localStorage users
            const token = this.getAuthToken();
            if (token) {
                try {
                    const payload = JSON.parse(atob(token));
                    const loginUsers = JSON.parse(localStorage.getItem('loginUsers') || '[]');
                    const user = loginUsers.find(u => u.username === payload.username);
                    
                    if (user) {
                        return {
                            id: user.id,
                            username: user.username,
                            name: user.name,
                            email: user.email,
                            role: user.role
                        };
                    }
                } catch (parseError) {
                    console.error('Token parsing failed:', parseError);
                }
            }
            throw error;
        }
    }

    async refreshToken() {
        const response = await this.request('/auth/refresh', {
            method: 'POST',
        });

        if (response.token) {
            this.setAuthToken(response.token);
        }

        return response;
    }

    async updatePreferences(preferences) {
        return await this.request('/auth/preferences', {
            method: 'PUT',
            body: JSON.stringify(preferences),
        });
    }

    async changePassword(currentPassword, newPassword) {
        const response = await this.request('/auth/change-password', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword }),
        });
        return response;
    }

    // User Management (Manager/Admin only)
    async registerUser(userData) {
        try {
            const response = await this.request('/auth/register-user', {
                method: 'POST',
                body: JSON.stringify(userData),
            });
            return response;
        } catch (error) {
            // Fallback: save to localStorage if server is not available
            console.warn('Server not available, saving to localStorage:', error);
            
            const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
            const newUser = {
                id: Date.now(),
                ...userData,
                createdAt: new Date().toISOString(),
                isActive: true
            };
            
            users.push(newUser);
            localStorage.setItem('registeredUsers', JSON.stringify(users));
            
            // Also add to loginUsers for authentication
            const loginUsers = JSON.parse(localStorage.getItem('loginUsers') || '[]');
            loginUsers.push({
                id: newUser.id,
                username: userData.username,
                password: userData.password,
                name: userData.name,
                email: userData.email,
                role: userData.role
            });
            localStorage.setItem('loginUsers', JSON.stringify(loginUsers));
            
            return { user: newUser, message: 'User registered successfully (offline mode)' };
        }
    }

    async getUsers(filters = {}) {
        try {
            const queryParams = new URLSearchParams();
            Object.keys(filters).forEach(key => {
                if (filters[key] !== undefined && filters[key] !== '') {
                    queryParams.append(key, filters[key]);
                }
            });

            const url = `/auth/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response = await this.request(url);
            return { users: response };
        } catch (error) {
            console.error('Error fetching users:', error);
            return { users: [] };
        }
    }

    async toggleUserStatus(userId) {
        const response = await this.request(`/auth/users/${userId}/status`, {
            method: 'PUT',
        });
        return response;
    }

    // Approve/Decline user (Manager only)
    async approveUser(userId) {
        const response = await this.request(`/auth/users/${userId}/approve`, {
            method: 'PUT',
        });
        return response;
    }

    async declineUser(userId) {
        const response = await this.request(`/auth/users/${userId}/decline`, {
            method: 'PUT',
        });
        return response;
    }

    async deleteUser(userId) {
        const response = await this.request(`/auth/users/${userId}`, {
            method: 'DELETE',
        });
        return response;
    }

    async createUser(userData) {
        const response = await this.request('/auth/register-user', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
        return response;
    }

    async updateUser(userId, userData) {
        const response = await this.request(`/auth/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
        return response;
    }

    async getUserById(userId) {
        const response = await this.request(`/auth/users/${userId}`);
        return response;
    }

    // Check if user is authenticated
    isAuthenticated() {
        const token = this.getAuthToken();
        if (!token) return false;

        try {
            // Basic JWT token validation (check if not expired)
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            return payload.exp > currentTime;
        } catch (error) {
            console.error('Token validation failed:', error);
            this.setAuthToken(null);
            return false;
        }
    }

    // Generic CRUD operations for other resources
    async get(endpoint) {
        return await this.request(endpoint, { method: 'GET' });
    }

    async post(endpoint, data) {
        return await this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async put(endpoint, data) {
        return await this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async delete(endpoint) {
        return await this.request(endpoint, { method: 'DELETE' });
    }

    // File upload using FormData (no JSON headers)
    async upload(endpoint, formData) {
        const url = `${this.baseURL}${endpoint}`;
        
        // Build headers without Content-Type so browser sets multipart boundary
        const headers = {};
        const token = this.getAuthToken();
        if (token) headers['x-auth-token'] = token;

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData,
                headers,
            });
            
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('Upload request failed:', error);
            throw error;
        }
    }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;

// Export individual wrapper functions to preserve context
export const login = (username, password) => apiService.login(username, password);
export const register = (userData) => apiService.register(userData);
export const logout = () => apiService.logout();
export const getCurrentUser = () => apiService.getCurrentUser();
export const refreshToken = () => apiService.refreshToken();
export const updatePreferences = (preferences) => apiService.updatePreferences(preferences);
export const changePassword = (currentPassword, newPassword) => apiService.changePassword(currentPassword, newPassword);
export const isAuthenticated = () => apiService.isAuthenticated();
export const get = (endpoint) => apiService.get(endpoint);
export const post = (endpoint, data) => apiService.post(endpoint, data);
export const put = (endpoint, data) => apiService.put(endpoint, data);
export const deleteRequest = (endpoint) => apiService.delete(endpoint);
export const upload = (endpoint, formData) => apiService.upload(endpoint, formData);
export const createUser = (userData) => apiService.createUser(userData);
export const updateUser = (userId, userData) => apiService.updateUser(userId, userData);
export const getUserById = (userId) => apiService.getUserById(userId);
export const getUsers = (filters) => apiService.getUsers(filters);
export const toggleUserStatus = (userId) => apiService.toggleUserStatus(userId);
export const deleteUser = (userId) => apiService.deleteUser(userId);
export const approveUser = (userId) => apiService.approveUser(userId);
export const declineUser = (userId) => apiService.declineUser(userId);
