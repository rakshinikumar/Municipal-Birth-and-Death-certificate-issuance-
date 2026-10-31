import React, { useState, useEffect } from 'react';
import api from '../api/client.js';
import { DigitalArchiveEntry } from '../types/index.js';
import {
  Database,
  Search,
  Filter,
  Download,
  Calendar,
  ShieldCheck,
  FileText,
  Building,
  QrCode,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DigitalArchivePage: React.FC = () => {
  const [records, setRecords] = useState<DigitalArchiveEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'BIRTH' | 'DEATH'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stats, setStats] = useState({ total: 0, totalBirths: 0, totalDeaths: 0 });

  const fetchArchiveRecords = async () => {
    setLoading(true);
    try {
      const typeParam = typeFilter === 'ALL' ? '' : `&type=${typeFilter}`;
      const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
      const startParam = startDate ? `&startDate=${startDate}` : '';
      const endParam = endDate ? `&endDate=${endDate}` : '';

      const res = await api.get(
        `/archive/records?limit=50${typeParam}${searchParam}${startParam}${endParam}`
      );
      if (res.data.success) {
        setRecords(res.data.records || []);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchiveRecords();
  }, [typeFilter, searchTerm, startDate, endDate]);

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-700 border border-amber-500/20 rounded-lg flex items-center justify-center shrink-0">
              <Database className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                Permanent Public Registry
              </div>
              <h1 className="text-xl font-display font-bold text-slate-900 mt-0.5">
                Centralized Municipal Digital Vital Statistics Archive
              </h1>
              <p className="text-xs text-slate-500">
                Statutory civil records protected under immutable municipal digital archive protocol
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/verify"
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>Public QR Verifier</span>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="text-xs text-slate-500">Total Archival Records</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">{stats.total}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="text-xs text-slate-500">Birth Records Preserved</div>
            <div className="text-2xl font-bold font-mono text-blue-800 mt-1 tabular-nums">{stats.totalBirths}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="text-xs text-slate-500">Death Records Preserved</div>
            <div className="text-2xl font-bold font-mono text-purple-800 mt-1 tabular-nums">{stats.totalDeaths}</div>
          </div>
        </div>

        {/* Filters and Search Toolbar */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Segmented Filter adhere to Section 1.A */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['ALL', 'BIRTH', 'DEATH'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  typeFilter === t ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t === 'ALL' ? 'All Records' : t.charAt(0) + t.slice(1).toLowerCase() + ' Records'}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Reg #, Name, Parent..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-700"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs"
              />
              <span>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs"
              />
            </div>
          </div>
        </div>

        {/* Digital Archive Records Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">Querying digital archive repository...</div>
          ) : records.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Database className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="text-xs font-bold text-slate-700">No archival records match your filter</div>
              <p className="text-[11px] text-slate-500">Try adjusting your search criteria or date ranges.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Registration Number</th>
                    <th className="py-3 px-4">Certificate Type</th>
                    <th className="py-3 px-4">Subject Name</th>
                    <th className="py-3 px-4">Date of Event</th>
                    <th className="py-3 px-4">Place of Event</th>
                    <th className="py-3 px-4">Parent / Spouse</th>
                    <th className="py-3 px-4">Archived At</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-900">
                        {rec.registrationNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-semibold ${
                            rec.certificateType === 'BIRTH' ? 'text-blue-700' : 'text-purple-700'
                          }`}
                        >
                          {rec.certificateType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{rec.subjectName}</td>
                      <td className="py-3 px-4 tabular-nums text-slate-600">
                        {new Date(rec.eventDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{rec.placeOfEvent}</td>
                      <td className="py-3 px-4 text-slate-600">{rec.parentOrSpouseName}</td>
                      <td className="py-3 px-4 tabular-nums text-slate-500 text-[11px]">
                        {new Date(rec.archivedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Link
                          to={`/verify?reg=${encodeURIComponent(rec.registrationNumber)}`}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px] inline-flex items-center gap-1"
                        >
                          <QrCode className="w-3 h-3 text-slate-500" />
                          <span>Verify</span>
                        </Link>

                        {rec.certificate && (
                          <a
                            href={`/api/certificates/download/${rec.certificate.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded text-[11px] inline-flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            <span>PDF</span>
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
