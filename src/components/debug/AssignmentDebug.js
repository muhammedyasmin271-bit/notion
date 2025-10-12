import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';

const AssignmentDebug = () => {
  const { user, users } = useAppContext();
  const [projects, setProjects] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchProjects();
    fetchNotifications();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:9000/api/projects', {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://localhost:9000/api/notifications', {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const testAssignment = async () => {
    try {
      const testUser = users.find(u => u.username !== user?.username);
      if (!testUser) {
        alert('No other users found to test assignment');
        return;
      }

      const response = await fetch('http://localhost:9000/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({
          name: 'Test Assignment Project',
          description: 'Testing assignment functionality',
          status: 'Not started',
          priority: 'Medium',
          forPerson: testUser.username
        })
      });

      if (response.ok) {
        const newProject = await response.json();
        alert(`Test project created and assigned to ${testUser.name}. Check their notifications!`);
        fetchProjects();
        fetchNotifications();
      } else {
        const error = await response.text();
        alert(`Failed to create test project: ${error}`);
      }
    } catch (error) {
      console.error('Error testing assignment:', error);
      alert('Error testing assignment. Check console for details.');
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Assignment Debug Panel</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Current User</h3>
          <p><strong>Name:</strong> {user?.name}</p>
          <p><strong>Username:</strong> {user?.username}</p>
          <p><strong>Role:</strong> {user?.role}</p>
          <p><strong>Can Create Projects:</strong> {user?.role === 'manager' || user?.role === 'admin' ? 'Yes' : 'No'}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Available Users ({users.length})</h3>
          <div className="max-h-32 overflow-y-auto">
            {users.map(u => (
              <div key={u.id} className="text-sm mb-1">
                <strong>{u.name}</strong> ({u.username}) - {u.role}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Projects with Assignments</h3>
          <div className="max-h-32 overflow-y-auto">
            {projects.filter(p => p.forPerson).map(p => (
              <div key={p.id} className="text-sm mb-2 p-2 bg-white rounded">
                <strong>{p.name}</strong><br />
                <span className="text-gray-600">Assigned to: {p.forPerson}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Recent Notifications</h3>
          <div className="max-h-32 overflow-y-auto">
            {notifications.slice(0, 5).map(n => (
              <div key={n._id} className="text-sm mb-2 p-2 bg-white rounded">
                <strong>{n.title}</strong><br />
                <span className="text-gray-600">{n.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={testAssignment}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          disabled={user?.role !== 'manager' && user?.role !== 'admin'}
        >
          Test Assignment Functionality
        </button>
        {(user?.role !== 'manager' && user?.role !== 'admin') && (
          <p className="text-red-600 text-sm mt-2">Only managers can test assignments</p>
        )}
      </div>
    </div>
  );
};

export default AssignmentDebug;