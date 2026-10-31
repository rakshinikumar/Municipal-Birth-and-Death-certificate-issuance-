import React, { useState, useEffect } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { Application, ApplicationStatus } from '../types/index.js';
import { StatusBadge } from '../components/StatusBadge.js';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileQuestion,
  Search,
  Building2,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  FileText,
  Download,
  Eye,
  Check,
  ChevronRight,
  Filter,
  RefreshCw,
  CopyCheck,
  ExternalLink,
} from 'lucide-react';

export const OfficerDashboard: React.FC = () => {
  const { user } = useAuth();

  const [activeQueue, setActiveQueue] = useState<string>('hospital-matched');
  const [applications, setApplications] = useState<Application[]>([]);
  const [queueCounts, setQueueCounts] = useState({
    hospitalMatchedCount: 0,
    manualVerificationCount: 0,
    pendingCount: 0,
    docsRequestedCount: 0,
    resubmittedCount: 0,
    duplicatesCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'BIRTH' | 'DEATH'>('ALL');

  // Selected Application for Review Workspace
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [selectedAppDetail, setSelectedAppDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Officer Action Modals
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyRemarks, setVerifyRemarks] = useState('');
  const [requestDocsModalOpen, setRequestDocsModalOpen] = useState(false);
  const [requestedDocsText, setRequestedDocsText] = useState('');
  const [requestRemarks, setRequestRemarks] = useState('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approveRemarks, setApproveRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const fetchQueueData = async () => {
    setLoading(true);
    try {
      const typeParam = typeFilter === 'ALL' ? '' : `&type=${typeFilter}`;
      const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
      const res = await api.get(`/officer/queues?queue=${activeQueue}${typeParam}${searchParam}`);

      if (res.data.success) {
        setApplications(res.data.applications || []);
        setQueueCounts(res.data.queues || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData();
  }, [activeQueue, typeFilter, searchTerm]);

  const loadApplicationDetails = async (appId: string) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/citizen/applications/${appId}`);
      if (res.data.success) {
        setSelectedAppDetail(res.data.application);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSelectApp = (app: Application) => {
    setSelectedApp(app);
    setActionSuccessMsg(null);
    loadApplicationDetails(app.id);
  };

  // Action A: Verify Application
  const handleVerifyApplication = async () => {
    if (!selectedApp) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/officer/applications/${selectedApp.id}/verify`, {
        remarks: verifyRemarks || 'Officer verified evidentiary records against municipal database.',
        verificationType: selectedApp.hospitalMatchedRecordId ? 'AUTOMATED_HOSPITAL' : 'MANUAL_COMMUNITY',
        outcome: 'VERIFIED_OK',
      });
      if (res.data.success) {
        setVerifyModalOpen(false);
        setActionSuccessMsg('Verification remarks saved.');
        fetchQueueData();
        loadApplicationDetails(selectedApp.id);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error saving verification.');
    } finally {
      setActionLoading(false);
    }
  };

  // Action B: Request Additional Documents
  const handleRequestDocuments = async () => {
    if (!selectedApp || !requestedDocsText.trim()) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/officer/applications/${selectedApp.id}/request-documents`, {
        requestedDocuments: requestedDocsText,
        remarks: requestRemarks,
      });
      if (res.data.success) {
        setRequestDocsModalOpen(false);
        setActionSuccessMsg('Additional documents requested. Citizen has been notified.');
        fetchQueueData();
        loadApplicationDetails(selectedApp.id);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error requesting documents.');
    } finally {
      setActionLoading(false);
    }
  };

  // Action C: Reject Application
  const handleRejectApplication = async () => {
    if (!selectedApp || !rejectionReason.trim()) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/officer/applications/${selectedApp.id}/reject`, {
        rejectionReason,
      });
      if (res.data.success) {
        setRejectModalOpen(false);
        setActionSuccessMsg('Application rejected.');
        fetchQueueData();
        loadApplicationDetails(selectedApp.id);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error rejecting application.');
    } finally {
      setActionLoading(false);
    }
  };

  // Action E: Approve Application & Issue Certificate
  const handleApproveApplication = async () => {
    if (!selectedApp) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/officer/applications/${selectedApp.id}/approve`, {
        remarks: approveRemarks || 'Officially verified and approved by Municipal Registrar.',
      });
      if (res.data.success) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
        setActionSuccessMsg(
          `Approved! Certificate Issued with Registration No: ${res.data.registrationNumber}`
        );
        fetchQueueData();
        loadApplicationDetails(selectedApp.id);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error approving application.');
    } finally {
      setActionLoading(false);
    }
  };

  const queuesList = [
    { id: 'hospital-matched', label: 'Hospital Matched', count: queueCounts.hospitalMatchedCount, color: 'text-emerald-700 bg-emerald-50' },
    { id: 'manual-verification', label: 'Manual Verification', count: queueCounts.manualVerificationCount, color: 'text-sky-700 bg-sky-50' },
    { id: 'pending', label: 'Pending Reviews', count: queueCounts.pendingCount, color: 'text-blue-700 bg-blue-50' },
    { id: 'docs-requested', label: 'Docs Requested', count: queueCounts.docsRequestedCount, color: 'text-orange-700 bg-orange-50' },
    { id: 'resubmitted', label: 'Resubmitted', count: queueCounts.resubmittedCount, color: 'text-purple-700 bg-purple-50' },
    { id: 'duplicates', label: 'Duplicates Flagged', count: queueCounts.duplicatesCount, color: 'text-rose-700 bg-rose-50' },
    { id: 'approved', label: 'Approved & Issued', count: queueCounts.approvedCount, color: 'text-teal-700 bg-teal-50' },
    { id: 'rejected', label: 'Rejected', count: queueCounts.rejectedCount, color: 'text-slate-600 bg-slate-100' },
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Officer Header */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-900 text-white rounded-lg flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                Department of Vital Statistics · Registrar Review Console
              </div>
              <h1 className="text-xl font-display font-bold text-slate-900 mt-0.5">
                Municipal Officer Review Console
              </h1>
              <p className="text-xs text-slate-500">
                Officer: <strong className="text-slate-800">{user?.name || 'Officer Sarah Jenkins'}</strong> · Jurisdiction: Metropolitan Zone 1
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchQueueData}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Queues</span>
            </button>
          </div>
        </div>

        {/* 8 Specialized Queues Bar (Buttons/Tabs) adhering to Zero-Pill Section 1.A */}
        <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {queuesList.map((q) => (
              <button
                key={q.id}
                onClick={() => {
                  setActiveQueue(q.id);
                  setSelectedApp(null);
                  setSelectedAppDetail(null);
                }}
                className={`px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer ${
                  activeQueue === q.id
                    ? 'bg-slate-900 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{q.label}</span>
                <span
                  className={`text-[11px] font-mono font-bold px-1.5 py-0.2 rounded ${
                    activeQueue === q.id ? 'bg-slate-800 text-white' : q.color
                  }`}
                >
                  {q.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Filter Type:</span>
            <div className="inline-flex items-center gap-1 bg-slate-200/70 p-0.5 rounded text-xs">
              {(['ALL', 'BIRTH', 'DEATH'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                    typeFilter === t ? 'bg-white font-bold text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t === 'ALL' ? 'All Types' : t.charAt(0) + t.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search App #, child, or applicant..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-700"
            />
          </div>
        </div>

        {/* Split Screen Workspace: Left Queues Table, Right Detailed Evidence Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Applications Table (Left) */}
          <div className={`${selectedApp ? 'lg:col-span-5' : 'lg:col-span-12'} bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden`}>
            <div className="p-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {queuesList.find((q) => q.id === activeQueue)?.label} ({applications.length})
              </span>
              <span className="text-[11px] text-slate-500">Click a record to review</span>
            </div>

            {loading ? (
              <div className="p-10 text-center text-xs text-slate-500">Loading queue applications...</div>
            ) : applications.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="text-xs font-bold text-slate-700">No applications in this queue</div>
                <p className="text-[11px] text-slate-500">
                  Applications matching this queue status will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[700px] overflow-y-auto">
                {applications.map((app) => {
                  const isBirth = app.applicationType === 'BIRTH';
                  const subjectName = isBirth
                    ? app.birthDetails?.childName
                    : app.deathDetails?.deceasedName;
                  const isSelected = selectedApp?.id === app.id;

                  return (
                    <div
                      key={app.id}
                      onClick={() => handleSelectApp(app)}
                      className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer text-xs space-y-1.5 ${
                        isSelected ? 'bg-blue-50/80 border-l-4 border-l-blue-900' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-blue-950 text-xs">
                          {app.applicationNumber}
                        </span>
                        <StatusBadge status={app.status} />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{subjectName || 'Applicant Record'}</span>
                        <span className="text-[11px] font-semibold text-slate-500">{app.applicationType}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Submitted: {new Date(app.submissionDate).toLocaleDateString()}</span>
                        <span>{app.citizen?.user.name}</span>
                      </div>

                      {app.hospitalMatchedRecord && (
                        <div className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Matched Hospital Reg: {app.hospitalMatchedRecord.hospitalRegistrationNo}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detailed Verification Workspace (Right) */}
          {selectedApp && (
            <div className="lg:col-span-7 bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-6">
              {detailLoading ? (
                <div className="p-12 text-center text-xs text-slate-500">Loading evidentiary file...</div>
              ) : selectedAppDetail ? (
                <>
                  {/* Workspace Header */}
                  <div className="flex items-start justify-between pb-4 border-b border-slate-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {selectedAppDetail.applicationNumber}
                        </span>
                        <StatusBadge status={selectedAppDetail.status} />
                      </div>
                      <h2 className="text-lg font-display font-bold text-slate-900 mt-1">
                        {selectedAppDetail.applicationType} Certificate Review: {selectedAppDetail.birthDetails?.childName || selectedAppDetail.deathDetails?.deceasedName}
                      </h2>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Applicant: {selectedAppDetail.citizen?.user?.name} ({selectedAppDetail.citizen?.user?.email})
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedApp(null);
                        setSelectedAppDetail(null);
                      }}
                      className="text-slate-400 hover:text-slate-600 text-xs px-2 py-1 rounded bg-slate-100 cursor-pointer"
                    >
                      Close Pane
                    </button>
                  </div>

                  {actionSuccessMsg && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{actionSuccessMsg}</span>
                    </div>
                  )}

                  {/* Hospital Database Matching Analysis Card */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-blue-800" />
                        <span>Hospital Database Matching Engine</span>
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          selectedAppDetail.status === 'HOSPITAL_MATCHED'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}
                      >
                        {selectedAppDetail.status === 'HOSPITAL_MATCHED' ? 'Match Confirmed' : 'No Hospital Match'}
                      </span>
                    </div>

                    {selectedAppDetail.hospitalMatchedRecord ? (
                      <div className="space-y-2 text-xs">
                        <div className="p-2.5 bg-white rounded border border-slate-200 grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-slate-500 block">Matched Hospital Facility:</span>
                            <strong className="text-slate-800">
                              {selectedAppDetail.hospitalMatchedRecord.hospital?.hospitalName}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Hospital Registration No:</span>
                            <strong className="font-mono text-blue-900">
                              {selectedAppDetail.hospitalMatchedRecord.hospitalRegistrationNo}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Reported Child/Deceased:</span>
                            <span className="font-semibold">{selectedAppDetail.hospitalMatchedRecord.childOrDeceasedName}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Medical Report Date:</span>
                            <span className="font-semibold">{new Date(selectedAppDetail.hospitalMatchedRecord.eventDate).toLocaleDateString()}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-slate-500 block">Doctor / Medical Summary:</span>
                            <span className="text-slate-700 italic">
                              "{selectedAppDetail.hospitalMatchedRecord.medicalSummary}" — {selectedAppDetail.hospitalMatchedRecord.doctorName}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-800 bg-amber-50/60 p-2.5 rounded border border-amber-200">
                        No authorized hospital record matched this submission. Eligible for Manual Field Verification (home birth/death affidavit or community inquiry).
                      </p>
                    )}
                  </div>

                  {/* OCR Text Extraction & Discrepancies */}
                  {selectedAppDetail.documents && selectedAppDetail.documents.length > 0 && (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                      <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-purple-700" />
                          <span>Tesseract OCR Document Intelligence</span>
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {selectedAppDetail.documents.length} document(s) analyzed
                        </span>
                      </div>

                      <div className="space-y-2">
                        {selectedAppDetail.documents.map((doc: any) => (
                          <div key={doc.id} className="p-2.5 bg-white rounded border border-slate-200 text-xs space-y-1.5">
                            <div className="flex items-center justify-between font-semibold">
                              <span className="text-slate-800">{doc.fileName}</span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  doc.ocrResult?.matchingStatus === 'MATCHED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                OCR {doc.ocrResult?.matchingStatus || 'PROCESSED'} ({doc.ocrResult?.confidenceScore || 85}% conf)
                              </span>
                            </div>

                            {doc.ocrResult?.extractedText && (
                              <div className="p-2 bg-slate-100 rounded text-[11px] font-mono text-slate-700 max-h-24 overflow-y-auto whitespace-pre-wrap">
                                {doc.ocrResult.extractedText}
                              </div>
                            )}

                            {doc.ocrResult?.discrepancyNotes && (
                              <div className="text-[11px] text-amber-700 flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>Discrepancy Note: {doc.ocrResult.discrepancyNotes}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Duplicate Detection Section */}
                  {selectedAppDetail.duplicateRecords && selectedAppDetail.duplicateRecords.length > 0 && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-rose-900 font-bold">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>Potential Duplicate Record Detected in Digital Archive!</span>
                      </div>
                      {selectedAppDetail.duplicateRecords.map((dup: any) => (
                        <div key={dup.id} className="text-rose-800 text-[11px] bg-white p-2 rounded border border-rose-200">
                          <div><strong>Similarity Score:</strong> {dup.similarityScore}%</div>
                          <div><strong>Remarks:</strong> {dup.remarks}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Officer Action Buttons - Directly Updating DB */}
                  <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {/* Action A: Verify */}
                      <button
                        onClick={() => {
                          setVerifyRemarks('');
                          setVerifyModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs rounded transition-colors cursor-pointer"
                      >
                        Verify Record
                      </button>

                      {/* Action B: Request Docs */}
                      <button
                        onClick={() => {
                          setRequestedDocsText('');
                          setRequestRemarks('');
                          setRequestDocsModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs rounded transition-colors cursor-pointer"
                      >
                        Request Documents
                      </button>

                      {/* Action C: Reject */}
                      <button
                        onClick={() => {
                          setRejectionReason('');
                          setRejectModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white font-semibold text-xs rounded transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>

                    {/* Action E: Approve & Generate Certificate */}
                    {selectedAppDetail.status !== 'APPROVED' ? (
                      <button
                        onClick={handleApproveApplication}
                        disabled={actionLoading}
                        className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        <span>{actionLoading ? 'Generating PDF & QR...' : 'Approve & Issue Certificate'}</span>
                      </button>
                    ) : (
                      selectedAppDetail.certificate && (
                        <a
                          href={`/api/certificates/download/${selectedAppDetail.certificate.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs rounded shadow-xs transition-colors inline-flex items-center gap-1.5"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download Certificate PDF</span>
                        </a>
                      )
                    )}
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>

        {/* Modal: Verify Record */}
        {verifyModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4 text-xs">
              <h3 className="font-display font-bold text-base text-slate-900">
                Municipal Officer Record Verification
              </h3>
              <p className="text-slate-600">
                Log formal verification findings for application {selectedApp?.applicationNumber}.
              </p>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Verification Remarks & Observations
                </label>
                <textarea
                  rows={3}
                  value={verifyRemarks}
                  onChange={(e) => setVerifyRemarks(e.target.value)}
                  placeholder="Evidentiary discharge slip and lineage verified against municipal medical archives..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:bg-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setVerifyModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleVerifyApplication}
                  className="px-4 py-1.5 bg-blue-900 text-white font-semibold rounded hover:bg-blue-800"
                >
                  Save Verification & Set Under Review
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Request Additional Documents */}
        {requestDocsModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4 text-xs">
              <h3 className="font-display font-bold text-base text-slate-900">
                Request Additional Documents from Citizen
              </h3>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Missing Document Name(s) *
                </label>
                <input
                  type="text"
                  required
                  value={requestedDocsText}
                  onChange={(e) => setRequestedDocsText(e.target.value)}
                  placeholder="e.g. Attending Midwife Affidavit, Parent Marriage Certificate"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Instructions for Applicant *
                </label>
                <textarea
                  rows={3}
                  required
                  value={requestRemarks}
                  onChange={(e) => setRequestRemarks(e.target.value)}
                  placeholder="Please provide notarized proof of home birth..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:bg-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRequestDocsModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleRequestDocuments}
                  className="px-4 py-1.5 bg-orange-600 text-white font-semibold rounded hover:bg-orange-500"
                >
                  Dispatch Request to Citizen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Reject Application */}
        {rejectModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4 text-xs">
              <h3 className="font-display font-bold text-base text-rose-900">
                Reject Statutory Application
              </h3>
              <p className="text-slate-600">
                Rejection permanently blocks certificate generation and dispatches legal notice to the applicant.
              </p>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Statutory Rejection Reason (Mandatory) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Falsified documentation detected / Irreconcilable identity discrepancy..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:bg-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleRejectApplication}
                  className="px-4 py-1.5 bg-rose-700 text-white font-semibold rounded hover:bg-rose-600"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
