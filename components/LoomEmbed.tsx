'use client';

import { useEffect, useState } from 'react';

interface LoomEmbedProps {
  url: string;
  title?: string;
}

export default function LoomEmbed({ url, title }: LoomEmbedProps) {
  const [embedUrl, setEmbedUrl] = useState('');

  useEffect(() => {
    // Extraire l'ID Loom de l'URL
    // Formats possibles :
    // https://www.loom.com/share/31d1d837b8674ab1aee28ae5b253b098
    // https://www.loom.com/embed/31d1d837b8674ab1aee28ae5b253b098
    
    let videoId = url;
    
    if (url.includes('loom.com/share/')) {
      videoId = url.split('loom.com/share/')[1].split('?')[0];
    } else if (url.includes('loom.com/embed/')) {
      videoId = url.split('loom.com/embed/')[1].split('?')[0];
    } else if (url.includes('loom.com/')) {
      // Cas où c'est juste l'ID
      videoId = url.split('/').pop()?.split('?')[0] || url;
    }

    // Construire l'URL d'embed
    setEmbedUrl(`https://www.loom.com/embed/${videoId}`);
  }, [url]);

  if (!embedUrl) {
    return (
      <div className="w-full aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-bold text-gray-900 mb-3">{title}</h3>
      )}
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        <iframe
          src={embedUrl}
          frameBorder="0"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
          title={title || 'Loom video'}
        />
      </div>
    </div>
  );
}