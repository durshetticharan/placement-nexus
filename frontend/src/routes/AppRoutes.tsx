import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext';

// Auth pages
import Register from '../pages/auth/Register';
import VerifyOtp from '../pages/auth/VerifyOtp';
import Login from '../pages/auth/Login';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';

// Shared pages
import Unauthorized from '../pages/shared/Unauthorized';
import NotFound from '../pages/shared/NotFound';

// Role dashboards
import StudentDashboard   from '../pages/student/StudentDashboard';
import RecruiterDashboard from '../pages/recruiter/RecruiterDashboard';
import OfficerDashboard   from '../pages/officer/OfficerDashboard';
import AlumniDashboard    from '../pages/alumni/AlumniDashboard';
import AlumniProfile      from '../pages/alumni/AlumniProfile';
import ReferralManagement from '../pages/alumni/ReferralManagement';

// Officer-specific pages
import PendingApprovals from '../pages/officer/PendingApprovals';
import OfficerAssessmentList from '../pages/officer/AssessmentList';
import OfficerAssessmentBuilder from '../pages/officer/AssessmentBuilder';

// Student-specific assessment pages
import StudentAssessmentList from '../pages/student/AssessmentList';
import StudentAssessmentHistory from '../pages/student/AssessmentHistory';
import TakeAssessment from '../pages/student/TakeAssessment';
import AssessmentResult from '../pages/student/AssessmentResult';

// Phase 7 — Career Development
import CareerDevelopment from '../pages/student/CareerDevelopment';
import CareerManagement from '../pages/officer/CareerManagement';

// Phase 8 — Skill Gap Analysis
import SkillGapAnalysis from '../pages/student/SkillGapAnalysis';

// Phase 9 — Placement Readiness
import PlacementReadiness from '../pages/student/PlacementReadiness';

// Phase 10 — Companies + Recruiters
import RecruiterProfilePage from '../pages/recruiter/RecruiterProfile';
import CompanyManagement from '../pages/recruiter/CompanyManagement';
import CompanyDirectory from '../pages/officer/CompanyDirectory';
import RecruiterDirectory from '../pages/officer/RecruiterDirectory';

// Phase 11 — Placement Drives
import RecruiterDriveManagement from '../pages/recruiter/DriveManagement';
import RecruiterDriveDetails from '../pages/recruiter/DriveDetails';
import OfficerDriveDirectory from '../pages/officer/DriveDirectory';
import OfficerDriveDetails from '../pages/officer/DriveDetails';
import StudentDriveList from '../pages/student/DriveList';
import StudentDriveDetails from '../pages/student/DriveDetails';
import StudentMyApplications from '../pages/student/MyApplications';

// Phase 14 — Alumni & Referrals
import AlumniDirectory    from '../pages/student/AlumniDirectory';
import ReferralRequests   from '../pages/student/ReferralRequests';

// Phase 15 — Experiences & Resources
import DriveExperiences      from '../pages/student/DriveExperiences';
import DriveExperienceDetail from '../pages/student/DriveExperienceDetail';
import DriveResources        from '../pages/student/DriveResources';
import ContentModeration     from '../pages/officer/ContentModeration';

// Phase 16 — Mentorship
// (Routes for mentorship not fully implemented here yet)

// Phase 17 — AI Features
import ResumeAI    from '../pages/student/ResumeAI';
import CareerAI    from '../pages/student/CareerAI';
import InterviewAI from '../pages/student/InterviewAI';

// Phase 18 — Analytics & Notifications
import NotificationPreferences from '../pages/NotificationPreferences';
import StudentAnalytics from '../pages/student/StudentAnalytics';
import RecruiterAnalytics from '../pages/recruiter/RecruiterAnalytics';
import OfficerAnalytics from '../pages/officer/OfficerAnalytics';

// Legacy placeholder kept for backward compat
import Dashboard from '../pages/Dashboard';

// ─── ProtectedRoute ───────────────────────────────────────────────────────────

interface ProtectedRouteProps {
  children: React.ReactElement;
  /** If provided, only users whose role is in this list can render children. Others → /login */
  allowedRoles?: UserRole[];
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        Loading…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Wrong role — send to unauthorized
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"                element={<Navigate to="/login" replace />} />
      <Route path="/register"        element={<Register />} />
      <Route path="/verify-otp"      element={<VerifyOtp />} />
      <Route path="/login"           element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password"  element={<ResetPassword />} />
      
      {/* Shared */}
      <Route path="/unauthorized"    element={<Unauthorized />} />

      {/* Legacy generic dashboard (kept for backward compat) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Role-specific dashboards */}
      <Route
        path="/dashboard/student"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/recruiter"
        element={
          <ProtectedRoute allowedRoles={['RECRUITER']}>
            <RecruiterDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/officer"
        element={
          <ProtectedRoute allowedRoles={['PLACEMENT_OFFICER']}>
            <OfficerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/alumni"
        element={
          <ProtectedRoute allowedRoles={['ALUMNI']}>
            <AlumniDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/alumni/profile"
        element={
          <ProtectedRoute allowedRoles={['ALUMNI']}>
            <AlumniProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/alumni/referrals"
        element={
          <ProtectedRoute allowedRoles={['ALUMNI']}>
            <ReferralManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/alumni/experiences"
        element={
          <ProtectedRoute allowedRoles={['ALUMNI']}>
            <DriveExperiences />
          </ProtectedRoute>
        }
      />
      <Route
        path="/alumni/resources"
        element={
          <ProtectedRoute allowedRoles={['ALUMNI']}>
            <DriveResources />
          </ProtectedRoute>
        }
      />

      {/* Officer-only Assessment Engine Tools */}
      <Route
        path="/officer/pending-approvals"
        element={
          <ProtectedRoute allowedRoles={['PLACEMENT_OFFICER']}>
            <PendingApprovals />
          </ProtectedRoute>
        }
      />
      <Route
        path="/officer/content-moderation"
        element={
          <ProtectedRoute allowedRoles={['PLACEMENT_OFFICER']}>
            <ContentModeration />
          </ProtectedRoute>
        }
      />
      <Route
        path="/officer/assessments"
        element={
          <ProtectedRoute allowedRoles={['PLACEMENT_OFFICER']}>
            <OfficerAssessmentList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/officer/assessments/new"
        element={
          <ProtectedRoute allowedRoles={['PLACEMENT_OFFICER']}>
            <OfficerAssessmentBuilder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/officer/assessments/:id"
        element={
          <ProtectedRoute allowedRoles={['PLACEMENT_OFFICER']}>
            <OfficerAssessmentBuilder />
          </ProtectedRoute>
        }
      />

      {/* Student-only Assessment Engine Pages */}
      <Route
        path="/student/assessments"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentAssessmentList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/assessments/history"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentAssessmentHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/assessments/:id/take"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <TakeAssessment />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/attempts/:id/result"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <AssessmentResult />
          </ProtectedRoute>
        }
      />

      {/* Phase 7 — Career Development Routes */}
      <Route
        path="/student/career"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <CareerDevelopment />
          </ProtectedRoute>
        }
      />
      <Route
        path="/officer/career"
        element={
          <ProtectedRoute allowedRoles={['PLACEMENT_OFFICER']}>
            <CareerManagement />
          </ProtectedRoute>
        }
      />

      {/* Phase 8 — Skill Gap Analysis */}
      <Route
        path="/student/skill-gap"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <SkillGapAnalysis />
          </ProtectedRoute>
        }
      />

      {/* Phase 9 — Placement Readiness */}
      <Route
        path="/student/readiness"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <PlacementReadiness />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/drives"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentDriveList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/drives/:id"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentDriveDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/applications"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentMyApplications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/alumni"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <AlumniDirectory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/referrals"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <ReferralRequests />
          </ProtectedRoute>
        }
      />

      {/* Phase 15 — Experiences & Resources */}
      <Route
        path="/student/experiences"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <DriveExperiences />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/experiences/:id"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <DriveExperienceDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/resources"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <DriveResources />
          </ProtectedRoute>
        }
      />

      {/* Phase 17 — AI Features */}
      <Route
        path="/student/ai/resume"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <ResumeAI />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/ai/career"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <CareerAI />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/ai/interview"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <InterviewAI />
          </ProtectedRoute>
        }
      />

      {/* Phase 10 — Recruiter Workspace */}
      <Route
        path="/recruiter/profile"
        element={
          <ProtectedRoute allowedRoles={['RECRUITER']}>
            <RecruiterProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/company"
        element={
          <ProtectedRoute allowedRoles={['RECRUITER']}>
            <CompanyManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/drives"
        element={
          <ProtectedRoute allowedRoles={['RECRUITER']}>
            <RecruiterDriveManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/drives/:id"
        element={
          <ProtectedRoute allowedRoles={['RECRUITER']}>
            <RecruiterDriveDetails />
          </ProtectedRoute>
        }
      />

      {/* Phase 10 — Officer Company & Recruiter Management */}
      <Route
        path="/officer/companies"
        element={
          <ProtectedRoute allowedRoles={['PLACEMENT_OFFICER']}>
            <CompanyDirectory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/officer/recruiters"
        element={
          <ProtectedRoute allowedRoles={['PLACEMENT_OFFICER']}>
            <RecruiterDirectory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/officer/drives"
        element={
          <ProtectedRoute allowedRoles={['PLACEMENT_OFFICER']}>
            <OfficerDriveDirectory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/officer/drives/:id"
        element={
          <ProtectedRoute allowedRoles={['PLACEMENT_OFFICER']}>
            <OfficerDriveDetails />
          </ProtectedRoute>
        }
      />

      {/* Phase 18 — Analytics & Notifications */}
      <Route
        path="/preferences"
        element={
          <ProtectedRoute>
            <NotificationPreferences />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/analytics"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/analytics"
        element={
          <ProtectedRoute allowedRoles={['RECRUITER']}>
            <RecruiterAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/officer/analytics"
        element={
          <ProtectedRoute allowedRoles={['PLACEMENT_OFFICER']}>
            <OfficerAnalytics />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
