import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client.js';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Clock,
  User,
  Shield,
  ArrowRight,
} from 'lucide-react';

export const BirthApplicationPage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    childName: '',
    dateOfBirth: '',
    timeOfBirth: '09:30',
    gender: 'Female',
    weightAtBirth: '3.2 kg',
    isHospitalBirth: true,
    hospitalName: 'Elmwood City General Hospital',
    hospitalRegNo: '',
    placeOfBirth: 'Elmwood City General Hospital, Ward 4B',
    fatherName: '',
    fatherAadharOrNationalId: '',
    fatherOccupation: 'Civil Engineer',
    fatherNationality: 'Citizen',
    motherName: '',
    motherAadharOrNationalId: '',
    motherOccupation: 'Teacher',
    motherNationality: 'Citizen',
    permanentAddress: '',
    presentAddressAtBirth: '',
    priority: 'NORMAL',
  });

  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);

  // Pre-fill demo data button for convenient testing
  const handlePreFillHospitalMatchDemo = () => {
    setFormData({
      childName: 'Liam Alexander Vance',
      dateOfBirth: '2026-10-15',
      timeOfBirth: '08:30',
      gender: 'Male',
      weightAtBirth: '3.4 kg',
      isHospitalBirth: true,
      hospitalName: 'Elmwood City General Hospital',
      hospitalRegNo: 'CGH-BRT-2026-0042',
      placeOfBirth: 'Maternity Ward 4A, Elmwood City General Hospital',
      fatherName: 'Julian Vance',
      fatherAadharOrNationalId: 'ELM-CIT-448102',
      fatherOccupation: 'Physician',
      fatherNationality: 'Citizen',
      motherName: 'Elena Vance',
      motherAadharOrNationalId: 'ELM-CIT-991204',
      motherOccupation: 'Biochemist',
      motherNationality: 'Citizen',
      permanentAddress: '12 Kensington Gardens, Elmwood',
      presentAddressAtBirth: '12 Kensington Gardens, Elmwood',
      priority: 'NORMAL',
    });
  };

  const handlePreFillHomeBirthDemo = () => {
    setFormData({
      childName: 'Lucas James Gallagher',
      dateOfBirth: '2026-10-24',
      timeOfBirth: '11:45',
      gender: 'Male',
      weightAtBirth: '3.1 kg',
      isHospitalBirth: false,
      hospitalName: '',
      hospitalRegNo: '',
      placeOfBirth: 'Home Residence (24 Maplewood Avenue, Elmwood)',
      fatherName: 'Michael Gallagher',
      fatherAadharOrNationalId: 'ELM-CIT-330192',
      fatherOccupation: 'Accountant',
      fatherNationality: 'Citizen',
      motherName: 'Sarah Gallagher',
      motherAadharOrNationalId: 'ELM-CIT-882103',
      motherOccupation: 'Journalist',
      motherNationality: 'Citizen',
      permanentAddress: '24 Maplewood Avenue, Elmwood',
      presentAddressAtBirth: '24 Maplewood Avenue, Elmwood',
      priority: 'NORMAL',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.childName || !formData.dateOfBirth || !formData.fatherName || !formData.motherName) {
      setError('Please fill in all mandatory legal details (Child Name, Date, Father, and Mother).');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, val]) => {
        data.append(key, String(val));
      });

      if (files) {
        for (let i = 0; i < files.length; i++) {
          data.append('documents', files[i]);
        }
      }

      const res = await api.post('/citizen/birth-application', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setSubmissionResult(res.data);
      } else {
        setError(res.data.message || 'Submission failed.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error submitting application.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
          <Link to="/citizen" className="hover:text-blue-900">
            Citizen Dashboard
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">New Birth Certificate Application</span>
        </div>

        {submissionResult ? (
          /* Submission Feedback Screen */
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-700" />
              </div>
              <h2 className="text-2xl font-display font-bold text-slate-900">
                Application Successfully Logged!
              </h2>
              <p className="text-xs text-slate-600">
                Your statutory birth registration application has been recorded in the Municipal Corporation database.
              </p>
              <div className="pt-2">
                <span className="text-xs text-slate-500">Official Reference Number: </span>
                <span className="font-mono text-base font-bold text-blue-900 bg-blue-50 px-3 py-1 rounded border border-blue-200">
                  {submissionResult.applicationNumber}
                </span>
              </div>
            </div>

            {/* Hospital Database Matching Result Card */}
            <div className="p-4 rounded-lg border bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Automated Hospital Database Matching
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded ${
                    submissionResult.matchingResult?.isMatched
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  {submissionResult.status}
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                {submissionResult.matchingResult?.summary}
              </p>

              {submissionResult.matchingResult?.isMatched ? (
                <div className="text-xs text-emerald-800 bg-emerald-50/80 p-2.5 rounded border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    Your hospital reference was automatically correlated with authorized institutional medical records. The application has been placed in the Municipal Officer review queue for final statutory approval.
                  </span>
                </div>
              ) : (
                <div className="text-xs text-amber-800 bg-amber-50/80 p-2.5 rounded border border-amber-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    No matching institutional hospital record was found. Your application is routed to the Manual Field & Documentary Verification workflow.
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 pt-4">
              <Link
                to="/citizen"
                className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs rounded transition-colors"
              >
                Back to Dashboard & Track
              </Link>
            </div>
          </div>
        ) : (
          /* Application Form */
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
              <div>
                <h1 className="text-xl font-display font-bold text-slate-900">
                  Form 1: Birth Registration & Certificate Application
                </h1>
                <p className="text-xs text-slate-500">
                  Registration of Births and Deaths Act · All entries must match primary hospital discharge documents
                </p>
              </div>

              {/* Demo Pre-fill helpers */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-medium">Quick Fill:</span>
                <button
                  type="button"
                  onClick={handlePreFillHospitalMatchDemo}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  Hospital Delivery (Auto-Match)
                </button>
                <button
                  type="button"
                  onClick={handlePreFillHomeBirthDemo}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-sky-50 text-sky-800 border border-sky-200 rounded hover:bg-sky-100 transition-colors cursor-pointer"
                >
                  Home Birth (Manual)
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Section 1: Child Particulars */}
              <div className="space-y-4">
                <div className="text-xs font-bold text-blue-900 uppercase tracking-wider border-b border-slate-100 pb-1">
                  1. Particulars of the Child
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Legal Name of the Child *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.childName}
                      onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                      placeholder="e.g. Liam Alexander Vance"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Time of Birth
                      </label>
                      <input
                        type="time"
                        value={formData.timeOfBirth}
                        onChange={(e) => setFormData({ ...formData, timeOfBirth: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Gender *
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Weight at Birth
                    </label>
                    <input
                      type="text"
                      value={formData.weightAtBirth}
                      onChange={(e) => setFormData({ ...formData, weightAtBirth: e.target.value })}
                      placeholder="e.g. 3.4 kg"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Place of Occurrence */}
              <div className="space-y-4">
                <div className="text-xs font-bold text-blue-900 uppercase tracking-wider border-b border-slate-100 pb-1">
                  2. Place of Event & Hospital Details
                </div>

                <div className="flex items-center gap-6 text-xs font-medium text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="birthPlaceType"
                      checked={formData.isHospitalBirth}
                      onChange={() => setFormData({ ...formData, isHospitalBirth: true })}
                      className="text-blue-900"
                    />
                    <span>Institutional / Hospital Delivery</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="birthPlaceType"
                      checked={!formData.isHospitalBirth}
                      onChange={() => setFormData({ ...formData, isHospitalBirth: false })}
                      className="text-blue-900"
                    />
                    <span>Home Birth (Non-Institutional)</span>
                  </label>
                </div>

                {formData.isHospitalBirth ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Hospital / Healthcare Center Name *
                      </label>
                      <input
                        type="text"
                        value={formData.hospitalName}
                        onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                        placeholder="e.g. Elmwood City General Hospital"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Hospital Registration / Discharge Number (for Automated Match)
                      </label>
                      <input
                        type="text"
                        value={formData.hospitalRegNo}
                        onChange={(e) => setFormData({ ...formData, hospitalRegNo: e.target.value })}
                        placeholder="e.g. CGH-BRT-2026-0042"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                      />
                      <span className="text-[11px] text-slate-500">
                        Matches against official hospital report database automatically.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Residential Address of Home Delivery *
                    </label>
                    <input
                      type="text"
                      value={formData.placeOfBirth}
                      onChange={(e) => setFormData({ ...formData, placeOfBirth: e.target.value })}
                      placeholder="Street, House No, Neighborhood"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                    />
                  </div>
                )}
              </div>

              {/* Section 3: Parental Details */}
              <div className="space-y-4">
                <div className="text-xs font-bold text-blue-900 uppercase tracking-wider border-b border-slate-100 pb-1">
                  3. Lineage & Parent Particulars
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Father's Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fatherName}
                      onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                      placeholder="e.g. Julian Vance"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mother's Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.motherName}
                      onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                      placeholder="e.g. Elena Vance"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Permanent Residential Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.permanentAddress}
                      onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
                      placeholder="Address of parents in Elmwood"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Processing Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                    >
                      <option value="NORMAL">Standard Municipal Turnaround (3-5 Days)</option>
                      <option value="URGENT">Urgent Civic Passport / Emergency Dispatch</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 4: Supporting Document Uploads with OCR */}
              <div className="space-y-4">
                <div className="text-xs font-bold text-blue-900 uppercase tracking-wider border-b border-slate-100 pb-1">
                  4. Evidentiary Document Uploads & Tesseract OCR Analysis
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <Upload className="w-4 h-4 text-blue-700" />
                    <span>Upload Hospital Discharge Summary or Midwife Declaration (PDF, JPG, PNG) *</span>
                  </div>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setFiles(e.target.files)}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-900 file:text-white hover:file:bg-blue-800"
                  />
                  <div className="text-[11px] text-slate-500">
                    System will automatically execute OCR text extraction and cross-check named entities against the application.
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <Link
                  to="/citizen"
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs rounded shadow-xs transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Processing OCR & Hospital Match...' : 'Submit Birth Application'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
