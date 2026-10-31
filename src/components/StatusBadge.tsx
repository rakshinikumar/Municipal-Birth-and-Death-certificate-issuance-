import React from 'react';
import { ApplicationStatus } from '../types/index.js';
import { CheckCircle2, Clock, FileQuestion, XCircle, Search, RefreshCw, FileText } from 'lucide-react';

interface StatusBadgeProps {
  status: ApplicationStatus | string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, showIcon = true }) => {
  switch (status) {
    case 'HOSPITAL_MATCHED':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
          Hospital Matched
        </span>
      );
    case 'HOSPITAL_NOT_MATCHED':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded">
          {showIcon && <Search className="w-3.5 h-3.5 text-amber-600" />}
          Manual Verification Needed
        </span>
      );
    case 'MANUAL_VERIFICATION':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded">
          {showIcon && <Search className="w-3.5 h-3.5 text-sky-600" />}
          Manual Field Verification
        </span>
      );
    case 'UNDER_REVIEW':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded">
          {showIcon && <Clock className="w-3.5 h-3.5 text-indigo-600" />}
          Under Officer Review
        </span>
      );
    case 'DOCUMENTS_REQUESTED':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded">
          {showIcon && <FileQuestion className="w-3.5 h-3.5 text-orange-600" />}
          Documents Requested
        </span>
      );
    case 'RESUBMITTED':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded">
          {showIcon && <RefreshCw className="w-3.5 h-3.5 text-purple-600" />}
          Evidence Resubmitted
        </span>
      );
    case 'APPROVED':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded">
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />}
          Approved & Certificate Issued
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded">
          {showIcon && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
          Application Rejected
        </span>
      );
    case 'SUBMITTED':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded">
          {showIcon && <FileText className="w-3.5 h-3.5 text-slate-500" />}
          Submitted
        </span>
      );
  }
};
