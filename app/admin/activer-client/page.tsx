'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PACKS = [
  { value: 'plateforme', label: 'Plateforme 97€', price: 97 },
  { value: 'createur', label: 'Formation Créateur 497€', price: 497 },
  { value: 'agent_immo', label: 'Formation Agent Immo 897€', price: 897 },
  { value: 'starter', label: 'Pack Starter 3600€', price: 3600 },
  { value: 'pro', label: 'Pack Pro 4600€', price: 4600 },
  { value: 'expert', label: 'Pack Expert 6600€', price: 6600 },
];

const PAYMENT_METHODS = [
  { value: 'virement', label: 'Virement bancaire' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'especes', label: 'Espèces' },
  { value: 'autre', label: 'Autre' },
];

export default function ActiverClientPage() {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    pack: '',
    paymentMethod: 'virement',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedPack = PACKS.find(p => p.value === formData.pack);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!selectedPack) {
      setError('Veuillez sélectionner un pack');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/activate-client-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || null,
          pack: formData.pack,
          packPrice: selectedPack.price,
          paymentMethod: formData.paymentMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création');
      }

      setSuccess(`✅ Client activé avec succès ! Un email a été envoyé à ${formData.email}`);
      
      // Reset form
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        pack: '',
        paymentMethod: 'virement',
      });

    } catch (error: any) {
      setError(error.message || 'Erreur lors de l\'activation');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-black text-slate-900 mb-2">
        🏦 Activer un client manuellement
      </h1>
      <p className="text-slate-600 mb-8">
        Pour les paiements par virement, chèque ou autres moyens hors Stripe
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Informations du client</CardTitle>
          <CardDescription>
            Remplissez les informations du client ayant effectué un paiement manuel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations personnelles */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Jean"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Dupont"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="client@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+33 6 12 34 56 78"
              />
            </div>

            {/* Pack */}
            <div className="space-y-2">
              <Label htmlFor="pack">Pack acheté *</Label>
              <Select
                value={formData.pack}
                onValueChange={(value) => setFormData({ ...formData, pack: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un pack" />
                </SelectTrigger>
                <SelectContent>
                  {PACKS.map((pack) => (
                    <SelectItem key={pack.value} value={pack.value}>
                      {pack.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Moyen de paiement */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Moyen de paiement *</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Récapitulatif */}
            {selectedPack && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-bold text-amber-900 mb-2">📋 Récapitulatif</h3>
                <p className="text-sm text-amber-800">
                  <strong>Pack :</strong> {selectedPack.label}
                </p>
                <p className="text-sm text-amber-800">
                  <strong>Montant :</strong> {selectedPack.price}€
                </p>
                <p className="text-sm text-amber-800 mt-2">
                  Le client recevra un email avec ses identifiants :<br />
                  <strong>Mot de passe temporaire :</strong> Declic2026!
                </p>
              </div>
            )}

            {/* Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                ⚠️ {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-600">
                {success}
              </div>
            )}

            {/* Bouton */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {loading ? 'Activation en cours...' : '✅ Activer le client'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}