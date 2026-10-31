import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { UserRole } from '../types/index.js';
import { ShieldCheck, Eye, EyeOff, Lock, Mail, Landmark, AlertCircle, ArrowRight } from 'lucide-react';
import api from '../api/client.js';

export const LoginPage: React.FC = () => {
  const { login, quickDemoLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('citizen@elmwood.gov');
  const [password, setPassword] = useState('Citizen123!');
  const [role, setRole] = useState<UserRole>('CITIZEN');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password modal state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password, role);
      if (res.success) {
        // Redirect to respective dashboard
        if (role === 'CITIZEN') navigate('/citizen');
        else if (role === 'HOSPITAL') navigate('/hospital');
        else if (role === 'OFFICER') navigate('/officer');
        else if (role === 'ADMIN') navigate('/admin');
      } else {
        setError(res.message || 'Login failed. Please verify credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Unexpected login error.');
    } finally {
      setLoading(false);
    }
  };

  const handleRolePreset = (r: UserRole) => {
    setRole(r);
    setError(null);
    if (r === 'CITIZEN') {
      setEmail('citizen@elmwood.gov');
      setPassword('Citizen123!');
    } else if (r === 'HOSPITAL') {
      setEmail('hospital@general.gov');
      setPassword('Hospital123!');
    } else if (r === 'OFFICER') {
      setEmail('officer@elmwood.gov');
      setPassword('Officer123!');
    } else if (r === 'ADMIN') {
      setEmail('admin@elmwood.gov');
      setPassword('Admin123!');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotMsg(res.data.message || 'Reset instructions sent to your email.');
    } catch {
      setForgotMsg('Password recovery dispatched.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Project Title and Logo */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full border-2 border-amber-500/50 p-1 bg-slate-900 flex items-center justify-center shadow-lg overflow-hidden">
            <img
              src="/src/assets/images/municipal_emblem_1793424324437.jpg"
              alt="Municipal Seal"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <h2 className="mt-4 text-2xl font-display font-extrabold text-slate-900 tracking-tight">
            Municipal Birth and Death Certificate Issuance and Digital Archive System
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Metropolitan Municipal Corporation of Elmwood · Statutory Portal
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-lg sm:px-10 space-y-6">
          {/* Quick Demo Credentials Banner */}
          <div className="bg-blue-50/70 border border-blue-200/80 p-3 rounded-md">
            <div className="text-[11px] font-bold text-blue-900 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Select Pre-configured Role:</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {(['CITIZEN', 'HOSPITAL', 'OFFICER', 'ADMIN'] as UserRole[]).map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => handleRolePreset(r)}
                  className={`py-1 text-xs font-semibold rounded text-center transition-colors cursor-pointer ${
                    role === r
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {r === 'OFFICER' ? 'Officer' : r.charAt(0) + r.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-md flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Portal Role Selection
              </label>
              <select
                value={role}
                onChange={(e) => handleRolePreset(e.target.value as UserRole)}
                className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent"
              >
                <option value="CITIZEN">Citizen (Public Applicant)</option>
                <option value="HOSPITAL">Hospital (Authorized Healthcare Facility)</option>
                <option value="OFFICER">Municipal Officer (Registrar / Verification Officer)</option>
                <option value="ADMIN">Admin (Chief Municipal Administrator)</option>
              </select>
            </div>

            {/* Email field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.gov"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent"
                />
              </div>
            </div>

            {/* Password field with Visibility Toggle */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-blue-800 focus:ring-blue-700"
                />
                <span className="text-slate-600 font-medium">Remember Me</span>
              </label>

              <button
                type="button"
                onClick={() => setForgotModalOpen(true)}
                className="text-blue-700 hover:text-blue-900 font-medium cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            {/* Sign In button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs rounded-md shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Authenticating with Municipal Database...' : 'Sign In'}
            </button>
          </form>

          {/* Citizen Registration Link */}
          <div className="pt-4 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-600">
              Applying as a new citizen?{' '}
              <Link to="/register" className="font-bold text-blue-800 hover:underline">
                Register Public Citizen Account
              </Link>
            </p>
            <div className="mt-2 text-[11px] text-slate-400">
              Note: Hospital, Officer, and Admin credentials are restricted and authorized by the Municipal Corporation.
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Municipal Password Recovery</h3>
            <p className="text-xs text-slate-600">
              Enter the authorized municipal email address registered to your account to receive statutory reset instructions.
            </p>
            <form onSubmit={handleForgotPassword} className="space-y-3">
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="Enter your registered email"
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
              {forgotMsg && (
                <div className="p-2 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs rounded">
                  {forgotMsg}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setForgotModalOpen(false);
                    setForgotMsg(null);
                  }}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs bg-blue-900 text-white font-medium rounded hover:bg-blue-800"
                >
                  Send Recovery Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
