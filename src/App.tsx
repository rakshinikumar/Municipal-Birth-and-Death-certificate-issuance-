import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';

// Pages
import { LandingPage } from './pages/LandingPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { CitizenDashboard } from './pages/CitizenDashboard.js';
import { BirthApplicationPage } from './pages/BirthApplicationPage.js';
import { DeathApplicationPage } from './pages/DeathApplicationPage.js';
import { HospitalDashboard } from './pages/HospitalDashboard.js';
import { OfficerDashboard } from './pages/OfficerDashboard.js';
import { AdminDashboard } from './pages/AdminDashboard.js';
import { DigitalArchivePage } from './pages/DigitalArchivePage.js';
import { VerifyCertificatePage } from './pages/VerifyCertificatePage.js';

// Protected Route Guard
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-xs text-slate-500">
        Loading municipal session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Restricted Access</h2>
        <p className="text-xs text-slate-600 mb-4">
          This portal module is restricted to authorized {allowedRoles.join(' or ')} personnel.
        </p>
        <Navigate to="/" replace />
      </div>
    );
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-900 selection:text-white">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/archive" element={<DigitalArchivePage />} />
              <Route path="/verify" element={<VerifyCertificatePage />} />

              {/* Citizen Routes */}
              <Route
                path="/citizen"
                element={
                  <ProtectedRoute allowedRoles={['CITIZEN', 'ADMIN']}>
                    <CitizenDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/citizen/apply-birth"
                element={
                  <ProtectedRoute allowedRoles={['CITIZEN', 'ADMIN']}>
                    <BirthApplicationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/citizen/apply-death"
                element={
                  <ProtectedRoute allowedRoles={['CITIZEN', 'ADMIN']}>
                    <DeathApplicationPage />
                  </ProtectedRoute>
                }
              />

              {/* Hospital Routes */}
              <Route
                path="/hospital"
                element={
                  <ProtectedRoute allowedRoles={['HOSPITAL', 'ADMIN']}>
                    <HospitalDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Municipal Officer Routes */}
              <Route
                path="/officer"
                element={
                  <ProtectedRoute allowedRoles={['OFFICER', 'ADMIN']}>
                    <OfficerDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
