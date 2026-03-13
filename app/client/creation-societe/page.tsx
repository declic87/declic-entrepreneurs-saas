'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, ExternalLink, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const SOLUTIONS = [
  {
    id: 'declic',
    name: 'Déclic Entrepreneurs',
    description: 'Accompagnement complet de A à Z par nos experts',
    badge: 'Recommandé',
    badgeColor: 'bg-amber-500',
    icon: '🚀',
    loomUrl: 'https://www.loom.com/share/VOTRE_VIDEO_DECLIC',
    ctaText: 'Commencer les 8 étapes',
    ctaLink: '/client/creation-societe/declic',
    price: 'Inclus dans votre pack',
    features: [
      'Assistance personnalisée',
      'Formulaires pré-remplis',
      'Validation à chaque étape',
      'Support expert 7j/7',
      'Suivi jusqu\'à l\'immatriculation'
    ],
    color: 'border-amber-300 bg-amber-50'
  },
  {
    id: 'qonto',
    name: 'Qonto',
    description: 'Compte pro + création de société en autonomie',
    badge: 'Partenaire',
    badgeColor: 'bg-purple-500',
    icon: '🏦',
    loomUrl: 'https://www.loom.com/share/VOTRE_VIDEO_QONTO',
    ctaText: 'Créer avec Qonto',
    ctaLink: 'https://qonto.com/fr/partenaires?utm_source=declic',
    isExternal: true,
    price: 'À partir de 9€/mois',
    features: [
      'Compte pro immédiat',
      'Carte bancaire incluse',
      'Création société guidée',
      'IBAN français instantané',
      'Interface intuitive'
    ],
    color: 'border-purple-300 bg-purple-50'
  },
  {
    id: 'shine',
    name: 'Shine',
    description: 'Néobanque + outils de gestion simplifiés',
    badge: 'Partenaire',
    badgeColor: 'bg-blue-500',
    icon: '✨',
    loomUrl: 'https://www.loom.com/share/VOTRE_VIDEO_SHINE',
    ctaText: 'Créer avec Shine',
    ctaLink: 'https://www.shine.fr/?utm_source=declic',
    isExternal: true,
    price: 'À partir de 7,90€/mois',
    features: [
      'Compte + carte pro',
      'Facturation intégrée',
      'Déclaration TVA simplifiée',
      'Accompagnement création',
      'Application mobile'
    ],
    color: 'border-blue-300 bg-blue-50'
  },
  {
    id: 'indy',
    name: 'Indy',
    description: 'Comptabilité automatisée + création société',
    badge: 'Partenaire',
    badgeColor: 'bg-green-500',
    icon: '📊',
    loomUrl: 'https://www.loom.com/share/VOTRE_VIDEO_INDY',
    ctaText: 'Créer avec Indy',
    ctaLink: 'https://www.indy.fr/?utm_source=declic',
    isExternal: true,
    price: 'À partir de 0€/mois',
    features: [
      'Comptabilité automatique',
      'Déclarations fiscales',
      'Compte pro intégré',
      'Support création société',
      'Gratuit jusqu\'à 30k€ CA'
    ],
    color: 'border-green-300 bg-green-50'
  }
];

export default function CreationSocietePage() {
  const [showVideoModal, setShowVideoModal] = useState<string | null>(null);

  function getLoomEmbedUrl(url: string): string {
    if (!url) return '';
    const match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
    if (match) {
      return `https://www.loom.com/embed/${match[1]}`;
    }
    return url;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-black text-slate-900 mb-4">
            🏢 Créer votre société
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Choisissez la solution qui correspond le mieux à vos besoins et votre niveau d'autonomie
          </p>
        </div>

        {/* Grille des solutions */}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          {SOLUTIONS.map((solution) => (
            <Card
              key={solution.id}
              className={`border-2 ${solution.color} hover:shadow-xl transition-all relative overflow-hidden`}
            >
              {/* Badge */}
              {solution.badge && (
                <div className="absolute top-4 right-4">
                  <Badge className={`${solution.badgeColor} text-white`}>
                    {solution.badge}
                  </Badge>
                </div>
              )}

              <CardHeader>
                <div className="text-5xl mb-4">{solution.icon}</div>
                <CardTitle className="text-2xl">{solution.name}</CardTitle>
                <p className="text-sm text-slate-600 mt-2">
                  {solution.description}
                </p>
                <p className="text-lg font-bold text-slate-900 mt-3">
                  {solution.price}
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Features */}
                <ul className="space-y-2">
                  {solution.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Bouton vidéo */}
                <Button
                  variant="outline"
                  onClick={() => setShowVideoModal(solution.id)}
                  className="w-full"
                >
                  <Play className="mr-2" size={16} />
                  Voir la vidéo explicative
                </Button>

                {/* CTA principal */}
                {solution.isExternal ? (
                  <a href={solution.ctaLink} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white">
                      {solution.ctaText}
                      <ExternalLink className="ml-2" size={16} />
                    </Button>
                  </a>
                ) : (
                  <Link href={solution.ctaLink}>
                    <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                      {solution.ctaText}
                      <ArrowRight className="ml-2" size={16} />
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info supplémentaire */}
        <div className="bg-white rounded-xl border-2 border-slate-200 p-6 text-center">
          <p className="text-slate-700">
            <strong>💡 Besoin d'aide pour choisir ?</strong> Contactez votre expert Déclic qui vous guidera vers la meilleure solution.
          </p>
        </div>
      </div>

      {/* Modal vidéo */}
      {showVideoModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowVideoModal(null)}
        >
          <div
            className="bg-white rounded-xl max-w-4xl w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-lg">
                {SOLUTIONS.find(s => s.id === showVideoModal)?.name}
              </h3>
              <button
                onClick={() => setShowVideoModal(null)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold"
              >
                ✕
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              {(() => {
                const solution = SOLUTIONS.find(s => s.id === showVideoModal);
                if (!solution?.loomUrl) return null;

                return (
                  <iframe
                    src={getLoomEmbedUrl(solution.loomUrl)}
                    frameBorder="0"
                    allowFullScreen
                    className="w-full h-full"
                  />
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}