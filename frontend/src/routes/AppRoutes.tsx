import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext';

// Auth pages
import Register from '../pages/auth/Register';
import VerifyOtp from '../pages/auth/VerifyOtp';
import Login from '../pages/auth/Login';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';

// Role dashboards
import StudentDashboard   from '../pages/student/StudentDashboard';
import RecruiterDashboard from '../pages/recruiter/RecruiterDashboard';
import OfficerDashboard   from '../pages/officer/OfficerDashboard';
import AlumniDashboard    from '../pages/alumni/AlumniDashboard';

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
    // Wrong role — send to login (or could send to their own dashboard)
    return <Navigate to="/login" replace />;
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

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
