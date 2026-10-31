import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Shield, Bell, User as UserIcon, LogOut, CheckCheck, Landmark } from 'lucide-react';
import { UserRole } from '../types/index.js';

export const Navbar: React.FC = () => {
  const { user, logout, quickDemoLogin, notifications, unreadNotifsCount, markNotificationAsRead } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Municipal Corporation Identification Strip */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Landmark className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-medium text-slate-200">Metropolitan Municipal Corporation of Elmwood</span>
          <span className="text-slate-500">|</span>
          <span className="hidden sm:inline text-slate-400">Department of Vital Statistics & Public Archives</span>
        </div>

        {/* Quick Demo Role Switcher */}
        <div className="flex items-center gap-2">
          <span className="hidden md:inline text-slate-400 text-[11px]">Quick Demo Role:</span>
          <div className="inline-flex items-center gap-1">
            {(['CITIZEN', 'HOSPITAL', 'OFFICER', 'ADMIN'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={async () => {
                  await quickDemoLogin(r);
                  if (r === 'CITIZEN') navigate('/citizen');
                  else if (r === 'HOSPITAL') navigate('/hospital');
                  else if (r === 'OFFICER') navigate('/officer');
                  else if (r === 'ADMIN') navigate('/admin');
                }}
                className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                  user?.role === r
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title={`Switch demo session to ${r}`}
              >
                {r === 'OFFICER' ? 'Officer' : r.charAt(0) + r.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar - Following Top Bar Contract: 3 zones separated by gap-8 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single Brand wordmark element */}
          <Link to="/" className="flex items-center gap-3 whitespace-nowrap shrink-0 group">
            <div className="w-10 h-10 rounded-full border border-amber-500/40 p-0.5 bg-slate-900 flex items-center justify-center shadow-xs overflow-hidden">
              <img
                src="/src/assets/images/municipal_emblem_1793424324437.jpg"
                alt="Municipal Emblem"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="leading-tight">
              <span className="font-display font-bold text-base tracking-tight text-slate-900 block group-hover:text-blue-900 transition-colors">
                Municipal Vital Records
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Digital Archive & Issuance System</span>
            </div>
          </Link>

          {/* Zone 2: 4-5 concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link
              to="/"
              className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 ${
                isActive('/') ? 'text-blue-900 font-semibold' : ''
              }`}
            >
              Overview
            </Link>
            <Link
              to="/citizen"
              className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 ${
                isActive('/citizen') ? 'text-blue-900 font-semibold' : ''
              }`}
            >
              Citizen Portal
            </Link>
            <Link
              to="/hospital"
              className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 ${
                isActive('/hospital') ? 'text-blue-900 font-semibold' : ''
              }`}
            >
              Hospital Registry
            </Link>
            <Link
              to="/officer"
              className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 ${
                isActive('/officer') ? 'text-blue-900 font-semibold' : ''
              }`}
            >
              Officer Review
            </Link>
            <Link
              to="/archive"
              className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 ${
                isActive('/archive') ? 'text-blue-900 font-semibold' : ''
              }`}
            >
              Digital Archive
            </Link>
            <Link
              to="/verify"
              className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 ${
                isActive('/verify') ? 'text-blue-900 font-semibold' : ''
              }`}
            >
              Verify QR
            </Link>
            {user?.role === 'ADMIN' && (
              <Link
                to="/admin"
                className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 ${
                  isActive('/admin') ? 'text-blue-900 font-semibold' : ''
                }`}
              >
                Admin
              </Link>
            )}
          </nav>

          {/* Zone 3: 1 primary action / account controls */}
          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Notifications Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifMenu(!showNotifMenu)}
                    className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadNotifsCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                        {unreadNotifsCount}
                      </span>
                    )}
                  </button>

                  {showNotifMenu && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 p-2 z-50">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 px-2">
                        <span className="text-xs font-bold text-slate-800">Notifications ({notifications.length})</span>
                      </div>
                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-500">No recent notifications</div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => {
                                markNotificationAsRead(n.id);
                                if (n.link) navigate(n.link);
                                setShowNotifMenu(false);
                              }}
                              className={`p-2.5 text-xs rounded hover:bg-slate-50 cursor-pointer transition-colors ${
                                !n.isRead ? 'bg-blue-50/60 font-medium' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-slate-800">{n.title}</span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-slate-600 leading-snug">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Profile Info & Sign Out */}
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="hidden sm:block text-right">
                    <div className="text-xs font-bold text-slate-800">{user.name}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      {user.role}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-900 rounded-md hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 shadow-xs"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="hidden sm:inline-block px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0"
                >
                  Citizen Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
