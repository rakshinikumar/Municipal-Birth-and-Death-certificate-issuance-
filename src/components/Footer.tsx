import React from 'react';
import { Landmark, ShieldCheck, FileCheck, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-display font-bold text-sm">
              <Landmark className="w-4 h-4 text-amber-400" />
              <span>Metropolitan Municipal Corporation</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Office of the Chief Registrar of Vital Statistics. Statutory digital archive for issuance, verification, and permanent record preservation of Birth and Death Certificates.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-amber-400/90 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Public Act & By-Laws Compliant</span>
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-2">
            <div className="text-white font-semibold text-xs tracking-wider uppercase mb-2">Municipal Portals</div>
            <ul className="space-y-1.5">
              <li><Link to="/citizen" className="hover:text-white transition-colors">Citizen Applications</Link></li>
              <li><Link to="/citizen/apply-birth" className="hover:text-white transition-colors">New Birth Registration</Link></li>
              <li><Link to="/citizen/apply-death" className="hover:text-white transition-colors">New Death Registration</Link></li>
              <li><Link to="/hospital" className="hover:text-white transition-colors">Hospital Reporting Gateway</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-2">
            <div className="text-white font-semibold text-xs tracking-wider uppercase mb-2">Public Services</div>
            <ul className="space-y-1.5">
              <li><Link to="/archive" className="hover:text-white transition-colors">Digital Vital Records Archive</Link></li>
              <li><Link to="/verify" className="hover:text-white transition-colors">Statutory QR Verification</Link></li>
              <li><Link to="/officer" className="hover:text-white transition-colors">Municipal Officer Review Console</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Authorized Personnel Sign-In</Link></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-2">
            <div className="text-white font-semibold text-xs tracking-wider uppercase mb-2">Registrar Assistance</div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Vital Registry Desk: +1 (555) 880-1200</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>vitalrecords@elmwood.gov</span>
              </div>
              <div className="pt-2 text-slate-500 text-[11px]">
                Civic Center Plaza, City Hall Room 104, Elmwood. Open Mon–Fri 08:30 – 17:00.
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} Metropolitan Municipal Corporation of Elmwood. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>ISO/IEC 27001 Certified Security</span>
            <span>·</span>
            <span>Digital Signature Standard (FIPS 186-4)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
