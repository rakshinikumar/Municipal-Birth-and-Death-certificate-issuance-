import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import {
  ShieldCheck,
  FileText,
  Building2,
  Search,
  QrCode,
  CheckCircle2,
  Clock,
  ArrowRight,
  Database,
  Award,
  Layers,
  ChevronRight,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quickRegSearch, setQuickRegSearch] = useState('');
  const [archiveStats, setArchiveStats] = useState({
    total: 1840,
    totalBirths: 1120,
    totalDeaths: 720,
  });

  useEffect(() => {
    api.get('/archive/records?limit=1')
      .then((res) => {
        if (res.data?.stats) {
          setArchiveStats(res.data.stats);
        }
      })
      .catch(() => {});
  }, []);

  const handleQuickVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickRegSearch.trim()) {
      navigate(`/verify?reg=${encodeURIComponent(quickRegSearch.trim())}`);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Civic Hero Section */}
      <section className="relative bg-slate-900 text-white overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <img
            src="/src/assets/images/municipal_civic_hall_1793424326065.jpg"
            alt="Elmwood Civic Hall"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-900/40" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/10 border border-amber-400/30 text-amber-300 rounded text-xs font-semibold tracking-wide uppercase">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Statutory Civil Registration & Archive</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold tracking-tight text-white leading-tight">
                Municipal Birth & Death Certificate Issuance and Digital Archive
              </h1>

              <p className="text-slate-300 text-base md:text-lg max-w-2xl leading-relaxed">
                The official portal for citizens, authorized medical institutions, and municipal registrars. Streamlined registration with real-time hospital database matching, OCR document extraction, and QR-authenticated digital archives.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to={user ? (user.role === 'CITIZEN' ? '/citizen/apply-birth' : `/${user.role.toLowerCase()}`) : '/login'}
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-600 text-white font-semibold text-sm rounded-md shadow-md transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Apply for Certificate</span>
                </Link>

                <Link
                  to="/archive"
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-md border border-slate-700 transition-colors flex items-center gap-2"
                >
                  <Database className="w-4 h-4 text-amber-400" />
                  <span>Digital Archive</span>
                </Link>

                <Link
                  to="/verify"
                  className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-sm font-medium rounded-md border border-slate-700/80 transition-colors flex items-center gap-2"
                >
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  <span>Verify Certificate QR</span>
                </Link>
              </div>

              {/* Quick Verification Search Box */}
              <div className="pt-4 max-w-lg">
                <form onSubmit={handleQuickVerify} className="flex items-center gap-2 bg-slate-800/90 p-1.5 rounded-lg border border-slate-700 shadow-inner">
                  <Search className="w-4 h-4 text-slate-400 ml-2" />
                  <input
                    type="text"
                    value={quickRegSearch}
                    onChange={(e) => setQuickRegSearch(e.target.value)}
                    placeholder="Enter Registration No (e.g. MC-BRT-2026-01892)"
                    className="w-full bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none px-2 py-1"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Verify
                  </button>
                </form>
              </div>
            </div>

            {/* Right Card: Official Authority Seal & Live Vital Stats */}
            <div className="lg:col-span-5">
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-6 backdrop-blur-xs shadow-xl space-y-6">
                <div className="flex items-center gap-4 pb-4 border-b border-slate-700">
                  <div className="w-14 h-14 rounded-full border-2 border-amber-400 p-0.5 bg-slate-900 overflow-hidden shrink-0 shadow-md">
                    <img
                      src="/src/assets/images/municipal_emblem_1793424324437.jpg"
                      alt="Coat of Arms"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-white text-base">Office of the Chief Registrar</h3>
                    <p className="text-xs text-slate-400">Metropolitan Corporation of Elmwood</p>
                    <div className="text-[11px] text-amber-400 mt-0.5 font-medium">Official Government Issuing Authority</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60">
                    <div className="text-xl font-bold font-mono text-white tabular-nums">{archiveStats.total}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Archived Records</div>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60">
                    <div className="text-xl font-bold font-mono text-blue-400 tabular-nums">{archiveStats.totalBirths}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Births Registered</div>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60">
                    <div className="text-xl font-bold font-mono text-purple-400 tabular-nums">{archiveStats.totalDeaths}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Deaths Registered</div>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Real-time cross-referencing against Authorized Hospital databases</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Optical Character Recognition (OCR) on medical discharge slips</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>High-resolution PDF generation with embedded QR verification</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Role Pathways Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
            Integrated Civic Portal Pathways
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Four specialized operational modules designed for citizens, healthcare institutions, municipal registrars, and civic administrators.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Citizen */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:border-blue-400 transition-colors">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-md bg-blue-50 text-blue-800 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-slate-900 text-lg">1. Citizen Portal</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Submit birth or death certificate applications with supporting proofs. Track application status, respond to officer remarks, and download approved PDF certificates.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100">
              <Link
                to="/citizen"
                className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 group"
              >
                <span>Citizen Services</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Card 2: Hospital */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:border-emerald-400 transition-colors">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-md bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-slate-900 text-lg">2. Hospital Registry</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Authorized medical institutions submit institutional birth and death reports. Feeds the automated matching database for verification and fraud prevention.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100">
              <Link
                to="/hospital"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 group"
              >
                <span>Hospital Gateway</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Card 3: Municipal Officer */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:border-indigo-400 transition-colors">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-md bg-indigo-50 text-indigo-800 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-slate-900 text-lg">3. Municipal Officer</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dedicated review queues for hospital-matched and manual applications. Review OCR extractions, detect duplicates, request evidence, or grant formal approval.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100">
              <Link
                to="/officer"
                className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 group"
              >
                <span>Review Console</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Card 4: Digital Archive & Admin */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:border-amber-400 transition-colors">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-md bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-slate-900 text-lg">4. Digital Archive & Admin</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Immutable central repository of all statutory vital records. Full audit logging, user role provisioning, hospital licensing, and public verification tools.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100">
              <Link
                to="/archive"
                className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1 group"
              >
                <span>Search Archives</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Hospital Database Matching Explanation Section */}
      <section className="bg-slate-100/70 border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5">
              <div className="rounded-xl overflow-hidden border border-slate-300 shadow-md">
                <img
                  src="/src/assets/images/civic_birth_registration_1793424326033.jpg"
                  alt="Medical documentation and vital registry"
                  className="w-full h-auto object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <div className="lg:col-span-7 space-y-5">
              <div className="text-xs font-bold text-blue-800 tracking-wider uppercase">
                Critical Workflow Architecture
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
                Automated Hospital Database Matching Prior to Officer Review
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                When a citizen applies for a birth or death certificate, the municipal engine automatically compares the submitted particulars (Child/Deceased name, Date, Gender, Hospital Reg No, and Parents) against the authorized hospital database.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 bg-white p-3.5 rounded-lg border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Matching Hospital Record Confirmed (HOSPITAL_MATCHED)</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Sets status to <span className="font-mono text-emerald-700 font-semibold">HOSPITAL_MATCHED</span>, links official hospital reference, and presents side-by-side comparative evidence to the Municipal Officer. Final municipal approval remains mandatory.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white p-3.5 rounded-lg border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4 text-amber-700" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">No Matching Record Found (HOSPITAL_NOT_MATCHED)</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Routes the application to the specialized Manual Verification Queue. Supports Home Deliveries and non-hospital occurrences backed by registered midwife or community affidavits.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Showcase: Digital Archive Security */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="text-xs font-bold text-blue-800 tracking-wider uppercase">
              Permanent Civil Preservation
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
              Centralized Municipal Digital Archive & Cryptographic Verification
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Approved certificates are instantly sealed in the digital archive with a unique statutory Registration Number, SHA-256 cryptographic signature, and high-density QR code. Prevent fraudulent modifications, duplicate registrations, and paper loss.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-white rounded-lg border border-slate-200">
                <div className="font-bold text-slate-900 text-sm mb-1">Instant QR Scanning</div>
                <p className="text-xs text-slate-500">
                  Allows passport control, educational institutions, and public authorities to verify certificate authenticity in under 2 seconds.
                </p>
              </div>

              <div className="p-4 bg-white rounded-lg border border-slate-200">
                <div className="font-bold text-slate-900 text-sm mb-1">Duplicate Record Detection</div>
                <p className="text-xs text-slate-500">
                  Heuristic comparison of new applications against entire historical archive prevents dual claims or identity manipulation.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-xl overflow-hidden border border-slate-300 shadow-md">
              <img
                src="/src/assets/images/municipal_digital_archive_1793424325206.jpg"
                alt="Municipal Digital Archive Facility"
                className="w-full h-auto object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
