import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import NavBar from './components/NavBar/NavBar';
import HomePage from './components/HomePage/HomePage';
import ProjectsPage from './components/ProjectsPage/ProjectsPage';
import ProjectDetailPage from './components/ProjectDetailPage/ProjectDetailPage';


import ProjectReportPage from './components/ReportPage/ReportPage';

import DocumentsPage from './components/DocumentsPage/DocumentsPage';
import NotepadPage from './components/NotepadPage/NotepadPage';
import MeetingNotesPage from './components/MeetingNotesPage/MeetingNotesPage';
import MeetingEditorPage from './components/MeetingEditorPage/MeetingEditorPage';

import TrashPage from './components/TrashPage/TrashPage';
import InviteMembersPage from './components/InviteMembersPage/InviteMembersPage';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import PendingApprovalPage from './components/auth/PendingApprovalPage';
import HowItWorksPage from './components/HowItWorksPage/HowItWorksPage';
import AIAssistantPage from './components/AIAssistantPage/AIAssistantPage';
import UserManagementPage from './components/UserManagementPage/UserManagementPage';
import UserProfilePage from './components/UserProfilePage/UserProfilePage';
import WelcomePage from './components/WelcomePage/WelcomePage';
import ManagerRoute from './components/ManagerRoute/ManagerRoute';
import AdminRoute from './components/AdminRoute/AdminRoute';
import SuperAdminRoute from './components/SuperAdminRoute/SuperAdminRoute';
import SuperAdminPage from './components/SuperAdminPage/SuperAdminPage';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import CompanySettings from './components/AdminDashboard/CompanySettings';
import AdminReports from './components/AdminDashboard/AdminReports';
import AdminAuditLog from './components/AdminDashboard/AdminAuditLog';
import AdminUserAnalytics from './components/AdminDashboard/AdminUserAnalytics';
import AdminDataManagement from './components/AdminDashboard/AdminDataManagement'; // Add this line
import PaymentSubmission from './components/AdminDashboard/PaymentSubmission';
import PaymentVerification from './components/SuperAdminPage/PaymentVerification';
import SuperAdminSettings from './components/SuperAdminPage/SuperAdminSettings';
import SavedNotesPage from './components/SavedNotesPage/SavedNotesPage';

import TasksPage from './components/TasksPage/TasksPage';
import WorkerReports from './components/WorkerReports/WorkerReports';
import AIAssistant from './components/AIAssistant/AIAssistant';
import NavigationPanel from './components/NavigationPanel/NavigationPanel';
import MeetingTemplatesPage from './components/MeetingTemplatesPage/MeetingTemplatesPage';
import ReportsPage from './components/ReportsPage/ReportsPage';
import SubmitReportPage from './components/SubmitReportPage/SubmitReportPage';
import SharedReportsPage from './components/SharedReportsPage/SharedReportsPage';

import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAppContext();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Super Admin Redirect Component
const SuperAdminRedirect = ({ children }) => {
  const { user } = useAppContext();
  return user?.role === 'superadmin' ? <Navigate to="/super-admin" replace /> : children;
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
      <AIAssistant />
      <NavigationPanel />
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
          element={<LoginPage />}
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
            <SuperAdminRedirect>
              <Layout>
                <HomePage />
              </Layout>
            </SuperAdminRedirect>
          </ProtectedRoute>
        } />

        <Route path="/projects" element={
          <ProtectedRoute>
            <Layout>
              <ProjectsPage />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/:companyId/projects/new" element={
          <ProtectedRoute>
            <Layout>
              <ProjectDetailPage isNewProject={true} />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/:companyId/projects/:projectId" element={
          <ProtectedRoute>
            <Layout>
              <ProjectDetailPage />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Legacy routes without companyId - redirect */}
        <Route path="/projects/new" element={
          <ProtectedRoute>
            <Layout>
              <ProjectDetailPage isNewProject={true} />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/projects/:projectId" element={
          <ProtectedRoute>
            <Layout>
              <ProjectDetailPage />
            </Layout>
          </ProtectedRoute>
        } />





        <Route path="/projects/:projectId/report" element={
          <ProtectedRoute>
            <Layout>
              <ProjectReportPage />
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
                    <ProjectDetailPage />
                  </div>
                </div>
              </div>
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

        <Route path="/meeting-templates" element={
          <ProtectedRoute>
            <Layout>
              <MeetingTemplatesPage />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/:companyId/meeting-new" element={
          <ProtectedRoute>
            <Layout>
              <MeetingEditorPage />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/:companyId/meeting-editor/:meetingId" element={
          <ProtectedRoute>
            <Layout>
              <MeetingEditorPage />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Legacy routes */}
        <Route path="/meeting-new" element={
          <ProtectedRoute>
            <Layout>
              <MeetingEditorPage />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/meeting-editor/:meetingId" element={
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


        <Route path="/how-it-works" element={
          <ProtectedRoute>
            <Layout>
              <HowItWorksPage />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/ai-assistant" element={
          <ProtectedRoute>
            <Layout>
              <AIAssistantPage />
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

        <Route path="/user-management" element={
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



        <Route path="/projects/:projectId/tasks" element={
          <ProtectedRoute>
            <Layout>
              <TasksPage />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/projects/:projectId/worker-reports" element={
          <ProtectedRoute>
            <Layout>
              <WorkerReports />
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

        <Route path="/:companyId/submit-report" element={
          <ProtectedRoute>
            <Layout>
              <SubmitReportPage />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Legacy route */}
        <Route path="/submit-report" element={
          <ProtectedRoute>
            <Layout>
              <SubmitReportPage />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/shared-reports" element={
          <ProtectedRoute>
            <Layout>
              <SharedReportsPage />
            </Layout>
          </ProtectedRoute>
        } />





        {/* Admin Routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <Layout>
              <AdminDashboard />
            </Layout>
          </AdminRoute>
        } />

        <Route path="/admin/settings" element={
          <AdminRoute>
            <Layout>
              <CompanySettings />
            </Layout>
          </AdminRoute>
        } />

        <Route path="/admin/reports" element={
          <AdminRoute>
            <Layout>
              <AdminReports />
            </Layout>
          </AdminRoute>
        } />

        <Route path="/admin/audit-log" element={
          <AdminRoute>
            <Layout>
              <AdminAuditLog />
            </Layout>
          </AdminRoute>
        } />

        <Route path="/admin/analytics" element={
          <AdminRoute>
            <Layout>
              <AdminUserAnalytics />
            </Layout>
          </AdminRoute>
        } />

        <Route path="/admin/data-management" element={
          <AdminRoute>
            <Layout>
              <AdminDataManagement />
            </Layout>
          </AdminRoute>
        } />

        <Route path="/admin/payments" element={
          <AdminRoute>
            <Layout>
              <PaymentSubmission />
            </Layout>
          </AdminRoute>
        } />

        {/* Super Admin Routes */}
        <Route path="/super-admin" element={
          <SuperAdminRoute>
            <Layout>
              <SuperAdminPage />
            </Layout>
          </SuperAdminRoute>
        } />

        <Route path="/super-admin/payments" element={
          <SuperAdminRoute>
            <Layout>
              <PaymentVerification />
            </Layout>
          </SuperAdminRoute>
        } />

        <Route path="/super-admin/settings" element={
          <SuperAdminRoute>
            <Layout>
              <SuperAdminSettings />
            </Layout>
          </SuperAdminRoute>
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