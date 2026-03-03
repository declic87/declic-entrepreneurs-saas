'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Filter, Search, FileSpreadsheet, FileType, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Document {
  id: string;
  title: string;
  description: string;
  file_type: string;
  file_url: string;
  file_path: string;
}

interface DocumentsByCategory {
  [category: string]: Document[];
}

const categoryIcons = {
  'Juridique': '⚖️',
  'Fiscal': '💰',
  'Comptable': '📊',
  'RH': '👥',
};

const fileTypeIcons = {
  'Word': FileType,
  'Excel': FileSpreadsheet,
  'PDF': FileText,
};

const fileTypeColors = {
  'Word': 'bg-blue-100 text-blue-700',
  'Excel': 'bg-green-100 text-green-700',
  'PDF': 'bg-red-100 text-red-700',
};

export default function ClientDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentsByCategory>({});
  const [userPack, setUserPack] = useState<string>('');
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const supabase = createClient();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('Pas de session');
        return;
      }

      const response = await fetch('/api/client/documents', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur chargement documents');
      }

      const data = await response.json();
      setDocuments(data.documents);
      setUserPack(data.userPack);
      setTotalDocuments(data.totalDocuments);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (fileUrl: string, title: string) => {
    if (!fileUrl) {
      alert('Fichier non disponible. Contactez le support.');
      return;
    }
    window.open(fileUrl, '_blank');
  };

  // Filtrer les documents par catégorie et recherche
  const filteredDocuments = Object.entries(documents).reduce((acc, [category, docs]) => {
    if (selectedCategory !== 'all' && category !== selectedCategory) {
      return acc;
    }

    const filteredDocs = docs.filter(doc =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (filteredDocs.length > 0) {
      acc[category] = filteredDocs;
    }

    return acc;
  }, {} as DocumentsByCategory);

  const categories = Object.keys(documents);
  const totalFilteredDocs = Object.values(filteredDocuments).flat().length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Documents à télécharger</h1>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
            <span className="text-sm font-medium text-gray-600">Pack:</span>
            <span className="text-sm font-bold text-blue-600 uppercase">{userPack}</span>
          </div>
        </div>
        <p className="text-gray-600">
          {totalDocuments} document{totalDocuments > 1 ? 's' : ''} disponible{totalDocuments > 1 ? 's' : ''} pour votre pack
        </p>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtre catégorie */}
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 w-5 h-5" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Toutes les catégories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {categoryIcons[category as keyof typeof categoryIcons]} {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Compteur résultats */}
        {searchQuery && (
          <div className="mt-3 text-sm text-gray-600">
            {totalFilteredDocs} résultat{totalFilteredDocs > 1 ? 's' : ''} trouvé{totalFilteredDocs > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Liste des documents par catégorie */}
      {Object.keys(filteredDocuments).length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucun document trouvé</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(filteredDocuments).map(([category, docs]) => (
            <div key={category}>
              {/* En-tête catégorie */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{categoryIcons[category as keyof typeof categoryIcons]}</span>
                <h2 className="text-2xl font-bold text-gray-900">{category}</h2>
                <span className="ml-auto text-sm text-gray-500">
                  {docs.length} document{docs.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Grille documents */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {docs.map((doc) => {
                  const FileIcon = fileTypeIcons[doc.file_type as keyof typeof fileTypeIcons] || FileText;
                  const colorClass = fileTypeColors[doc.file_type as keyof typeof fileTypeColors] || 'bg-gray-100 text-gray-700';

                  return (
                    <div
                      key={doc.id}
                      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow duration-200"
                    >
                      {/* En-tête carte */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${colorClass}`}>
                          <FileIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                            {doc.title}
                          </h3>
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${colorClass}`}>
                            {doc.file_type}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {doc.description}
                      </p>

                      {/* Bouton téléchargement */}
                      <button
                        onClick={() => handleDownload(doc.file_url, doc.title)}
                        disabled={!doc.file_url}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                          doc.file_url
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {doc.file_url ? (
                          <>
                            <Download className="w-4 h-4" />
                            Télécharger
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            Bientôt disponible
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}