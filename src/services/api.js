import axiosInstance from './axiosConfig';

// API service class for handling HTTP requests
class ApiService {
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

    // Authentication methods
    async login(username, password, companyId = null) {
        try {
            // First try server authentication
            const body = { username, password };
            if (companyId) {
                body.companyId = companyId;
            }
            
            const response = await axiosInstance.post('/auth/login', body);

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
            response = await axiosInstance.post('/auth/register', userData);
        }

        if (response.token) {
            this.setAuthToken(response.token);
        }

        return response;
    }

    async logout() {
        try {
            await axiosInstance.post('/auth/logout');
        } catch (error) {
            console.warn('Logout request failed:', error);
        } finally {
            this.setAuthToken(null);
        }
    }

    async getCurrentUser() {
        try {
            return await axiosInstance.get('/auth/me');
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
        const response = await axiosInstance.post('/auth/refresh');

        if (response.token) {
            this.setAuthToken(response.token);
        }

        return response;
    }

    async updatePreferences(preferences) {
        return await axiosInstance.put('/auth/preferences', preferences);
    }

    async changePassword(currentPassword, newPassword) {
        const response = await axiosInstance.put('/auth/change-password', { currentPassword, newPassword });
        return response;
    }

    // User Management (Manager/Admin only)
    async registerUser(userData) {
        try {
            const response = await axiosInstance.post('/auth/register-user', userData);
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

            // Try the main users endpoint first
            try {
                const url = `/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
                const response = await axiosInstance.get(url);
                return response; // This returns { users: [...], pagination: {...} }
            } catch (mainError) {
                // Fallback to auth endpoint
                const url = `/auth/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
                const response = await axiosInstance.get(url);
                return { users: response };
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            return { users: [] };
        }
    }

    async toggleUserStatus(userId) {
        const response = await axiosInstance.put(`/auth/users/${userId}/status`);
        return response;
    }

    // Approve/Decline user (Manager only)
    async approveUser(userId) {
        const response = await axiosInstance.put(`/auth/users/${userId}/approve`);
        return response;
    }

    async declineUser(userId) {
        const response = await axiosInstance.put(`/auth/users/${userId}/decline`);
        return response;
    }

    async deleteUser(userId) {
        const response = await axiosInstance.delete(`/auth/users/${userId}`);
        return response;
    }

    async createUser(userData) {
        const response = await axiosInstance.post('/users', userData);
        return response;
    }

    async updateUser(userId, userData) {
        const response = await axiosInstance.put(`/auth/users/${userId}`, userData);
        return response;
    }

    async getUserById(userId) {
        const response = await axiosInstance.get(`/auth/users/${userId}`);
        return response;
    }

    // Notepad/Notes API methods
    async getNotes(filters = {}) {
        try {
            const queryParams = new URLSearchParams();
            Object.keys(filters).forEach(key => {
                if (filters[key] !== undefined && filters[key] !== '') {
                    queryParams.append(key, filters[key]);
                }
            });

            const url = `/notepad${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response = await axiosInstance.get(url);
            return response;
        } catch (error) {
            console.error('Error fetching notes:', error);
            // Fallback to localStorage for offline mode
            const savedNotes = JSON.parse(localStorage.getItem('savedNotes') || '[]');
            const sharedNotes = JSON.parse(localStorage.getItem('sharedNotes') || '[]');
            const receivedNotes = JSON.parse(localStorage.getItem('receivedNotes') || '[]');
            return [...savedNotes, ...sharedNotes, ...receivedNotes];
        }
    }

    async createNote(noteData) {
        try {
            const response = await axiosInstance.post('/notepad', noteData);
            return response;
        } catch (error) {
            console.error('Error creating note:', error);
            // Fallback to localStorage
            const newNote = {
                id: Date.now(),
                _id: Date.now(),
                ...noteData,
                author: { name: 'You' },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const savedNotes = JSON.parse(localStorage.getItem('savedNotes') || '[]');
            savedNotes.push(newNote);
            localStorage.setItem('savedNotes', JSON.stringify(savedNotes));

            return newNote;
        }
    }

    async updateNote(noteId, noteData) {
        try {
            const response = await axiosInstance.put(`/notepad/${noteId}`, noteData);
            return response;
        } catch (error) {
            console.error('Error updating note:', error);
            // Fallback to localStorage
            const savedNotes = JSON.parse(localStorage.getItem('savedNotes') || '[]');
            const noteIndex = savedNotes.findIndex(note => note._id === noteId || note.id === noteId);
            if (noteIndex !== -1) {
                savedNotes[noteIndex] = { ...savedNotes[noteIndex], ...noteData, updatedAt: new Date().toISOString() };
                localStorage.setItem('savedNotes', JSON.stringify(savedNotes));
                return savedNotes[noteIndex];
            }
            throw error;
        }
    }

    async getNoteById(noteId) {
        try {
            const response = await axiosInstance.get(`/notepad/${noteId}`);
            return response;
        } catch (error) {
            console.error('Error fetching note:', error);
            // Fallback to localStorage
            const savedNotes = JSON.parse(localStorage.getItem('savedNotes') || '[]');
            const sharedNotes = JSON.parse(localStorage.getItem('sharedNotes') || '[]');
            const receivedNotes = JSON.parse(localStorage.getItem('receivedNotes') || '[]');
            const allNotes = [...savedNotes, ...sharedNotes, ...receivedNotes];

            const note = allNotes.find(n => n._id === noteId || n.id === noteId);
            if (!note) throw new Error('Note not found');
            return note;
        }
    }

    async deleteNote(noteId) {
        try {
            const response = await axiosInstance.delete(`/notepad/${noteId}`);
            return response;
        } catch (error) {
            console.error('Error deleting note:', error);
            // Fallback to localStorage - move to trash
            const savedNotes = JSON.parse(localStorage.getItem('savedNotes') || '[]');
            const noteIndex = savedNotes.findIndex(note => note._id === noteId || note.id === noteId);
            if (noteIndex !== -1) {
                const deletedNote = { ...savedNotes[noteIndex], deleted: true, deletedAt: new Date().toISOString() };
                savedNotes.splice(noteIndex, 1);
                localStorage.setItem('savedNotes', JSON.stringify(savedNotes));

                // Add to trash
                const trashedNotes = JSON.parse(localStorage.getItem('trashedNotes') || '[]');
                trashedNotes.push(deletedNote);
                localStorage.setItem('trashedNotes', JSON.stringify(trashedNotes));

                return { message: 'Note moved to trash' };
            }
            throw error;
        }
    }

    async shareNote(noteId, shareType) {
        try {
            const response = await axiosInstance.post(`/notepad/${noteId}/share`, { shareType });
            return response;
        } catch (error) {
            console.error('Error sharing note:', error);
            // Fallback - just mark as shared locally
            return { message: `Note shared with ${shareType} (offline mode)` };
        }
    }

    async toggleNotePin(noteId) {
        try {
            const response = await axiosInstance.patch(`/notepad/${noteId}/pin`);
            return response;
        } catch (error) {
            console.error('Error toggling pin:', error);
            throw error;
        }
    }

    async toggleNoteArchive(noteId) {
        try {
            const response = await axiosInstance.patch(`/notepad/${noteId}/archive`);
            return response;
        } catch (error) {
            console.error('Error toggling archive:', error);
            throw error;
        }
    }

    async restoreNote(noteId) {
        try {
            const response = await axiosInstance.patch(`/notepad/${noteId}/restore`);
            return response;
        } catch (error) {
            console.error('Error restoring note:', error);
            throw error;
        }
    }

    // Meeting API methods
    async getMeetings(filters = {}) {
        try {
            const queryParams = new URLSearchParams();
            Object.keys(filters).forEach(key => {
                if (filters[key] !== undefined && filters[key] !== '') {
                    queryParams.append(key, filters[key]);
                }
            });

            const url = `/meetings${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response = await axiosInstance.get(url);
            return response;
        } catch (error) {
            console.error('Error fetching meetings:', error);
            throw error;
        }
    }

    async createMeeting(meetingData) {
        try {
            const response = await axiosInstance.post('/meetings', meetingData);
            return response;
        } catch (error) {
            console.error('Error creating meeting:', error);
            throw error;
        }
    }

    async updateMeeting(meetingId, meetingData) {
        try {
            const response = await axiosInstance.put(`/meetings/${meetingId}`, meetingData);
            return response;
        } catch (error) {
            console.error('Error updating meeting:', error);
            throw error;
        }
    }

    async getMeetingById(meetingId) {
        try {
            const response = await axiosInstance.get(`/meetings/${meetingId}`);
            return response;
        } catch (error) {
            console.error('Error fetching meeting:', error);
            // Don't fallback to sample data, let the error propagate
            throw error;
        }
    }

    async deleteMeeting(meetingId) {
        try {
            const response = await axiosInstance.delete(`/meetings/${meetingId}`);
            return response;
        } catch (error) {
            console.error('Error deleting meeting:', error);
            throw error;
        }
    }

    async addMeetingActionItem(meetingId, actionItem) {
        try {
            const response = await axiosInstance.post(`/meetings/${meetingId}/action-items`, actionItem);
            return response;
        } catch (error) {
            console.error('Error adding action item:', error);
            throw error;
        }
    }

    async completeMeetingActionItem(meetingId, actionItemId) {
        try {
            const response = await axiosInstance.patch(`/meetings/${meetingId}/action-items/${actionItemId}/complete`);
            return response;
        } catch (error) {
            console.error('Error completing action item:', error);
            throw error;
        }
    }

    async restoreMeeting(meetingId) {
        try {
            const response = await axiosInstance.patch(`/meetings/${meetingId}/restore`);
            return response;
        } catch (error) {
            console.error('Error restoring meeting:', error);
            throw error;
        }
    }

    async completeMeeting(meetingId) {
        try {
            const response = await axiosInstance.patch(`/meetings/${meetingId}/complete`);
            return response;
        } catch (error) {
            console.error('Error completing meeting:', error);
            throw error;
        }
    }

    // Meeting Template API methods
    async getMeetingTemplates(filters = {}) {
        try {
            const queryParams = new URLSearchParams();
            Object.keys(filters).forEach(key => {
                if (filters[key] !== undefined && filters[key] !== '') {
                    queryParams.append(key, filters[key]);
                }
            });

            const url = `/meeting-templates${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response = await axiosInstance.get(url);
            return response;
        } catch (error) {
            console.error('Error fetching meeting templates:', error);
            return [];
        }
    }

    async createMeetingTemplate(templateData) {
        try {
            const response = await axiosInstance.post('/meeting-templates', templateData);
            return response;
        } catch (error) {
            console.error('Error creating meeting template:', error);
            throw error;
        }
    }

    async updateMeetingTemplate(templateId, templateData) {
        try {
            const response = await axiosInstance.put(`/meeting-templates/${templateId}`, templateData);
            return response;
        } catch (error) {
            console.error('Error updating meeting template:', error);
            throw error;
        }
    }

    async getMeetingTemplateById(templateId) {
        try {
            const response = await axiosInstance.get(`/meeting-templates/${templateId}`);
            return response;
        } catch (error) {
            console.error('Error fetching meeting template:', error);
            throw error;
        }
    }

    async deleteMeetingTemplate(templateId) {
        try {
            const response = await axiosInstance.delete(`/meeting-templates/${templateId}`);
            return response;
        } catch (error) {
            console.error('Error deleting meeting template:', error);
            throw error;
        }
    }

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
        return await axiosInstance.get(endpoint);
    }

    async post(endpoint, data) {
        return await axiosInstance.post(endpoint, data);
    }

    async put(endpoint, data) {
        return await axiosInstance.put(endpoint, data);
    }

    async delete(endpoint) {
        return await axiosInstance.delete(endpoint);
    }

    // File upload using FormData (no JSON headers)
    async upload(endpoint, formData) {
        try {
            const response = await axiosInstance.post(endpoint, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response;
        } catch (error) {
            console.error('Upload request failed:', error);
            throw error;
        }
    }

    // AI assistant helper
    async aiAssist(prompt, mode = 'summarize') {
        return await axiosInstance.post('/ai/assist', { prompt, mode });
    }

    // AI Chat functionality
    async aiChat(messages) {
        try {
            const response = await axiosInstance.post('/ai/chat', { messages });
            return response;
        } catch (error) {
            console.error('AI Chat Error:', error);
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
export const aiAssist = (prompt, mode) => apiService.aiAssist(prompt, mode);
export const aiChat = (messages) => apiService.aiChat(messages);
export const createUser = (userData) => apiService.createUser(userData);
export const updateUser = (userId, userData) => apiService.updateUser(userId, userData);
export const getUserById = (userId) => apiService.getUserById(userId);
export const getUsers = (filters) => apiService.getUsers(filters);
export const getAllUsers = () => apiService.getUsers({ limit: 100 }); // Get all users for sharing
export const toggleUserStatus = (userId) => apiService.toggleUserStatus(userId);
export const deleteUser = (userId) => apiService.deleteUser(userId);
export const approveUser = (userId) => apiService.approveUser(userId);
export const declineUser = (userId) => apiService.declineUser(userId);
export const getUserStats = () => apiService.get('/users/stats-overview');
export const getPointsStats = () => apiService.get('/users/points/stats');

// Notepad exports
export const getNotes = (filters) => apiService.getNotes(filters);
export const createNote = (noteData) => apiService.createNote(noteData);
export const updateNote = (noteId, noteData) => apiService.updateNote(noteId, noteData);
export const getNoteById = (noteId) => apiService.getNoteById(noteId);
export const deleteNote = (noteId) => apiService.deleteNote(noteId);
export const shareNote = (noteId, shareType) => apiService.shareNote(noteId, shareType);
export const toggleNotePin = (noteId) => apiService.toggleNotePin(noteId);
export const toggleNoteArchive = (noteId) => apiService.toggleNoteArchive(noteId);
export const restoreNote = (noteId) => apiService.restoreNote(noteId);

// Meeting exports
export const getMeetings = (filters) => apiService.getMeetings(filters);
export const createMeeting = (meetingData) => apiService.createMeeting(meetingData);
export const updateMeeting = (meetingId, meetingData) => apiService.updateMeeting(meetingId, meetingData);
export const getMeetingById = (meetingId) => apiService.getMeetingById(meetingId);
export const deleteMeeting = (meetingId) => apiService.deleteMeeting(meetingId);
export const addMeetingActionItem = (meetingId, actionItem) => apiService.addMeetingActionItem(meetingId, actionItem);
export const completeMeetingActionItem = (meetingId, actionItemId) => apiService.completeMeetingActionItem(meetingId, actionItemId);
export const restoreMeeting = (meetingId) => apiService.restoreMeeting(meetingId);
export const completeMeeting = (meetingId) => apiService.completeMeeting(meetingId);

// Meeting Template exports
export const getMeetingTemplates = (filters) => apiService.getMeetingTemplates(filters);
export const createMeetingTemplate = (templateData) => apiService.createMeetingTemplate(templateData);
export const updateMeetingTemplate = (templateId, templateData) => apiService.updateMeetingTemplate(templateId, templateData);
export const getMeetingTemplateById = (templateId) => apiService.getMeetingTemplateById(templateId);
export const deleteMeetingTemplate = (templateId) => apiService.deleteMeetingTemplate(templateId);
