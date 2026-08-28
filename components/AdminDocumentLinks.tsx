import React, { useState, useEffect } from 'react';
import { DocumentLink, UserRole, User } from '../types';
import { api } from '../services/api';
import { Button } from '../components/Button';
import { Link, FileText, Plus, Trash2, Edit2, ExternalLink, Save, X } from 'lucide-react';

const DOCUMENT_CATEGORIES = {
    'Personnel / HR Documents': [
        'Travel Order (TO)',
        'Special Order (SO)',
        'Office Order (OO)',
        'Overtime Authority',
        'Training Authority'
    ],
    'Logistics / Operational Documents': [
        'Trip Ticket',
        'Mission Order',
        'Activity Proposal',
        'Activity Report / Accomplishment Report',
        'Attendance Sheet',
        'Event Completion Report'
    ]
};

interface AdminDocumentLinksProps {
    employees: User[];
}

export const AdminDocumentLinks: React.FC<AdminDocumentLinksProps> = ({ employees }) => {
    const [links, setLinks] = useState<DocumentLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('ALL');
    const [isEditing, setIsEditing] = useState(false);
    const [currentLink, setCurrentLink] = useState<Partial<DocumentLink>>({});

    useEffect(() => {
        fetchLinks();
    }, []);

    const fetchLinks = async () => {
        setLoading(true);
        const data = await api.documents.getAll();
        setLinks(data);
        setLoading(false);
    };

    const handleSave = async () => {
        if (!currentLink.category || !currentLink.documentType || !currentLink.url) return;

        let targetGroup: 'ALL' | 'REGIONAL' | 'PROVINCE' | undefined = undefined;
        let userId: string | undefined = undefined;

        if (selectedEmployeeId === 'ALL' || selectedEmployeeId === 'REGIONAL' || selectedEmployeeId === 'PROVINCE') {
            targetGroup = selectedEmployeeId as any;
        } else {
            userId = selectedEmployeeId;
        }

        const newLink: DocumentLink = {
            id: currentLink.id || Date.now().toString(),
            userId,
            targetGroup,
            category: currentLink.category,
            documentType: currentLink.documentType,
            url: currentLink.url,
            updatedAt: new Date().toISOString()
        };

        await api.documents.save(newLink);
        setIsEditing(false);
        setCurrentLink({});
        fetchLinks();
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this document link?')) {
            await api.documents.delete(id);
            fetchLinks();
        }
    };

    const filteredLinks = links.filter(link => {
        if (selectedEmployeeId === 'ALL') return link.targetGroup === 'ALL' || (!link.targetGroup && !link.userId);
        if (selectedEmployeeId === 'REGIONAL') return link.targetGroup === 'REGIONAL';
        if (selectedEmployeeId === 'PROVINCE') return link.targetGroup === 'PROVINCE';
        return link.userId === selectedEmployeeId;
    });

    const regionalEmployees = employees.filter(e => e.profile.employeeType === 'REGIONAL');
    const provinceEmployees = employees.filter(e => e.profile.employeeType === 'PROVINCE');
    const otherEmployees = employees.filter(e => !e.profile.employeeType);

    return (
        <div className="bg-white p-4 sm:p-8 rounded-xl shadow-md border border-gray-200 mt-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center text-indigo-600">
                    <Link className="w-8 h-8 mr-3" />
                    <h3 className="text-xl font-bold">Document Links & Assignments</h3>
                </div>
                <Button onClick={() => { setIsEditing(true); setCurrentLink({}); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Link
                </Button>
            </div>
            
            <p className="text-gray-500 mb-6">
                Manage document links for employees. You can set global links, assign to specific groups (Regional/Province), or assign them to specific employees.
            </p>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign / View Links For</label>
                <select 
                    className="w-full md:w-1/2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-brand-500 focus:border-brand-500"
                    value={selectedEmployeeId}
                    onChange={e => setSelectedEmployeeId(e.target.value)}
                >
                    <option value="ALL">Global (All Employees)</option>
                    <option value="REGIONAL">All Regional Office Employees</option>
                    <option value="PROVINCE">All Province Employees</option>
                    
                    {regionalEmployees.length > 0 && (
                        <optgroup label="Specific Regional Employees">
                            {regionalEmployees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.profile.name}</option>
                            ))}
                        </optgroup>
                    )}
                    {provinceEmployees.length > 0 && (
                        <optgroup label="Specific Province Employees">
                            {provinceEmployees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.profile.name}</option>
                            ))}
                        </optgroup>
                    )}
                    {otherEmployees.length > 0 && (
                        <optgroup label="Other Employees">
                            {otherEmployees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.profile.name}</option>
                            ))}
                        </optgroup>
                    )}
                </select>
            </div>

            {isEditing && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                    <h4 className="font-bold text-gray-800 mb-4">{currentLink.id ? 'Edit Link' : 'New Link'}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                            <select 
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                value={currentLink.category || ''}
                                onChange={e => setCurrentLink({...currentLink, category: e.target.value, documentType: ''})}
                            >
                                <option value="">Select Category</option>
                                {Object.keys(DOCUMENT_CATEGORIES).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Document Type</label>
                            <select 
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                value={currentLink.documentType || ''}
                                onChange={e => setCurrentLink({...currentLink, documentType: e.target.value})}
                                disabled={!currentLink.category}
                            >
                                <option value="">Select Document</option>
                                {currentLink.category && DOCUMENT_CATEGORIES[currentLink.category as keyof typeof DOCUMENT_CATEGORIES].map(doc => (
                                    <option key={doc} value={doc}>{doc}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">URL / Link</label>
                            <input 
                                type="url" 
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                placeholder="https://..."
                                value={currentLink.url || ''}
                                onChange={e => setCurrentLink({...currentLink, url: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={!currentLink.category || !currentLink.documentType || !currentLink.url}>
                            <Save className="w-4 h-4 mr-2" /> Save
                        </Button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="text-center py-8 text-gray-500">Loading links...</div>
            ) : filteredLinks.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No links found for this selection.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(DOCUMENT_CATEGORIES).map(([category, docs]) => {
                        const categoryLinks = filteredLinks.filter(l => l.category === category);
                        if (categoryLinks.length === 0) return null;

                        return (
                            <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                    <h4 className="font-bold text-gray-800">{category}</h4>
                                </div>
                                <ul className="divide-y divide-gray-100">
                                    {categoryLinks.map(link => (
                                        <li key={link.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                            <div>
                                                <p className="font-medium text-gray-900">{link.documentType}</p>
                                                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-600 hover:underline flex items-center mt-1">
                                                    <ExternalLink className="w-3 h-3 mr-1" />
                                                    {link.url}
                                                </a>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => { setIsEditing(true); setCurrentLink(link); }} className="p-2 text-gray-400 hover:text-brand-600 rounded-md">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(link.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-md">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
