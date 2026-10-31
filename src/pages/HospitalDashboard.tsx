import React, { useState, useEffect } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { HospitalReport } from '../types/index.js';
import {
  Building2,
  FilePlus2,
  CheckCircle2,
  Clock,
  Search,
  Upload,
  AlertCircle,
  FileText,
  ShieldCheck,
  Check,
  X,
  RefreshCw,
} from 'lucide-react';

export const HospitalDashboard: React.FC = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    totalReports: 0,
    birthReports: 0,
    deathReports: 0,
    pendingConfirmations: 0,
  });
  const [reports, setReports] = useState<HospitalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'BIRTH' | 'DEATH'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Report Modal states
  const [reportModalType, setReportModalType] = useState<'BIRTH' | 'DEATH' | null>(null);
  const [reportFormData, setReportFormData] = useState({
    hospitalRegistrationNo: '',
    childOrDeceasedName: '',
    eventDate: '',
    gender: 'Female',
    placeOfEvent: 'Maternity Ward 4A, Elmwood City General Hospital',
    fatherName: '',
    motherName: '',
    spouseName: '',
    causeOfDeath: '',
    informantName: '',
    doctorName: 'Dr. Eleanor Vance, MD',
    medicalSummary: 'Healthy live single birth. Full term normal delivery.',
  });
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Verification response modal
  const [verifyModalReport, setVerifyModalReport] = useState<HospitalReport | null>(null);
  const [verifyRemarks, setVerifyRemarks] = useState('');
  const [verifying, setVerifying] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [dashRes, reportsRes] = await Promise.all([
        api.get('/hospital/dashboard'),
        api.get(`/hospital/reports?type=${typeFilter === 'ALL' ? '' : typeFilter}&search=${searchTerm}`),
      ]);

      if (dashRes.data.success) {
        setStats(dashRes.data.stats);
      }
      if (reportsRes.data.success) {
        setReports(reportsRes.data.reports || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [typeFilter, searchTerm]);

  const openNewReportModal = (type: 'BIRTH' | 'DEATH') => {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const prefix = type === 'BIRTH' ? 'CGH-BRT' : 'CGH-DTH';
    setReportFormData({
      hospitalRegistrationNo: `${prefix}-${year}-${rand}`,
      childOrDeceasedName: '',
      eventDate: new Date().toISOString().slice(0, 10),
      gender: 'Female',
      placeOfEvent: 'Elmwood City General Hospital',
      fatherName: '',
      motherName: '',
      spouseName: '',
      causeOfDeath: type === 'DEATH' ? 'Cardiopulmonary Arrest' : '',
      informantName: '',
      doctorName: 'Dr. Eleanor Vance, MD',
      medicalSummary: type === 'BIRTH' ? 'Normal delivery, vigorous cry, normal APGAR.' : 'Medical cause of death certified.',
    });
    setReportFile(null);
    setModalError(null);
    setReportModalType(type);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportModalType) return;
    setModalError(null);
    setModalSubmitting(true);

    try {
      const data = new FormData();
      data.append('reportType', reportModalType);
      Object.entries(reportFormData).forEach(([key, val]) => {
        data.append(key, String(val));
      });
      if (reportFile) {
        data.append('document', reportFile);
      }

      const res = await api.post('/hospital/reports', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setReportModalType(null);
        fetchDashboardData();
      } else {
        setModalError(res.data.message || 'Report submission failed.');
      }
    } catch (err: any) {
      setModalError(err.response?.data?.message || err.message || 'Error saving report.');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleConfirmVerification = async (reportId: string, status: 'VERIFIED' | 'PENDING_CONFIRMATION') => {
    setVerifying(true);
    try {
      const res = await api.patch(`/hospital/reports/${reportId}/verify`, {
        confirmationStatus: status,
        remarks: verifyRemarks || 'Institutional records re-confirmed by Chief Medical Registrar.',
      });
      if (res.data.success) {
        setVerifyModalReport(null);
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Hospital Facility Profile Header */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-lg flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-display font-bold text-slate-900">
                  {user?.details?.hospitalName || 'Elmwood City General Hospital'}
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Authorized Facility
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-4">
                <span>Code: <strong className="text-slate-800 font-mono">{user?.details?.hospitalCode || 'HOSP-METRO-01'}</strong></span>
                <span>·</span>
                <span>License: <strong className="text-slate-800 font-mono">{user?.details?.licenseNo || 'LIC-MED-2024-8841'}</strong></span>
                <span>·</span>
                <span>Registrar: <strong className="text-slate-800">{user?.details?.contactPerson || 'Dr. Eleanor Vance'}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => openNewReportModal('BIRTH')}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>Record Birth Report</span>
            </button>

            <button
              onClick={() => openNewReportModal('DEATH')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>Record Death Report</span>
            </button>
          </div>
        </div>

        {/* Metric KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="text-xs text-slate-500 font-medium">Total Institutional Reports</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">{stats.totalReports}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="text-xs text-slate-500 font-medium">Birth Reports Recorded</div>
            <div className="text-2xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">{stats.birthReports}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="text-xs text-slate-500 font-medium">Death Reports Recorded</div>
            <div className="text-2xl font-bold font-mono text-purple-700 mt-1 tabular-nums">{stats.deathReports}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="text-xs text-slate-500 font-medium">Officer Confirmation Requests</div>
            <div className="text-2xl font-bold font-mono text-amber-600 mt-1 tabular-nums">{stats.pendingConfirmations}</div>
          </div>
        </div>

        {/* Submitted Hospital Reports Table with Filter and Search */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-sm text-slate-900">Hospital Master Vital Events Registry</div>
              <p className="text-xs text-slate-500">
                Institutional medical records used by Municipal Corporation matching engine to authenticate citizen claims
              </p>
            </div>

            {/* Segmented Filter Control adhering to Section 1.A */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  onClick={() => setTypeFilter('ALL')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    typeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({stats.totalReports})
                </button>
                <button
                  onClick={() => setTypeFilter('BIRTH')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    typeFilter === 'BIRTH' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Births ({stats.birthReports})
                </button>
                <button
                  onClick={() => setTypeFilter('DEATH')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    typeFilter === 'DEATH' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Deaths ({stats.deathReports})
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search name or reg #..."
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-700"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading hospital reports...</div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-sm font-semibold text-slate-700">No hospital reports found</div>
              <p className="text-xs text-slate-500">
                Click "Record Birth Report" or "Record Death Report" to feed the municipal database.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Hospital Reg #</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Child / Deceased Name</th>
                    <th className="py-3 px-4">Date of Event</th>
                    <th className="py-3 px-4">Gender</th>
                    <th className="py-3 px-4">Attending Doctor</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {report.hospitalRegistrationNo}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold ${
                            report.reportType === 'BIRTH' ? 'text-emerald-700' : 'text-purple-700'
                          }`}
                        >
                          {report.reportType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{report.childOrDeceasedName}</td>
                      <td className="py-3 px-4 tabular-nums text-slate-600">
                        {new Date(report.eventDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{report.gender}</td>
                      <td className="py-3 px-4 text-slate-600">{report.doctorName || 'Attending Physician'}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            report.status === 'VERIFIED'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {report.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setVerifyModalReport(report);
                            setVerifyRemarks('');
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                        >
                          Details / Confirm
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: New Birth or Death Report */}
        {reportModalType && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="font-display font-bold text-base text-slate-900">
                  Record Institutional {reportModalType} Report
                </h3>
                <button
                  onClick={() => setReportModalType(null)}
                  className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleReportSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Hospital Registration / Reference Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={reportFormData.hospitalRegistrationNo}
                      onChange={(e) =>
                        setReportFormData({ ...reportFormData, hospitalRegistrationNo: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-700"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {reportModalType === 'BIRTH' ? 'Child Full Name *' : 'Deceased Full Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={reportFormData.childOrDeceasedName}
                      onChange={(e) =>
                        setReportFormData({ ...reportFormData, childOrDeceasedName: e.target.value })
                      }
                      placeholder={reportModalType === 'BIRTH' ? 'Baby boy/girl or full name' : 'Full legal name'}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Date of Event *
                    </label>
                    <input
                      type="date"
                      required
                      value={reportFormData.eventDate}
                      onChange={(e) =>
                        setReportFormData({ ...reportFormData, eventDate: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-700"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Gender *
                    </label>
                    <select
                      value={reportFormData.gender}
                      onChange={(e) =>
                        setReportFormData({ ...reportFormData, gender: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-700"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {reportModalType === 'BIRTH' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Mother Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={reportFormData.motherName}
                        onChange={(e) =>
                          setReportFormData({ ...reportFormData, motherName: e.target.value })
                        }
                        placeholder="Mother's legal name"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-700"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Father Full Name
                      </label>
                      <input
                        type="text"
                        value={reportFormData.fatherName}
                        onChange={(e) =>
                          setReportFormData({ ...reportFormData, fatherName: e.target.value })
                        }
                        placeholder="Father's legal name"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-700"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Cause of Death *
                      </label>
                      <input
                        type="text"
                        required
                        value={reportFormData.causeOfDeath}
                        onChange={(e) =>
                          setReportFormData({ ...reportFormData, causeOfDeath: e.target.value })
                        }
                        placeholder="e.g. Cardiopulmonary Arrest"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-700"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Spouse or Parent Name
                      </label>
                      <input
                        type="text"
                        value={reportFormData.spouseName}
                        onChange={(e) =>
                          setReportFormData({ ...reportFormData, spouseName: e.target.value })
                        }
                        placeholder="Spouse or next of kin"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-700"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Attending Medical Doctor / Certifier
                    </label>
                    <input
                      type="text"
                      value={reportFormData.doctorName}
                      onChange={(e) =>
                        setReportFormData({ ...reportFormData, doctorName: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-700"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Attach Hospital Discharge / Death Memo PDF/Image
                    </label>
                    <input
                      type="file"
                      onChange={(e) => setReportFile(e.target.files ? e.target.files[0] : null)}
                      className="w-full text-[11px] text-slate-600 file:mr-2 file:py-1.5 file:px-2.5 file:rounded file:border-0 file:text-[11px] file:bg-slate-100 file:text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Medical Summary & Observations
                  </label>
                  <textarea
                    rows={2}
                    value={reportFormData.medicalSummary}
                    onChange={(e) =>
                      setReportFormData({ ...reportFormData, medicalSummary: e.target.value })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-700"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setReportModalType(null)}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalSubmitting}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold rounded cursor-pointer disabled:opacity-50"
                  >
                    {modalSubmitting ? 'Recording in Municipal Database...' : 'Record Official Hospital Report'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Confirm Officer Verification Request */}
        {verifyModalReport && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4 text-xs">
              <h3 className="font-display font-bold text-base text-slate-900">
                Hospital Verification Confirmation Desk
              </h3>
              <p className="text-slate-600">
                Confirm authenticity of medical record <strong className="font-mono">{verifyModalReport.hospitalRegistrationNo}</strong> for Municipal Officer review.
              </p>

              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
                <div><strong>Subject:</strong> {verifyModalReport.childOrDeceasedName}</div>
                <div><strong>Date:</strong> {new Date(verifyModalReport.eventDate).toLocaleDateString()}</div>
                <div><strong>Doctor:</strong> {verifyModalReport.doctorName}</div>
                <div><strong>Facility Ward:</strong> {verifyModalReport.placeOfEvent}</div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Hospital Registrar Endorsement Remarks
                </label>
                <textarea
                  rows={2}
                  value={verifyRemarks}
                  onChange={(e) => setVerifyRemarks(e.target.value)}
                  placeholder="Record re-verified against medical chart archives..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setVerifyModalReport(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={verifying}
                  onClick={() => handleConfirmVerification(verifyModalReport.id, 'VERIFIED')}
                  className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold rounded flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirm Verified</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
