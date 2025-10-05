const API_BASE_URL =
    process.env.REACT_APP_API_URL ||
    (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
        ? '/api'
        : 'http://localhost:5000/api');

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

            // Try the main users endpoint first
            try {
                const url = `/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
                const response = await this.request(url);
                return response; // This returns { users: [...], pagination: {...} }
            } catch (mainError) {
                // Fallback to auth endpoint
                const url = `/auth/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
                const response = await this.request(url);
                return { users: response };
            }
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
            const response = await this.request(url);
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
            const response = await this.request('/notepad', {
                method: 'POST',
                body: JSON.stringify(noteData),
            });
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
            const response = await this.request(`/notepad/${noteId}`, {
                method: 'PUT',
                body: JSON.stringify(noteData),
            });
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
            const response = await this.request(`/notepad/${noteId}`);
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
            const response = await this.request(`/notepad/${noteId}`, {
                method: 'DELETE',
            });
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
            const response = await this.request(`/notepad/${noteId}/share`, {
                method: 'POST',
                body: JSON.stringify({ shareType }),
            });
            return response;
        } catch (error) {
            console.error('Error sharing note:', error);
            // Fallback - just mark as shared locally
            return { message: `Note shared with ${shareType} (offline mode)` };
        }
    }

    async toggleNotePin(noteId) {
        try {
            const response = await this.request(`/notepad/${noteId}/pin`, {
                method: 'PATCH',
            });
            return response;
        } catch (error) {
            console.error('Error toggling pin:', error);
            throw error;
        }
    }

    async toggleNoteArchive(noteId) {
        try {
            const response = await this.request(`/notepad/${noteId}/archive`, {
                method: 'PATCH',
            });
            return response;
        } catch (error) {
            console.error('Error toggling archive:', error);
            throw error;
        }
    }

    async restoreNote(noteId) {
        try {
            const response = await this.request(`/notepad/${noteId}/restore`, {
                method: 'PATCH',
            });
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
            const response = await this.request(url);
            return response;
        } catch (error) {
            console.error('Error fetching meetings:', error);
            throw error;
        }
    }

    async createMeeting(meetingData) {
        try {
            const response = await this.request('/meetings', {
                method: 'POST',
                body: JSON.stringify(meetingData),
            });
            return response;
        } catch (error) {
            console.error('Error creating meeting:', error);
            throw error;
        }
    }

    async updateMeeting(meetingId, meetingData) {
        try {
            const response = await this.request(`/meetings/${meetingId}`, {
                method: 'PUT',
                body: JSON.stringify(meetingData),
            });
            return response;
        } catch (error) {
            console.error('Error updating meeting:', error);
            throw error;
        }
    }

    async getMeetingById(meetingId) {
        try {
            const response = await this.request(`/meetings/${meetingId}`);
            return response;
        } catch (error) {
            console.error('Error fetching meeting:', error);
            // Fallback to sample data for demo purposes
            const sampleMeetings = {
                '1': {
                    _id: '1',
                    title: 'Weekly Team Standup',
                    type: 'Standup',
                    date: '2024-01-15T09:00:00Z',
                    time: '09:00',
                    duration: 30,
                    attendees: ['John Doe', 'Jane Smith', 'Mike Johnson'],
                    status: 'completed',
                    location: 'Conference Room A',
                    meetingLink: '',
                    agenda: 'Weekly team sync and progress updates',
                    notes: '# Weekly Team Standup\n\n## Agenda\n• Review last week\'s progress\n• Discuss current blockers\n• Plan upcoming tasks\n\n## Discussion Points\n1. Project Alpha is 80% complete\n2. Need to resolve API integration issues\n3. Client feedback session scheduled for Friday\n\n## Action Items\n- [ ] Complete frontend design by Wednesday\n- [x] Review backend API documentation\n- [ ] Schedule client presentation\n\n## Next Steps\n> Focus on completing remaining tasks before the deadline\n\n**Priority Items:**\n⭐ high: Fix critical bug in payment system\n⭐ medium: Update user documentation\n\n---\n\nMeeting concluded at 9:30 AM',
                    blocks: [
                        { id: 'block-1', type: 'heading1', content: 'Weekly Team Standup', style: {} },
                        { id: 'block-2', type: 'heading2', content: 'Agenda', style: {} },
                        { id: 'block-3', type: 'bullet', content: '• Review last week\'s progress', style: {} },
                        { id: 'block-4', type: 'bullet', content: '• Discuss current blockers', style: {} },
                        { id: 'block-5', type: 'bullet', content: '• Plan upcoming tasks', style: {} },
                        { id: 'block-6', type: 'heading2', content: 'Discussion Points', style: {} },
                        { id: 'block-7', type: 'numbered', content: '1. Project Alpha is 80% complete', style: {} },
                        { id: 'block-8', type: 'numbered', content: '2. Need to resolve API integration issues', style: {} },
                        { id: 'block-9', type: 'numbered', content: '3. Client feedback session scheduled for Friday', style: {} },
                        { id: 'block-10', type: 'heading2', content: 'Action Items', style: {} },
                        { id: 'block-11', type: 'todo', content: '☐ Complete frontend design by Wednesday', style: {} },
                        { id: 'block-12', type: 'todo', content: '☑ Review backend API documentation', style: {} },
                        { id: 'block-13', type: 'todo', content: '☐ Schedule client presentation', style: {} },
                        { id: 'block-14', type: 'heading2', content: 'Next Steps', style: {} },
                        { id: 'block-15', type: 'quote', content: 'Focus on completing remaining tasks before the deadline', style: {} },
                        { id: 'block-16', type: 'text', content: 'Priority Items:', style: { bold: true } },
                        { id: 'block-17', type: 'priority', content: 'Fix critical bug in payment system', priorityLevel: 'high', style: {} },
                        { id: 'block-18', type: 'priority', content: 'Update user documentation', priorityLevel: 'medium', style: {} },
                        { id: 'block-19', type: 'divider', content: '', style: {} },
                        { id: 'block-20', type: 'text', content: 'Meeting concluded at 9:30 AM', style: {} }
                    ],
                    actionItems: [
                        { id: 1, description: 'Complete frontend design', assignee: 'John Doe', completed: false },
                        { id: 2, description: 'Review backend API', assignee: 'Jane Smith', completed: true },
                        { id: 3, description: 'Schedule client presentation', assignee: 'Mike Johnson', completed: false }
                    ],
                    tags: ['weekly', 'team', 'standup'],
                    createdAt: '2024-01-15T09:00:00Z',
                    updatedAt: '2024-01-15T09:30:00Z'
                },
                '2': {
                    _id: '2',
                    title: 'Product Planning Session',
                    type: 'Planning',
                    date: '2024-01-16T14:00:00Z',
                    time: '14:00',
                    duration: 60,
                    attendees: ['Sarah Wilson', 'Tom Brown', 'Lisa Davis'],
                    status: 'scheduled',
                    location: 'Conference Room B',
                    meetingLink: 'https://meet.google.com/abc-defg-hij',
                    agenda: 'Plan Q1 product roadmap and feature prioritization',
                    notes: '# Product Planning Session\n\n## Objectives\n• Define Q1 roadmap\n• Prioritize feature requests\n• Allocate resources\n\n## Key Features to Discuss\n1. User dashboard redesign\n2. Mobile app improvements\n3. API v2 development\n\n## Resource Allocation\n- Frontend: 3 developers\n- Backend: 2 developers\n- Design: 1 designer\n\n## Timeline\n📅 Q1 Start: January 1st\n📅 Mid-review: February 15th\n📅 Q1 End: March 31st',
                    blocks: [
                        { id: 'block-1', type: 'heading1', content: 'Product Planning Session', style: {} },
                        { id: 'block-2', type: 'heading2', content: 'Objectives', style: {} },
                        { id: 'block-3', type: 'bullet', content: '• Define Q1 roadmap', style: {} },
                        { id: 'block-4', type: 'bullet', content: '• Prioritize feature requests', style: {} },
                        { id: 'block-5', type: 'bullet', content: '• Allocate resources', style: {} },
                        { id: 'block-6', type: 'heading2', content: 'Key Features to Discuss', style: {} },
                        { id: 'block-7', type: 'numbered', content: '1. User dashboard redesign', style: {} },
                        { id: 'block-8', type: 'numbered', content: '2. Mobile app improvements', style: {} },
                        { id: 'block-9', type: 'numbered', content: '3. API v2 development', style: {} },
                        { id: 'block-10', type: 'heading2', content: 'Resource Allocation', style: {} },
                        { id: 'block-11', type: 'bullet', content: '• Frontend: 3 developers', style: {} },
                        { id: 'block-12', type: 'bullet', content: '• Backend: 2 developers', style: {} },
                        { id: 'block-13', type: 'bullet', content: '• Design: 1 designer', style: {} },
                        { id: 'block-14', type: 'heading2', content: 'Timeline', style: {} },
                        { id: 'block-15', type: 'date', content: '2024-01-01', style: {} },
                        { id: 'block-16', type: 'text', content: 'Q1 Start: January 1st', style: {} },
                        { id: 'block-17', type: 'date', content: '2024-02-15', style: {} },
                        { id: 'block-18', type: 'text', content: 'Mid-review: February 15th', style: {} },
                        { id: 'block-19', type: 'date', content: '2024-03-31', style: {} },
                        { id: 'block-20', type: 'text', content: 'Q1 End: March 31st', style: {} }
                    ],
                    actionItems: [],
                    tags: ['planning', 'product', 'roadmap'],
                    createdAt: '2024-01-16T14:00:00Z',
                    updatedAt: '2024-01-16T14:00:00Z'
                }
            };
            
            const meeting = sampleMeetings[meetingId];
            if (meeting) {
                return meeting;
            }
            throw error;
        }
    }

    async deleteMeeting(meetingId) {
        try {
            const response = await this.request(`/meetings/${meetingId}`, {
                method: 'DELETE',
            });
            return response;
        } catch (error) {
            console.error('Error deleting meeting:', error);
            throw error;
        }
    }

    async addMeetingActionItem(meetingId, actionItem) {
        try {
            const response = await this.request(`/meetings/${meetingId}/action-items`, {
                method: 'POST',
                body: JSON.stringify(actionItem),
            });
            return response;
        } catch (error) {
            console.error('Error adding action item:', error);
            throw error;
        }
    }

    async completeMeetingActionItem(meetingId, actionItemId) {
        try {
            const response = await this.request(`/meetings/${meetingId}/action-items/${actionItemId}/complete`, {
                method: 'PATCH',
            });
            return response;
        } catch (error) {
            console.error('Error completing action item:', error);
            throw error;
        }
    }

    async restoreMeeting(meetingId) {
        try {
            const response = await this.request(`/meetings/${meetingId}/restore`, {
                method: 'PATCH',
            });
            return response;
        } catch (error) {
            console.error('Error restoring meeting:', error);
            throw error;
        }
    }

    async completeMeeting(meetingId) {
        try {
            const response = await this.request(`/meetings/${meetingId}/complete`, {
                method: 'PATCH',
            });
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
            const response = await this.request(url);
            return response;
        } catch (error) {
            console.error('Error fetching meeting templates:', error);
            return [];
        }
    }

    async createMeetingTemplate(templateData) {
        try {
            const response = await this.request('/meeting-templates', {
                method: 'POST',
                body: JSON.stringify(templateData),
            });
            return response;
        } catch (error) {
            console.error('Error creating meeting template:', error);
            throw error;
        }
    }

    async updateMeetingTemplate(templateId, templateData) {
        try {
            const response = await this.request(`/meeting-templates/${templateId}`, {
                method: 'PUT',
                body: JSON.stringify(templateData),
            });
            return response;
        } catch (error) {
            console.error('Error updating meeting template:', error);
            throw error;
        }
    }

    async getMeetingTemplateById(templateId) {
        try {
            const response = await this.request(`/meeting-templates/${templateId}`);
            return response;
        } catch (error) {
            console.error('Error fetching meeting template:', error);
            throw error;
        }
    }

    async deleteMeetingTemplate(templateId) {
        try {
            const response = await this.request(`/meeting-templates/${templateId}`, {
                method: 'DELETE',
            });
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

    // AI assistant helper
    async aiAssist(prompt, mode = 'summarize') {
        return await this.post('/ai/assist', { prompt, mode });
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
export const createUser = (userData) => apiService.createUser(userData);
export const updateUser = (userId, userData) => apiService.updateUser(userId, userData);
export const getUserById = (userId) => apiService.getUserById(userId);
export const getUsers = (filters) => apiService.getUsers(filters);
export const getAllUsers = () => apiService.getUsers({ limit: 100 }); // Get all users for sharing
export const toggleUserStatus = (userId) => apiService.toggleUserStatus(userId);
export const deleteUser = (userId) => apiService.deleteUser(userId);
export const approveUser = (userId) => apiService.approveUser(userId);
export const declineUser = (userId) => apiService.declineUser(userId);

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
