import React from 'react';
import { User } from '../types';
import { AdminDocumentLinks } from '../components/AdminDocumentLinks';

interface AdminDocumentLinksPageProps {
    employees: User[];
}

export const AdminDocumentLinksPage: React.FC<AdminDocumentLinksPageProps> = ({ employees }) => {
    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10">
            <h2 className="text-2xl font-bold text-gray-800">Document Links & Assignments</h2>
            <AdminDocumentLinks employees={employees} />
        </div>
    );
};
