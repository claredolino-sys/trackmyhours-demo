import React, { useState } from 'react';
import { X, ShieldCheck, Copy, Check, FileText } from 'lucide-react';
import { Button } from '../ui/Button';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LicenseModal: React.FC<LicenseModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const licenseText = `MIT License

Copyright (c) 2026 Clare Dolino, Biliran Province State University (BiPSU) and TrackMyHours Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(licenseText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100"
        role="dialog"
        aria-labelledby="license-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-brand-50 to-blue-50/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-600/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 id="license-modal-title" className="text-xl font-bold text-gray-900">
                Software License
              </h2>
              <p className="text-xs text-brand-700 font-medium">
                TrackMyHours Attendance & DTR Management System
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-gray-700">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                Open Source
              </span>
              <span className="ml-2 font-bold text-gray-800">MIT License</span>
            </div>
            <div className="text-xs text-gray-500 font-mono">
              SPDX: MIT
            </div>
          </div>

          <div className="relative">
            <pre className="p-4 bg-gray-900 text-gray-100 font-mono text-xs rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner max-h-72 border border-gray-800">
              {licenseText}
            </pre>
          </div>

          <div className="p-4 bg-brand-50 rounded-xl border border-brand-100 text-xs text-brand-900 space-y-1">
            <p className="font-semibold text-brand-800 flex items-center">
              <FileText className="w-4 h-4 mr-1.5 inline" />
              Summary of Permissions:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-brand-800/90 pl-1">
              <li>Commercial and non-commercial use permitted</li>
              <li>Modification, distribution, and private use allowed</li>
              <li>Includes copyright notice and disclaimer of warranty</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 px-6 border-t border-gray-100 bg-gray-50">
          <div className="text-xs text-gray-500">
            © 2026 BiPSU & Contributors
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              className="flex items-center text-xs"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy License
                </>
              )}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
