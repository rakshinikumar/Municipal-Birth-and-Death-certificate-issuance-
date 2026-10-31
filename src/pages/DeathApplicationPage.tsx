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
} from 'lucide-react';

export const DeathApplicationPage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    deceasedName: '',
    dateOfDeath: '',
    timeOfDeath: '14:20',
    gender: 'Male',
    age: '72',
    isHospitalDeath: true,
    hospitalName: 'Elmwood City General Hospital',
    hospitalRegNo: '',
    placeOfDeath: 'ICU Bed 8, Elmwood City General Hospital',
    causeOfDeath: '',
    medicalAttendant: 'Dr. Henry Ward, MD',
    fatherOrSpouseName: '',
    spouseName: '',
    motherName: '',
    informantName: '',
    informantRelation: 'Spouse',
    permanentAddress: '',
    priority: 'NORMAL',
  });

  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);

  const handlePreFillHospitalMatchDemo = () => {
    setFormData({
      deceasedName: 'Robert Thomas Miller',
      dateOfDeath: '2026-10-10',
      timeOfDeath: '21:40',
      gender: 'Male',
      age: '76',
      isHospitalDeath: true,
      hospitalName: 'Elmwood City General Hospital',
      hospitalRegNo: 'CGH-DTH-2026-0019',
      placeOfDeath: 'ICU Bed 8, Elmwood City General Hospital',
      causeOfDeath: 'Acute Myocardial Infarction secondary to Coronary Artery Disease',
      medicalAttendant: 'Dr. Henry Ward, MD, Cardiology',
      fatherOrSpouseName: 'William Miller',
      spouseName: 'Martha Miller',
      motherName: 'Catherine Miller',
      informantName: 'Martha Miller',
      informantRelation: 'Spouse',
      permanentAddress: '512 Oakwood Terrace, Elmwood',
      priority: 'NORMAL',
    });
  };

  const handlePreFillHomeDeathDemo = () => {
    setFormData({
      deceasedName: 'Evelyn Claire Holloway',
      dateOfDeath: '2026-10-18',
      timeOfDeath: '06:15',
      gender: 'Female',
      age: '89',
      isHospitalDeath: false,
      hospitalName: '',
      hospitalRegNo: '',
      placeOfDeath: 'Home Residence (109 Birchwood Lane, Elmwood)',
      causeOfDeath: 'Natural Causes / Cardiopulmonary Senescence',
      medicalAttendant: 'Dr. Nathan Gray, Family Physician',
      fatherOrSpouseName: 'Harold Holloway (Deceased)',
      spouseName: 'Harold Holloway',
      motherName: 'Grace Davies',
      informantName: 'Charles Holloway',
      informantRelation: 'Son',
      permanentAddress: '109 Birchwood Lane, Elmwood',
      priority: 'NORMAL',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.deceasedName || !formData.dateOfDeath || !formData.causeOfDeath || !formData.informantName) {
      setError('Please fill in mandatory fields: Deceased Name, Date, Cause of Death, and Informant.');
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

      const res = await api.post('/citizen/death-application', data, {
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
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
          <Link to="/citizen" className="hover:text-blue-900">
            Citizen Dashboard
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">New Death Certificate Application</span>
        </div>

        {submissionResult ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-700" />
              </div>
              <h2 className="text-2xl font-display font-bold text-slate-900">
                Death Registration Application Logged!
              </h2>
              <p className="text-xs text-slate-600">
                Official death record declaration has been recorded in the statutory registry.
              </p>
              <div className="pt-2">
                <span className="text-xs text-slate-500">Official Reference Number: </span>
                <span className="font-mono text-base font-bold text-blue-900 bg-blue-50 px-3 py-1 rounded border border-blue-200">
                  {submissionResult.applicationNumber}
                </span>
              </div>
            </div>

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
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
              <div>
                <h1 className="text-xl font-display font-bold text-slate-900">
                  Form 2: Death Registration & Certificate Application
                </h1>
                <p className="text-xs text-slate-500">
                  Statutory civil registration declaration under the Registration of Births and Deaths Act
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-medium">Quick Fill:</span>
                <button
                  type="button"
                  onClick={handlePreFillHospitalMatchDemo}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  Hospital Occurrence (Auto-Match)
                </button>
                <button
                  type="button"
                  onClick={handlePreFillHomeDeathDemo}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-sky-50 text-sky-800 border border-sky-200 rounded hover:bg-sky-100 transition-colors cursor-pointer"
                >
                  Home Occurrence (Manual)
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
              {/* Section 1: Deceased Details */}
              <div className="space-y-4">
                <div className="text-xs font-bold text-blue-900 uppercase tracking-wider border-b border-slate-100 pb-1">
                  1. Particulars of the Deceased
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Legal Name of the Deceased *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.deceasedName}
                      onChange={(e) => setFormData({ ...formData, deceasedName: e.target.value })}
                      placeholder="e.g. Robert Thomas Miller"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Date of Death *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.dateOfDeath}
                        onChange={(e) => setFormData({ ...formData, dateOfDeath: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Time of Death
                      </label>
                      <input
                        type="time"
                        value={formData.timeOfDeath}
                        onChange={(e) => setFormData({ ...formData, timeOfDeath: e.target.value })}
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
                      Age at Time of Death *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      placeholder="e.g. 76"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Place & Medical Attendant */}
              <div className="space-y-4">
                <div className="text-xs font-bold text-blue-900 uppercase tracking-wider border-b border-slate-100 pb-1">
                  2. Place of Occurrence & Certified Medical Cause
                </div>

                <div className="flex items-center gap-6 text-xs font-medium text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="deathPlaceType"
                      checked={formData.isHospitalDeath}
                      onChange={() => setFormData({ ...formData, isHospitalDeath: true })}
                      className="text-blue-900"
                    />
                    <span>Hospital / Medical Facility</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="deathPlaceType"
                      checked={!formData.isHospitalDeath}
                      onChange={() => setFormData({ ...formData, isHospitalDeath: false })}
                      className="text-blue-900"
                    />
                    <span>Home / Residence Occurrence</span>
                  </label>
                </div>

                {formData.isHospitalDeath ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Hospital Name *
                      </label>
                      <input
                        type="text"
                        value={formData.hospitalName}
                        onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Hospital Registration / Death Memo #
                      </label>
                      <input
                        type="text"
                        value={formData.hospitalRegNo}
                        onChange={(e) => setFormData({ ...formData, hospitalRegNo: e.target.value })}
                        placeholder="e.g. CGH-DTH-2026-0019"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Address of Residence Where Death Occurred *
                    </label>
                    <input
                      type="text"
                      value={formData.placeOfDeath}
                      onChange={(e) => setFormData({ ...formData, placeOfDeath: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Certified Medical Cause of Death *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.causeOfDeath}
                      onChange={(e) => setFormData({ ...formData, causeOfDeath: e.target.value })}
                      placeholder="e.g. Acute Myocardial Infarction"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Attending Medical Practitioner / Doctor
                    </label>
                    <input
                      type="text"
                      value={formData.medicalAttendant}
                      onChange={(e) => setFormData({ ...formData, medicalAttendant: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Informant & Family */}
              <div className="space-y-4">
                <div className="text-xs font-bold text-blue-900 uppercase tracking-wider border-b border-slate-100 pb-1">
                  3. Designated Informant & Family Particulars
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Informant Full Name (Applicant) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.informantName}
                      onChange={(e) => setFormData({ ...formData, informantName: e.target.value })}
                      placeholder="e.g. Martha Miller"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Relationship to Deceased *
                    </label>
                    <select
                      value={formData.informantRelation}
                      onChange={(e) => setFormData({ ...formData, informantRelation: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                    >
                      <option value="Spouse">Spouse</option>
                      <option value="Son">Son</option>
                      <option value="Daughter">Daughter</option>
                      <option value="Parent">Parent</option>
                      <option value="Relative">Legal Relative</option>
                      <option value="Medical Facility Officer">Medical Facility Officer</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Spouse Name (if married)
                    </label>
                    <input
                      type="text"
                      value={formData.spouseName}
                      onChange={(e) => setFormData({ ...formData, spouseName: e.target.value })}
                      placeholder="e.g. Martha Miller"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Father / Mother / Guardian Name
                    </label>
                    <input
                      type="text"
                      value={formData.fatherOrSpouseName}
                      onChange={(e) => setFormData({ ...formData, fatherOrSpouseName: e.target.value })}
                      placeholder="e.g. William Miller"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Permanent Residential Address of Deceased *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.permanentAddress}
                    onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
                    placeholder="Residential address in Elmwood"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
              </div>

              {/* Section 4: Document Upload */}
              <div className="space-y-4">
                <div className="text-xs font-bold text-blue-900 uppercase tracking-wider border-b border-slate-100 pb-1">
                  4. Medical Cause of Death Certificate Upload (MCCD)
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <Upload className="w-4 h-4 text-blue-700" />
                    <span>Upload Medical Certificate of Cause of Death / Attending Doctor Report *</span>
                  </div>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setFiles(e.target.files)}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-900 file:text-white hover:file:bg-blue-800"
                  />
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
                  {loading ? 'Processing OCR & Hospital Match...' : 'Submit Death Registration Application'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
