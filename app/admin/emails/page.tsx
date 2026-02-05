import React from 'react';

export default function EmailsPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Gestion des Templates d'Emails</h1>
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <p className="text-yellow-700">
          <strong>Note technique :</strong> Les tables <code>email_templates</code> et <code>email_logs</code> 
          doivent être créées dans Supabase via l'éditeur SQL.
        </p>
      </div>
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <p className="text-gray-600">L'interface de gestion apparaîtra ici une fois la base de données prête.</p>
      </div>
    </div>
  );
}