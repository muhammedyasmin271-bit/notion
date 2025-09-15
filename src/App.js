import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import NavBar from './components/NavBar/NavBar';
import HomePage from './components/HomePage/HomePage';
import NotificationsPage from './components/NotificationsPage/NotificationsPage';
import ProjectsPage from './components/ProjectsPage/ProjectsPage';
import ProjectDetailsPage from './components/ProjectsPage/ProjectDetailsPage';
import GoalsPage from './components/GoalsPage/GoalsPage';
import DocumentsPage from './components/DocumentsPage/DocumentsPage';
import NotepadPage from './components/NotepadPage/NotepadPage';
import MeetingNotesPage from './components/MeetingNotesPage/MeetingNotesPage';
import MeetingEditorPage from './components/MeetingEditorPage/MeetingEditorPage';
import TrashPage from './components/TrashPage/TrashPage';
import InviteMembersPage from './components/InviteMembersPage/InviteMembersPage';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import PendingApprovalPage from './components/auth/PendingApprovalPage';
import SettingsPage from './components/SettingsPage/SettingsPage';
import UserManagementPage from './components/UserManagementPage/UserManagementPage';
import UserProfilePage from './components/UserProfilePage/UserProfilePage';
import WelcomePage from './components/WelcomePage/WelcomePage';
import ManagerRoute from './components/ManagerRoute/ManagerRoute';
import SavedNotesPage from './components/SavedNotesPage/SavedNotesPage';
import ReportsPage from './components/ReportsPage/ReportsPage';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAppContext();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Layout Component for authenticated pages
const Layout = ({ children, hideNav = false }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode
      ? 'bg-black text-white'
      : 'bg-gray-50 text-gray-900'
      }`}>
      {!hideNav && <NavBar />}
      <div className="app-content">
        {children}
      </div>
    </div>
  );
};

const AppContent = () => {
  const { isAuthenticated } = useAppContext();

  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/home" replace /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/home" replace /> : <RegisterPage />}
        />
        <Route
          path="/welcome"
          element={<WelcomePage />}
        />
        <Route
          path="/pending-approval"
          element={<PendingApprovalPage />}
        />

        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Navigate to="/home" replace />
          </ProtectedRoute>
        } />

        <Route path="/home" element={
          <ProtectedRoute>
            <Layout>
              <HomePage />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/notifications" element={
          <ProtectedRoute>
            <Layout>
              <NotificationsPage />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/projects" element={
          <ProtectedRoute>
            <Layout>
              <ProjectsPage />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/projects/new" element={
          <ProtectedRoute>
            <Layout hideNav={true}>
              <ProjectDetailsPage isNewProject={true} />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/projects/:projectId" element={
          <ProtectedRoute>
            <Layout hideNav={true}>
              <ProjectDetailsPage />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/projects/split/:projectId" element={
          <ProtectedRoute>
            <Layout>
              <div className="w-full">
                <div className="grid grid-cols-2 gap-0">
                  <div className="border-r border-gray-200 dark:border-gray-800 min-h-screen overflow-auto">
                    <ProjectsPage />
                  </div>
                  <div className="min-h-screen overflow-auto">
                    <ProjectDetailsPage />
                  </div>
                </div>
              </div>
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/goals" element={
          <ProtectedRoute>
            <Layout>
              <GoalsPage />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/goals/:goalId" element={
          <ProtectedRoute>
            <Layout hideNav={true}>
              <GoalsPage />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/documents" element={
          <ProtectedRoute>
            <Layout>
              <DocumentsPage />
            </Layout>
          </ProtectedRoute>
        } />
        {/* Legacy redirect: Inbox -> Documents */}
        <Route path="/inbox" element={
          <ProtectedRoute>
            <Navigate to="/documents" replace />
          </ProtectedRoute>
        } />

        <Route path="/notepad" element={
          <ProtectedRoute>
            <Layout>
              <NotepadPage />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/notes" element={
          <ProtectedRoute>
            <Layout>
              <NotepadPage />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/saved-notes" element={
          <ProtectedRoute>
            <Layout>
              <SavedNotesPage />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/meeting-notes" element={
          <ProtectedRoute>
            <Layout>
              <MeetingNotesPage />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/meeting-new" element={
          <ProtectedRoute>
            <Layout>
              <MeetingEditorPage />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/trash" element={
          <ProtectedRoute>
            <Layout>
              <TrashPage />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute>
            <Layout>
              <SettingsPage />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/invite" element={
          <ProtectedRoute>
            <Layout>
              <InviteMembersPage />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/users" element={
          <ManagerRoute>
            <Layout>
              <UserManagementPage />
            </Layout>
          </ManagerRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <Layout>
              <UserProfilePage />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/reports" element={
          <ProtectedRoute>
            <Layout>
              <ReportsPage />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Catch all route - redirect to home */}
        <Route path="*" element={
          <ProtectedRoute>
            <Navigate to="/home" replace />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
}