import React, { useState, useEffect } from 'react';
import { DocumentLink, User } from '../types';
import { api } from '../services/api';
import { FileText, ExternalLink, Link as LinkIcon } from 'lucide-react';

interface EmployeeAssignmentsProps {
    user: User;
}

export const EmployeeAssignments: React.FC<EmployeeAssignmentsProps> = ({ user }) => {
    const [links, setLinks] = useState<DocumentLink[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLinks();
    }, []);

    const fetchLinks = async () => {
        setLoading(true);
        const data = await api.documents.getAll();
        // Filter links that are either global (no userId), assigned specifically to this employee, or assigned to their group
        const userLinks = data.filter(link => {
            if (link.userId === user.id) return true;
            if (link.targetGroup === 'ALL' || (!link.targetGroup && !link.userId)) return true;
            if (link.targetGroup === 'REGIONAL' && user.profile.employeeType === 'REGIONAL') return true;
            if (link.targetGroup === 'PROVINCE' && user.profile.employeeType === 'PROVINCE') return true;
            return false;
        });
        setLinks(userLinks);
        setLoading(false);
    };

    // Group links by category
    const groupedLinks = links.reduce((acc, link) => {
        if (!acc[link.category]) {
            acc[link.category] = [];
        }
        acc[link.category].push(link);
        return acc;
    }, {} as Record<string, DocumentLink[]>);

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <LinkIcon className="w-6 h-6 mr-2 text-brand-600" />
                Employee Assignments & Documents
            </h2>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
                </div>
            ) : links.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No documents assigned</h3>
                    <p className="text-gray-500">You don't have any document links assigned to you yet.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedLinks).map(([category, categoryLinks]) => (
                        <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-bold text-gray-800">{category}</h3>
                            </div>
                            <ul className="divide-y divide-gray-100">
                                {categoryLinks.map(link => (
                                    <li key={link.id} className="p-6 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start space-x-4">
                                                <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-900">{link.documentType}</h4>
                                                    {!link.userId && (!link.targetGroup || link.targetGroup === 'ALL') && (
                                                        <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                            Global Document
                                                        </span>
                                                    )}
                                                    {link.targetGroup === 'REGIONAL' && (
                                                        <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                                            Regional Office
                                                        </span>
                                                    )}
                                                    {link.targetGroup === 'PROVINCE' && (
                                                        <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                                            Province
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <a 
                                                href={link.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex items-center px-4 py-2 bg-brand-50 text-brand-700 rounded-lg hover:bg-brand-100 transition-colors text-sm font-medium"
                                            >
                                                <ExternalLink className="w-4 h-4 mr-2" />
                                                Open Link
                                            </a>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
