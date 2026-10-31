import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { Application } from '../types/index.js';
import { StatusBadge } from '../components/StatusBadge.js';
import {
  FileText,
  PlusCircle,
  Download,
  AlertCircle,
  Clock,
  CheckCircle2,
  Upload,
  Eye,
  RefreshCw,
  Search,
  ChevronRight,
  FileQuestion,
  Calendar,
  Building,
  UserCheck,
} from 'lucide-react';

export const CitizenDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  // Resubmission modal state
  const [resubmitModalOpen, setResubmitModalOpen] = useState(false);
  const [resubmitApp, setResubmitApp] = useState<Application | null>(null);
  const [resubmitRemarks, setResubmitRemarks] = useState('');
  const [resubmitFiles, setResubmitFiles] = useState<FileList | null>(null);
  const [resubmitSubmitting, setResubmitSubmitting] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/citizen/my-applications');
      if (res.data.success) {
        setApplications(res.data.applications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleOpenResubmit = (app: Application) => {
    setResubmitApp(app);
    setResubmitRemarks('');
    setResubmitFiles(null);
    setResubmitModalOpen(true);
  };

  const handleResubmitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resubmitApp) return;

    setResubmitSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('citizenResponse', resubmitRemarks);
      if (resubmitApp.documentRequests && resubmitApp.documentRequests.length > 0) {
        formData.append('requestId', resubmitApp.documentRequests[0].id);
      }
      if (resubmitFiles) {
        for (let i = 0; i < resubmitFiles.length; i++) {
          formData.append('evidence', resubmitFiles[i]);
        }
      }

      const res = await api.post(`/citizen/applications/${resubmitApp.id}/resubmit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setResubmitModalOpen(false);
        fetchApplications();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setResubmitSubmitting(false);
    }
  };

  const handleDownload = (certId: string, certType: string, regNo: string) => {
    window.open(`/api/certificates/download/${certId}`, '_blank');
  };

  // Stats calculation
  const totalApps = applications.length;
  const approvedCount = applications.filter((a) => a.status === 'APPROVED').length;
  const inReviewCount = applications.filter((a) =>
    ['SUBMITTED', 'HOSPITAL_MATCHED', 'HOSPITAL_NOT_MATCHED', 'MANUAL_VERIFICATION', 'UNDER_REVIEW', 'RESUBMITTED'].includes(a.status)
  ).length;
  const actionRequiredCount = applications.filter((a) => a.status === 'DOCUMENTS_REQUESTED').length;

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Welcome Header */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-blue-800 uppercase tracking-wider">Citizen Services Dashboard</div>
            <h1 className="text-2xl font-display font-bold text-slate-900 mt-1">
              Welcome, {user?.name || 'Citizen'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Official Civil Registration Portal · Track birth and death certificate requests & statutory archives
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/citizen/apply-birth"
              className="px-4 py-2 bg-blue-800 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Birth Certificate</span>
            </Link>

            <Link
              to="/citizen/apply-death"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Death Certificate</span>
            </Link>
          </div>
        </div>

        {/* 4 Metric KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="text-xs text-slate-500 font-medium">Total Applications</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">{totalApps}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="text-xs text-slate-500 font-medium">In Verification / Review</div>
            <div className="text-2xl font-bold font-mono text-blue-700 mt-1 tabular-nums">{inReviewCount}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="text-xs text-slate-500 font-medium">Action Required (Docs)</div>
            <div className="text-2xl font-bold font-mono text-orange-600 mt-1 tabular-nums">{actionRequiredCount}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="text-xs text-slate-500 font-medium">Approved & Issued</div>
            <div className="text-2xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">{approvedCount}</div>
          </div>
        </div>

        {/* Action Required Banner if documents requested */}
        {actionRequiredCount > 0 && (
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-orange-900">Municipal Officer Action Required</h4>
                <p className="text-xs text-orange-800 mt-0.5">
                  You have {actionRequiredCount} application(s) awaiting additional supporting documents. Please upload the requested files to avoid processing delay.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Applications List Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="font-bold text-sm text-slate-900">My Registered Applications</div>
            <button
              onClick={fetchApplications}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading your applications...</div>
          ) : applications.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-sm font-semibold text-slate-700">No applications on record</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You have not registered any birth or death certificates yet. Click one of the buttons above to initiate a registration.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Application Reference</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Subject Name</th>
                    <th className="py-3 px-4">Submission Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Officer Remarks</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {applications.map((app) => {
                    const isBirth = app.applicationType === 'BIRTH';
                    const subjectName = isBirth
                      ? app.birthDetails?.childName
                      : app.deathDetails?.deceasedName;

                    return (
                      <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-blue-900">
                          {app.applicationNumber}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-700">{app.applicationType}</span>
                        </td>
                        <td className="py-3 px-4 font-medium">{subjectName || 'N/A'}</td>
                        <td className="py-3 px-4 tabular-nums text-slate-600">
                          {new Date(app.submissionDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                          {app.officerRemarks || (
                            <span className="text-slate-400 italic">No remarks yet</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                          >
                            Details
                          </button>

                          {app.status === 'DOCUMENTS_REQUESTED' && (
                            <button
                              onClick={() => handleOpenResubmit(app)}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 rounded transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <Upload className="w-3 h-3" />
                              <span>Upload Docs</span>
                            </button>
                          )}

                          {app.status === 'APPROVED' && app.certificate && (
                            <button
                              onClick={() =>
                                handleDownload(app.certificate!.id, app.certificate!.certificateType, app.certificate!.registrationNumber)
                              }
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-600 rounded transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              <span>Certificate</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Details Modal */}
        {selectedApp && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <div className="text-xs font-mono font-bold text-blue-900">{selectedApp.applicationNumber}</div>
                  <h3 className="font-display font-bold text-lg text-slate-900">
                    {selectedApp.applicationType} Certificate Application Details
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {/* Status and Progress Timeline */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Current Status:</span>
                  <StatusBadge status={selectedApp.status} />
                </div>
                {selectedApp.statusHistory && selectedApp.statusHistory.length > 0 && (
                  <div className="pt-2 border-t border-slate-200">
                    <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Application Status History
                    </div>
                    <div className="space-y-2">
                      {selectedApp.statusHistory.map((h) => (
                        <div key={h.id} className="text-xs flex items-start gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                          <div>
                            <div className="font-semibold text-slate-800">
                              {h.newStatus}
                              <span className="text-[10px] text-slate-400 ml-2 font-mono">
                                {new Date(h.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div className="text-slate-600 text-[11px]">{h.remarks || h.changeReason}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Event Particulars */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Subject Name:</span>
                  <span className="font-bold text-slate-800">
                    {selectedApp.birthDetails?.childName || selectedApp.deathDetails?.deceasedName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Date of Event:</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(
                      selectedApp.birthDetails?.dateOfBirth || selectedApp.deathDetails?.dateOfDeath || ''
                    ).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Place of Occurrence:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedApp.birthDetails?.placeOfBirth || selectedApp.deathDetails?.placeOfDeath}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Hospital Facility:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedApp.birthDetails?.hospitalName || selectedApp.deathDetails?.hospitalName || 'Home / Non-institutional'}
                  </span>
                </div>
              </div>

              {/* Uploaded Documents */}
              {selectedApp.documents && selectedApp.documents.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-700 mb-2">Uploaded Supporting Documents:</div>
                  <div className="space-y-1.5">
                    {selectedApp.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-2 bg-slate-50 border border-slate-200 rounded text-xs flex items-center justify-between"
                      >
                        <span className="font-medium text-slate-800">{doc.fileName}</span>
                        <span className="text-[11px] text-slate-500">{doc.documentType}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certificate Download if approved */}
              {selectedApp.status === 'APPROVED' && selectedApp.certificate && (
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-teal-900">Statutory Certificate Issued</div>
                    <div className="text-xs font-mono text-teal-800">
                      Reg No: {selectedApp.certificate.registrationNumber}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleDownload(
                        selectedApp.certificate!.id,
                        selectedApp.certificate!.certificateType,
                        selectedApp.certificate!.registrationNumber
                      )
                    }
                    className="px-4 py-2 bg-teal-800 hover:bg-teal-700 text-white font-semibold text-xs rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF Certificate</span>
                  </button>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Resubmit Additional Documents Modal */}
        {resubmitModalOpen && resubmitApp && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4">
              <h3 className="font-display font-bold text-base text-slate-900">
                Upload Additional Requested Documents
              </h3>
              <p className="text-xs text-slate-600">
                Application: <span className="font-mono font-bold">{resubmitApp.applicationNumber}</span>
              </p>

              {resubmitApp.officerRemarks && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded text-xs text-orange-900">
                  <span className="font-bold">Officer Request: </span>
                  {resubmitApp.officerRemarks}
                </div>
              )}

              <form onSubmit={handleResubmitSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Attach Additional Supporting Documents (PDF, JPG, PNG)
                  </label>
                  <input
                    type="file"
                    multiple
                    required
                    onChange={(e) => setResubmitFiles(e.target.files)}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-900 hover:file:bg-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Applicant Remarks / Clarifications
                  </label>
                  <textarea
                    rows={3}
                    value={resubmitRemarks}
                    onChange={(e) => setResubmitRemarks(e.target.value)}
                    placeholder="Provide details regarding the documents attached..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResubmitModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resubmitSubmitting}
                    className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs rounded transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {resubmitSubmitting ? 'Resubmitting Evidence...' : 'Resubmit Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
