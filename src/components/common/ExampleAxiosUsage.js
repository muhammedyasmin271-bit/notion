import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/axiosConfig';
import apiService from '../services/api';

const ExampleAxiosUsage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    // Example 1: Direct axios instance usage
    const fetchUsersDirectly = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get('/users');
            setUsers(response.users || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    // Example 2: Using API service methods
    const fetchUsersViaService = async () => {
        setLoading(true);
        try {
            const response = await apiService.getUsers();
            setUsers(response.users || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    // Example 3: Creating a new user
    const createUser = async (userData) => {
        try {
            const newUser = await axiosInstance.post('/users', userData);
            setUsers(prev => [...prev, newUser]);
        } catch (error) {
            console.error('Error creating user:', error);
        }
    };

    useEffect(() => {
        fetchUsersViaService();
    }, []);

    return (
        <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Axios Usage Examples</h2>
            
            <div className="space-y-4">
                <button 
                    onClick={fetchUsersDirectly}
                    className="px-4 py-2 bg-blue-500 text-white rounded"
                    disabled={loading}
                >
                    Fetch Users (Direct Axios)
                </button>
                
                <button 
                    onClick={fetchUsersViaService}
                    className="px-4 py-2 bg-green-500 text-white rounded"
                    disabled={loading}
                >
                    Fetch Users (API Service)
                </button>
            </div>

            {loading && <p>Loading...</p>}
            
            <div className="mt-4">
                <h3 className="font-semibold">Users ({users.length})</h3>
                <ul className="list-disc pl-5">
                    {users.map(user => (
                        <li key={user.id}>{user.name || user.username}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default ExampleAxiosUsage;