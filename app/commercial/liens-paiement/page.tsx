'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, ExternalLink } from 'lucide-react';

const PAYMENT_LINKS = [
  {
    category: "Abonnement",
    items: [
      { name: "Plateforme 97€/mois", price: "97€", link: "https://buy.stripe.com/eVqeVc2Dtgfk2eFdPx9fW07" },
    ]
  },
  {
    category: "Formations",
    items: [
      { name: "Formation Créateur", price: "497€", link: "https://buy.stripe.com/aFafZg2Dt3sy06x5j19fW03" },
      { name: "Formation Agent Immobilier", price: "897€", link: "https://buy.stripe.com/4gM3cu5PFd382eF5j19fW02" },
    ]
  },
  {
    category: "Packs - Paiement comptant",
    items: [
      { name: "Starter", price: "3 600€", link: "https://buy.stripe.com/00weVcdi72ou8D34eX9fW06" },
      { name: "Pro", price: "4 600€", link: "https://buy.stripe.com/00w9AS7XNgfk5qR6n59fW05" },
      { name: "Expert", price: "6 600€", link: "https://buy.stripe.com/fZueVcb9Z4wCf1r9zh9fW04" },
    ]
  },
  {
    category: "Packs - Paiement en plusieurs fois",
    items: [
      { name: "Pro 5x920€", price: "5x 920€", link: "https://buy.stripe.com/7sY5kC7XNaV0g5v12L9fW09" },
      { name: "Expert 5x1320€", price: "5x 1 320€", link: "https://buy.stripe.com/fZu14memb0gm5qR3aT9fW0b" },
      { name: "Expert 6x1100€", price: "6x 1 100€", link: "https://buy.stripe.com/cNi3cu2Dt1kq7yZ6n59fW0c" },
    ]
  },
];

export default function LiensPaiementPage() {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [emailClient, setEmailClient] = useState('');

  function copyToClipboard(link: string, name: string) {
    navigator.clipboard.writeText(link);
    setCopiedLink(name);
    setTimeout(() => setCopiedLink(null), 2000);
  }

  function envoyerParEmail(link: string, name: string) {
    const subject = encodeURIComponent(`Votre lien de paiement - ${name}`);
    const body = encodeURIComponent(
      `Bonjour,\n\nVoici votre lien de paiement pour ${name} :\n\n${link}\n\nCordialement,\nL'équipe Déclic Entrepreneurs`
    );
    window.location.href = `mailto:${emailClient}?subject=${subject}&body=${body}`;
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 mb-2">
          💳 Liens de paiement
        </h1>
        <p className="text-slate-600">
          Copiez et envoyez les liens de paiement Stripe à vos clients
        </p>
      </div>

      {/* Email client */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>📧 Email du client (optionnel)</CardTitle>
          <CardDescription>
            Renseignez l'email pour envoyer directement le lien par email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="email"
            placeholder="client@example.com"
            value={emailClient}
            onChange={(e) => setEmailClient(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Liens par catégorie */}
      <div className="space-y-6">
        {PAYMENT_LINKS.map((category) => (
          <Card key={category.category}>
            <CardHeader>
              <CardTitle>{category.category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {category.items.map((item) => (
                  <div
                    key={item.name}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-sm text-slate-600">{item.price}</p>
                    </div>

                    <div className="flex gap-2">
                      {/* Copier */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(item.link, item.name)}
                        className="gap-2"
                      >
                        {copiedLink === item.name ? (
                          <>
                            <Check size={16} className="text-green-600" />
                            Copié !
                          </>
                        ) : (
                          <>
                            <Copy size={16} />
                            Copier
                          </>
                        )}
                      </Button>

                      {/* Envoyer par email */}
                      {emailClient && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => envoyerParEmail(item.link, item.name)}
                          className="gap-2"
                        >
                          📧 Envoyer
                        </Button>
                      )}

                      {/* Ouvrir */}
                      <a href={item.link} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="gap-2">
                          <ExternalLink size={16} />
                          Ouvrir
                        </Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          <strong>💡 Conseil :</strong> Pendant l'appel, copiez le lien et envoyez-le directement au client par WhatsApp, SMS ou email.
        </p>
      </div>
    </div>
  );
}