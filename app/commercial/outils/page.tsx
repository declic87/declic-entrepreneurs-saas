'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink, Video, Download } from 'lucide-react';

interface OutilCloser {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'pdf' | 'html' | 'video';
  url: string;
  is_active: boolean;
  created_at: string;
}

export default function CloserOutilsPage() {
  const [outils, setOutils] = useState<OutilCloser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadOutils();
  }, []);

  async function loadOutils() {
    try {
      const { data, error } = await supabase
        .from('outils_closers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOutils(data || []);
    } catch (error) {
      console.error('Erreur chargement outils:', error);
    } finally {
      setLoading(false);
    }
  }

  const categories = [
    { value: 'all', label: '📚 Tous les outils' },
    { value: 'Closing', label: '💼 Closing' },
    { value: 'Formation', label: '🎓 Formation' },
    { value: 'Technique', label: '⚙️ Technique' }
  ];

  const filteredOutils = selectedCategory === 'all' 
    ? outils 
    : outils.filter(o => o.category === selectedCategory);

  function getIcon(type: string) {
    switch (type) {
      case 'pdf':
        return <FileText className="text-red-500" size={24} />;
      case 'html':
        return <ExternalLink className="text-blue-500" size={24} />;
      case 'video':
        return <Video className="text-purple-500" size={24} />;
      default:
        return <FileText className="text-gray-500" size={24} />;
    }
  }

  function openOutil(url: string, type: string) {
    if (type === 'pdf') {
      window.open(url, '_blank');
    } else if (type === 'html') {
      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;border:none;z-index:9999;background:#fff';
      
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '✕ Fermer';
      closeBtn.style.cssText = 'position:fixed;top:20px;right:20px;z-index:10000;padding:10px 20px;background:#F97316;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.2)';
      closeBtn.onclick = () => {
        document.body.removeChild(iframe);
        document.body.removeChild(closeBtn);
      };
      
      document.body.appendChild(iframe);
      document.body.appendChild(closeBtn);
    } else {
      window.open(url, '_blank');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-black mb-2">🎯 Boîte à Outils</h1>
        <p className="text-amber-100">
          Tous les outils pour closer efficacement
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedCategory === cat.value
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-50 border'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {filteredOutils.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="mx-auto text-slate-300 mb-4" size={64} />
            <p className="text-slate-500">Aucun outil disponible</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredOutils.map(outil => (
            <Card 
              key={outil.id} 
              className="border-2 hover:border-amber-300 hover:shadow-lg transition-all cursor-pointer"
              onClick={() => openOutil(outil.url, outil.type)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    {getIcon(outil.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-lg text-slate-900">
                        {outil.title}
                      </h3>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded">
                        {outil.category}
                      </span>
                    </div>
                    
                    <p className="text-sm text-slate-600 mb-4">
                      {outil.description}
                    </p>

                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        className="bg-amber-500 hover:bg-amber-600 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          openOutil(outil.url, outil.type);
                        }}
                      >
                        {outil.type === 'pdf' ? (
                          <>
                            <Download size={16} className="mr-2" />
                            Télécharger
                          </>
                        ) : outil.type === 'video' ? (
                          <>
                            <Video size={16} className="mr-2" />
                            Regarder
                          </>
                        ) : (
                          <>
                            <ExternalLink size={16} className="mr-2" />
                            Ouvrir
                          </>
                        )}
                      </Button>

                      <span className="text-xs text-slate-400 uppercase font-semibold">
                        {outil.type.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
