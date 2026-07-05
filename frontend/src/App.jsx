import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProjectProvider } from './context/ProjectContext';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Users from './pages/Users.jsx';
import Projects from './pages/Projects.jsx';
import CreateUser from './pages/CreateUser.jsx';
import EditUser from './pages/EditUser.jsx';
import UserDetails from './pages/UserDetails.jsx';
import MinutesOfMeeting from './pages/MinutesOfMeeting.jsx';
import CreateMinutes from './pages/CreateMinutes.jsx';
import MomTracker from './pages/MomTracker.jsx';
import ProductionIssues from './pages/ProductionIssues.jsx';
import CreateIssue from './pages/CreateIssue.jsx';
import IssueDetails from './pages/IssueDetails.jsx';
import WhatsAppSettings from './pages/WhatsAppSettings.jsx';
import Requirements from './pages/Requirements.jsx';
import CreateRequirement from './pages/CreateRequirement.jsx';
import QAIssuesManagement from './pages/QAIssuesManagement.jsx';
import QAAutomationTab from './pages/QAAutomationTab.jsx';
import CreateQAIssue from './pages/CreateQAIssue.jsx';
import QAReports from './pages/QAReports.jsx';
import DocumentGenerator from './pages/DocumentGenerator.jsx';
import SystemSettings from './pages/SystemSettings.jsx';
import Search from './pages/Search.jsx';
import Reports from './pages/Reports.jsx';
import Layout from './components/Layout.jsx';

function App() {
  return (
    <ProjectProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/minutes" element={<MinutesOfMeeting />} />
            <Route path="/minutes/create" element={<CreateMinutes />} />
            <Route path="/minutes/tracker/:id" element={<MomTracker />} />
            <Route path="/issues" element={<ProductionIssues />} />
            <Route path="/issues/create" element={<CreateIssue />} />
            <Route path="/issues/:id" element={<IssueDetails />} />
            <Route path="/users" element={<Users />} />
            <Route path="/users/create" element={<CreateUser />} />
            <Route path="/users/:id" element={<UserDetails />} />
            <Route path="/users/edit/:id" element={<EditUser />} />
            <Route path="/whatsapp-settings" element={<WhatsAppSettings />} />
            <Route path="/requirements" element={<Requirements />} />
            <Route path="/requirements/create" element={<CreateRequirement />} />
            <Route path="/documents" element={<DocumentGenerator />} />
            <Route path="/qa-issues" element={<QAIssuesManagement />} />
            <Route path="/qa-reports" element={<QAReports />} />
            <Route path="/qa-automation" element={<QAAutomationTab />} />
            <Route path="/qa-issues/create" element={<CreateQAIssue />} />
            <Route path="/settings" element={<SystemSettings />} />
            <Route path="/search" element={<Search />} />
            <Route path="/reports" element={<Reports />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ProjectProvider>
  );
}

export default App;
