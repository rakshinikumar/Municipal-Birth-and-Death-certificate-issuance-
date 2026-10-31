import React, { useState, useEffect } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { User, AuditLog, Application } from '../types/index.js';
import {
  ShieldAlert,
  Users,
  Building2,
  FileText,
  Database,
  Activity,
  UserPlus,
  CheckCircle2,
  Lock,
  Search,
  Settings,
  BarChart3,
  RefreshCw,
  Sliders,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS' | 'HOSPITALS' | 'OFFICERS' | 'ASSIGN' | 'AUDIT_LOGS' | 'SETTINGS'>('OVERVIEW');
  const [stats, setStats] = useState<any | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [allApplications, setAllApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // New hospital account form
  const [newHospData, setNewHospData] = useState({
    hospitalName: '',
    email: '',
    password: 'Hospital123!',
    hospitalCode: '',
    licenseNo: '',
    address: 'Elmwood Medical District',
    contactPerson: '',
    contactPhone: '',
  });

  // New officer account form
  const [newOfficerData, setNewOfficerData] = useState({
    name: '',
    email: '',
    password: 'Officer123!',
    officerCode: '',
    designation: 'Registrar of Vital Statistics',
    phone: '',
  });

  // Assign application state
  const [selectedAppId, setSelectedAppId] = useState('');
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/dashboard-stats');
      if (res.data.success) {
        setStats(res.data.stats);
        setRecentLogs(res.data.recentAuditLogs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      if (res.data.success) {
        setUsersList(res.data.users || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchApplicationsForAssignment = async () => {
    try {
      const res = await api.get('/officer/queues?queue=pending&limit=30');
      if (res.data.success) {
        setAllApplications(res.data.applications || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchApplicationsForAssignment();
  }, [activeTab]);

  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/hospitals', {
        ...newHospData,
        name: newHospData.hospitalName,
      });
      if (res.data.success) {
        alert('Hospital account successfully authorized.');
        fetchUsers();
        setNewHospData({
          hospitalName: '',
          email: '',
          password: 'Hospital123!',
          hospitalCode: '',
          licenseNo: '',
          address: 'Elmwood Medical District',
          contactPerson: '',
          contactPhone: '',
        });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating hospital account.');
    }
  };

  const handleCreateOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/officers', newOfficerData);
      if (res.data.success) {
        alert('Municipal Officer account successfully created.');
        fetchUsers();
        setNewOfficerData({
          name: '',
          email: '',
          password: 'Officer123!',
          officerCode: '',
          designation: 'Registrar of Vital Statistics',
          phone: '',
        });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating officer account.');
    }
  };

  const handleToggleHospitalAuth = async (hospitalId: string) => {
    try {
      await api.patch(`/admin/hospitals/${hospitalId}/toggle-auth`);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId || !selectedOfficerId) return;
    try {
      const res = await api.post(`/admin/applications/${selectedAppId}/assign`, {
        officerId: selectedOfficerId,
      });
      if (res.data.success) {
        setAssignSuccess(res.data.message);
        fetchApplicationsForAssignment();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error assigning application.');
    }
  };

  const officers = usersList.filter((u) => u.role === 'OFFICER');

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-slate-900 text-amber-400 rounded-lg flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                Executive Municipal Administration
              </div>
              <h1 className="text-xl font-display font-bold text-slate-900 mt-0.5">
                Municipal Corporation Governance & System Administration
              </h1>
              <p className="text-xs text-slate-500">
                Administrator: <strong className="text-slate-800">{user?.name || 'Chief Administrator Arthur Vance'}</strong> · Full System Authority
              </p>
            </div>
          </div>

          <button
            onClick={fetchStats}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Stats</span>
          </button>
        </div>

        {/* Tab Controls conforming to Section 1.A */}
        <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(
              [
                { id: 'OVERVIEW', label: 'Overview Metrics' },
                { id: 'USERS', label: 'Citizens & Accounts' },
                { id: 'HOSPITALS', label: 'Authorize Hospitals' },
                { id: 'OFFICERS', label: 'Officers & Registrars' },
                { id: 'ASSIGN', label: 'Assign Queues' },
                { id: 'AUDIT_LOGS', label: 'Security Audit Logs' },
                { id: 'SETTINGS', label: 'Municipal Settings' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-slate-200">
                <div className="text-xs text-slate-500 font-medium">Total Registered Citizens</div>
                <div className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
                  {stats?.totalCitizens ?? 0}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200">
                <div className="text-xs text-slate-500 font-medium">Authorized Hospitals</div>
                <div className="text-2xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
                  {stats?.totalHospitals ?? 0}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200">
                <div className="text-xs text-slate-500 font-medium">Municipal Officers</div>
                <div className="text-2xl font-bold font-mono text-blue-700 mt-1 tabular-nums">
                  {stats?.totalOfficers ?? 0}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200">
                <div className="text-xs text-slate-500 font-medium">Archived Vital Records</div>
                <div className="text-2xl font-bold font-mono text-amber-700 mt-1 tabular-nums">
                  {stats?.totalArchiveRecords ?? 0}
                </div>
              </div>
            </div>

            {/* Application Breakdown */}
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-display font-bold text-sm text-slate-900">
                Live Status Breakdown of Municipal Applications
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {stats?.statusBreakdown &&
                  Object.entries(stats.statusBreakdown).map(([status, count]) => (
                    <div key={status} className="p-3 bg-slate-50 rounded border border-slate-200">
                      <div className="text-slate-500 text-[11px] font-semibold">{status}</div>
                      <div className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                        {String(count)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Recent Audit Logs */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 font-bold text-sm text-slate-900">
                Recent Statutory Audit Events
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {recentLogs.map((log) => (
                  <div key={log.id} className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">{log.action}</span>
                      <span className="text-slate-500 ml-2">by {log.user?.name || 'System Actor'}</span>
                      <span className="text-slate-400 text-[11px] ml-2">({log.entityType})</span>
                    </div>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Users Management */}
        {activeTab === 'USERS' && (
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="font-bold text-sm text-slate-900">Registered Municipal Portal Users ({usersList.length})</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold">{u.name}</td>
                      <td className="py-3 px-4 font-mono">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">{u.phone || 'N/A'}</td>
                      <td className="py-3 px-4 text-slate-500">{new Date(u.createdAt as any).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Authorize Hospitals */}
        {activeTab === 'HOSPITALS' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-display font-bold text-sm text-slate-900">
                Authorize New Healthcare Facility
              </h3>
              <form onSubmit={handleCreateHospital} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hospital Name *</label>
                  <input
                    type="text"
                    required
                    value={newHospData.hospitalName}
                    onChange={(e) => setNewHospData({ ...newHospData, hospitalName: e.target.value })}
                    placeholder="e.g. St. Jude Memorial Hospital"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Hospital Code *</label>
                    <input
                      type="text"
                      required
                      value={newHospData.hospitalCode}
                      onChange={(e) => setNewHospData({ ...newHospData, hospitalCode: e.target.value })}
                      placeholder="e.g. HOSP-METRO-02"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">License No *</label>
                    <input
                      type="text"
                      required
                      value={newHospData.licenseNo}
                      onChange={(e) => setNewHospData({ ...newHospData, licenseNo: e.target.value })}
                      placeholder="e.g. LIC-MED-9901"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono focus:bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Authorized Login Email *</label>
                  <input
                    type="email"
                    required
                    value={newHospData.email}
                    onChange={(e) => setNewHospData({ ...newHospData, email: e.target.value })}
                    placeholder="hospital@stjude.gov"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Contact Officer</label>
                    <input
                      type="text"
                      value={newHospData.contactPerson}
                      onChange={(e) => setNewHospData({ ...newHospData, contactPerson: e.target.value })}
                      placeholder="Dr. John Doe"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                    <input
                      type="text"
                      value={newHospData.contactPhone}
                      onChange={(e) => setNewHospData({ ...newHospData, contactPhone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded cursor-pointer mt-2"
                >
                  Authorize Hospital Account
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 font-bold text-sm text-slate-900">
                Authorized Hospitals on Municipal Network
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {usersList
                  .filter((u) => u.role === 'HOSPITAL')
                  .map((u) => (
                    <div key={u.id} className="p-4 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-slate-500 text-[11px] font-mono mt-0.5">
                          Code: {(u as any).hospitalProfile?.hospitalCode || 'HOSP'} · License: {(u as any).hospitalProfile?.licenseNo || 'LIC'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleHospitalAuth((u as any).hospitalProfile?.id)}
                          className={`px-3 py-1 text-xs font-semibold rounded cursor-pointer ${
                            (u as any).hospitalProfile?.authorized !== false
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {(u as any).hospitalProfile?.authorized !== false ? 'Authorized' : 'Suspended'}
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Officers Management */}
        {activeTab === 'OFFICERS' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-display font-bold text-sm text-slate-900">
                Register Municipal Verification Officer
              </h3>
              <form onSubmit={handleCreateOfficer} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Officer Name *</label>
                  <input
                    type="text"
                    required
                    value={newOfficerData.name}
                    onChange={(e) => setNewOfficerData({ ...newOfficerData, name: e.target.value })}
                    placeholder="Officer Sarah Jenkins"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Officer Code *</label>
                    <input
                      type="text"
                      required
                      value={newOfficerData.officerCode}
                      onChange={(e) => setNewOfficerData({ ...newOfficerData, officerCode: e.target.value })}
                      placeholder="REG-OFF-442"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                    <input
                      type="text"
                      value={newOfficerData.designation}
                      onChange={(e) => setNewOfficerData({ ...newOfficerData, designation: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Official Municipal Email *</label>
                  <input
                    type="email"
                    required
                    value={newOfficerData.email}
                    onChange={(e) => setNewOfficerData({ ...newOfficerData, email: e.target.value })}
                    placeholder="officer2@elmwood.gov"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded cursor-pointer mt-2"
                >
                  Create Municipal Officer Account
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 font-bold text-sm text-slate-900">
                Municipal Registrars on Duty ({officers.length})
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {officers.map((o) => (
                  <div key={o.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{o.name}</div>
                      <div className="text-slate-500 text-[11px]">
                        Code: {(o as any).officerProfile?.officerCode || 'REG'} · Designation: {(o as any).officerProfile?.designation}
                      </div>
                    </div>
                    <span className="font-mono text-slate-600">{o.email}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Assign Applications to Officers */}
        {activeTab === 'ASSIGN' && (
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-display font-bold text-sm text-slate-900">
              Assign Pending Review Applications to Officers
            </h3>
            {assignSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded">
                {assignSuccess}
              </div>
            )}
            <form onSubmit={handleAssign} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs items-end">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Pending Application</label>
                <select
                  value={selectedAppId}
                  onChange={(e) => setSelectedAppId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono"
                >
                  <option value="">-- Choose Application --</option>
                  {allApplications.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.applicationNumber} ({app.applicationType}) - {app.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assign to Municipal Officer</label>
                <select
                  value={selectedOfficerId}
                  onChange={(e) => setSelectedOfficerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded"
                >
                  <option value="">-- Choose Officer --</option>
                  {officers.map((o) => (
                    <option key={(o as any).officerProfile?.id || o.id} value={(o as any).officerProfile?.id || o.id}>
                      {o.name} ({(o as any).officerProfile?.officerCode})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="py-2 px-4 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded cursor-pointer"
              >
                Assign Application
              </button>
            </form>
          </div>
        )}

        {/* Tab 6: Security Audit Logs */}
        {activeTab === 'AUDIT_LOGS' && (
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 font-bold text-sm text-slate-900">
              Statutory Security & Access Audit Log Ledger
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {recentLogs.map((log) => (
                <div key={log.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="text-slate-500 ml-2">Actor: {log.user?.name || 'System Actor'}</span>
                    <span className="text-slate-400 text-[11px] ml-2">Entity: {log.entityType}</span>
                    {log.detailsJson && (
                      <div className="text-[11px] font-mono text-slate-600 mt-0.5">
                        {log.detailsJson}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-[11px] text-slate-400 font-mono">
                    <div>{new Date(log.createdAt).toLocaleString()}</div>
                    <div>IP: {log.ipAddress || '127.0.0.1'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 7: Settings */}
        {activeTab === 'SETTINGS' && (
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4 max-w-2xl text-xs">
            <h3 className="font-display font-bold text-sm text-slate-900">
              Municipal Vital Statistics Corporation Policy Settings
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Municipal Authority Name</label>
                <input
                  type="text"
                  readOnly
                  defaultValue="Metropolitan Municipal Corporation of Elmwood"
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded text-slate-700"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chief Registrar & Commissioner Title</label>
                <input
                  type="text"
                  readOnly
                  defaultValue="Hon. Arthur Vance, IAS - Executive Registrar of Births & Deaths"
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded text-slate-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Automated Hospital Match Sensitivity</label>
                  <select className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded">
                    <option>High Strictness (Score ≥ 65% + Reg #)</option>
                    <option>Standard Strictness (Score ≥ 60%)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duplicate Record Detection Sensitivity</label>
                  <select className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded">
                    <option>Strict Archive Scan (Threshold 70%)</option>
                    <option>Lenient Scan (Threshold 85%)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
