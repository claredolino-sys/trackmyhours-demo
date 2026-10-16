import React, { useState, useEffect } from 'react';
import { DocumentLink, UserRole, User } from '../../types';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
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

export interface AdminDocumentLinksProps {
    currentUser: User;
    employees?: User[];
}

export const AdminDocumentLinks: React.FC<AdminDocumentLinksProps> = ({ currentUser, employees = [] }) => {
    const [links, setLinks] = useState<DocumentLink[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    
    // Form State
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [category, setCategory] = useState<string>(DOCUMENT_CATEGORIES['Personnel / HR Documents'][0]);
    const [assignedTo, setAssignedTo] = useState<string>('ALL');
    const [editingId, setEditingId] = useState<string | null>(null);

    const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;

    const loadLinks = async () => {
        setIsLoading(true);
        try {
            const data = await api.documentLinks.getAll();
            if (isSuperAdmin) {
                setLinks(data);
            } else {
                setLinks(data.filter(l => l.assignedTo === 'ALL' || l.assignedTo === currentUser.id));
            }
        } catch (error) {
            console.error("Failed to load document links", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadLinks();
    }, [currentUser]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !url) return;

        try {
            if (editingId) {
                await api.documentLinks.update(editingId, {
                    title,
                    url: url.startsWith('http') ? url : `https://${url}`,
                    category,
                    assignedTo
                });
            } else {
                await api.documentLinks.create({
                    title,
                    url: url.startsWith('http') ? url : `https://${url}`,
                    category,
                    assignedTo,
                    createdBy: currentUser.id
                });
            }
            
            // Reset
            setTitle('');
            setUrl('');
            setCategory(DOCUMENT_CATEGORIES['Personnel / HR Documents'][0]);
            setAssignedTo('ALL');
            setIsAdding(false);
            setEditingId(null);
            loadLinks();
        } catch (error) {
            console.error("Failed to save document link", error);
        }
    };

    const handleEdit = (link: DocumentLink) => {
        setTitle(link.title);
        setUrl(link.url);
        setCategory(link.category);
        setAssignedTo(link.assignedTo);
        setEditingId(link.id);
        setIsAdding(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this document link?")) {
            try {
                await api.documentLinks.delete(id);
                loadLinks();
            } catch (error) {
                console.error("Failed to delete link", error);
            }
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                        <Link className="w-5 h-5 mr-2 text-brand-600" />
                        Official Documents & Reference Links
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                        Centralized repository for government travel orders, mission slips, and operational documentation.
                    </p>
                </div>
                {isSuperAdmin && (
                    <Button 
                        onClick={() => {
                            setIsAdding(!isAdding);
                            setEditingId(null);
                            setTitle('');
                            setUrl('');
                        }}
                        size="sm"
                        className="flex items-center space-x-1"
                    >
                        {isAdding ? <X size={16} /> : <Plus size={16} />}
                        <span>{isAdding ? 'Cancel' : 'Add Link'}</span>
                    </Button>
                )}
            </div>

            {/* Add / Edit Form */}
            {isAdding && isSuperAdmin && (
                <form onSubmit={handleSubmit} className="bg-brand-50/50 p-4 rounded-xl border border-brand-100 space-y-4">
                    <h4 className="font-semibold text-sm text-brand-900">
                        {editingId ? 'Edit Document Link' : 'Register New Document Link'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Document Category</label>
                            <select 
                                value={category} 
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm focus:ring-brand-500 focus:border-brand-500"
                            >
                                <optgroup label="Personnel / HR Documents">
                                    {DOCUMENT_CATEGORIES['Personnel / HR Documents'].map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Logistics / Operational Documents">
                                    {DOCUMENT_CATEGORIES['Logistics / Operational Documents'].map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Document Title / Code</label>
                            <input 
                                type="text" 
                                placeholder="e.g. TO #2026-0819 - Regional Inspection" 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm focus:ring-brand-500 focus:border-brand-500"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Document Cloud URL (Google Drive / Nextcloud)</label>
                            <input 
                                type="text" 
                                placeholder="https://drive.google.com/..." 
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                required
                                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm focus:ring-brand-500 focus:border-brand-500"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Assign Availability</label>
                            <select 
                                value={assignedTo} 
                                onChange={(e) => setAssignedTo(e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm focus:ring-brand-500 focus:border-brand-500"
                            >
                                <option value="ALL">All Employees (Public Notice)</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.profile.name} (@{emp.profile.username})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-2">
                        <Button 
                            type="button" 
                            variant="secondary" 
                            size="sm"
                            onClick={() => {
                                setIsAdding(false);
                                setEditingId(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" className="flex items-center space-x-1">
                            <Save size={16} />
                            <span>{editingId ? 'Save Changes' : 'Publish Document'}</span>
                        </Button>
                    </div>
                </form>
            )}

            {/* Links List */}
            {isLoading ? (
                <div className="text-center py-8 text-gray-400">Loading document links...</div>
            ) : links.length === 0 ? (
                <div className="text-center py-8 text-gray-400 border border-dashed rounded-xl">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No official document links published yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {links.map((link) => (
                        <div 
                            key={link.id} 
                            className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 flex flex-col justify-between transition-colors"
                        >
                            <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-100 text-brand-800">
                                        {link.category}
                                    </span>
                                    {isSuperAdmin && (
                                        <div className="flex space-x-1">
                                            <button 
                                                onClick={() => handleEdit(link)}
                                                className="p-1 text-gray-400 hover:text-brand-600 rounded"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(link.id)}
                                                className="p-1 text-gray-400 hover:text-red-600 rounded"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <h5 className="font-semibold text-gray-800 text-sm">{link.title}</h5>
                                <p className="text-xs text-gray-500">
                                    {link.assignedTo === 'ALL' ? 'Available to All Personnel' : 'Assigned to Specific Personnel'}
                                </p>
                            </div>
                            <div className="pt-3 border-t border-gray-200/60 mt-3 flex justify-between items-center">
                                <span className="text-[11px] text-gray-400">
                                    {new Date(link.createdAt).toLocaleDateString()}
                                </span>
                                <a 
                                    href={link.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center space-x-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                                >
                                    <span>Access File</span>
                                    <ExternalLink size={12} />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
