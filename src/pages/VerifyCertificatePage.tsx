import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client.js';
import {
  QrCode,
  Search,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Landmark,
  Calendar,
  Lock,
  Download,
  AlertTriangle,
  Upload,
} from 'lucide-react';

export const VerifyCertificatePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const regParam = searchParams.get('reg') || '';

  const [inputRegNo, setInputRegNo] = useState(regParam);
  const [loading, setLoading] = useState(false);
  const [verifiedData, setVerifiedData] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleVerify = async (regToVerify?: string) => {
    const target = regToVerify || inputRegNo;
    if (!target.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setVerifiedData(null);

    try {
      const res = await api.get(`/certificates/verify/${encodeURIComponent(target.trim())}`);
      if (res.data.success && res.data.valid) {
        setVerifiedData(res.data.verificationData);
      } else {
        setErrorMsg(res.data.message || 'No valid municipal record found for this registration number.');
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || 'Certificate record not found or revoked in the municipal archive.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (regParam) {
      handleVerify(regParam);
    }
  }, [regParam]);

  // Simulated QR Code file scan helper
  const handleQrFileScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulate decoding QR content from file or default to sample
      setInputRegNo('MC-BRT-2026-01892');
      handleVerify('MC-BRT-2026-01892');
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Verification Title */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-full border-2 border-amber-500/50 p-1 bg-slate-900 flex items-center justify-center shadow-md overflow-hidden">
            <img
              src="/src/assets/images/municipal_emblem_1793424324437.jpg"
              alt="Municipal Seal"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-900">
            Statutory Certificate Verification Desk
          </h1>
          <p className="text-xs text-slate-600 max-w-lg mx-auto">
            Metropolitan Municipal Corporation of Elmwood · Public statutory authentication gateway for passport authorities, educational institutions, and foreign embassies.
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Verify via Registration Number or QR Code
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify();
            }}
            className="flex flex-col sm:flex-row items-center gap-3"
          >
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={inputRegNo}
                onChange={(e) => setInputRegNo(e.target.value)}
                placeholder="Enter Registration Number (e.g. MC-BRT-2026-01892)"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs rounded transition-colors cursor-pointer whitespace-nowrap shadow-xs disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Verify Authenticity'}
            </button>
          </form>

          {/* Quick QR demo button */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px]">Test Sample Verified Record:</span>
              <button
                type="button"
                onClick={() => {
                  setInputRegNo('MC-BRT-2026-01892');
                  handleVerify('MC-BRT-2026-01892');
                }}
                className="font-mono text-[11px] font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition-colors cursor-pointer"
              >
                MC-BRT-2026-01892
              </button>
            </div>

            <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span>Simulate QR Scan from Image</span>
              <input type="file" accept="image/*" onChange={handleQrFileScan} className="hidden" />
            </label>
          </div>
        </div>

        {/* Verification Failure Card */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 p-6 rounded-lg shadow-sm text-center space-y-2">
            <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-base text-rose-950">Record Not Validated</h3>
            <p className="text-xs text-rose-800 max-w-md mx-auto">{errorMsg}</p>
            <div className="text-[11px] text-slate-500 pt-2">
              Please inspect the registration number for typing errors or verify directly with the Municipal Registrar.
            </div>
          </div>
        )}

        {/* Verification Success Official Certificate Card */}
        {verifiedData && (
          <div className="bg-white rounded-lg border-2 border-emerald-600/60 shadow-lg p-6 sm:p-8 space-y-6">
            {/* Status Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Statutory Municipal Record Authenticated</span>
                  </div>
                  <h2 className="text-xl font-display font-bold text-slate-900 mt-0.5">
                    Official Certificate of {verifiedData.certificateType}
                  </h2>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">Archive Status</span>
                <span className="font-bold text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded">
                  {verifiedData.status}
                </span>
              </div>
            </div>

            {/* Official Sanitized Metadata Grid - Protecting Private Info per Section 13 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-500 block">Statutory Registration Number:</span>
                <span className="font-mono text-sm font-bold text-blue-900">
                  {verifiedData.registrationNumber}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-500 block">Municipal Certificate Number:</span>
                <span className="font-mono text-sm font-bold text-slate-800">
                  {verifiedData.certificateNumber}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-500 block">Subject Name (Masked for Privacy):</span>
                <span className="text-sm font-bold text-slate-800">
                  {verifiedData.subjectMaskedName}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-500 block">Date of Event:</span>
                <span className="text-sm font-bold text-slate-800">
                  {new Date(verifiedData.eventDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-500 block">Issuing Municipal Authority:</span>
                <span className="font-semibold text-slate-800">
                  {verifiedData.issuingAuthority}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-500 block">Date of Registration:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(verifiedData.issueDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Cryptographic Hash Notice */}
            <div className="p-3 bg-slate-100 rounded text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Cryptographic SHA-256 Signature Verification:</span>
              </div>
              <div className="font-mono text-[10px] text-slate-500 break-all">
                {verifiedData.digitalSignatureHash}
              </div>
            </div>

            <div className="text-[11px] text-slate-500 text-center">
              This statutory electronic verification confirms the record is active and matches the official register of births and deaths. Issued under municipal authority.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
