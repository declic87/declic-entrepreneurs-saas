'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OnboardingVideo } from '@/components/OnboardingVideo';
import { Bell, Lock, User } from 'lucide-react';

export default function ParametresPage() {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      {/* VIDÉO ONBOARDING */}
      <OnboardingVideo pageSlug="parametres" />

      <h1 className="text-3xl font-bold text-[#123055]">Paramètres</h1>

      {/* Profil */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-[#123055] mb-6 flex items-center gap-2">
            <User size={20} />
            Informations personnelles
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Prénom</label>
              <Input placeholder="Client" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Nom</label>
              <Input placeholder="Test" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Email</label>
              <Input type="email" placeholder="contact@jj-conseil.fr" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Téléphone</label>
              <Input placeholder="+33 6 12 34 56 78" />
            </div>
          </div>

          <Button className="mt-6 bg-amber-500 hover:bg-amber-600 text-white">
            Enregistrer les modifications
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-[#123055] mb-6 flex items-center gap-2">
            <Bell size={20} />
            Notifications
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Nouveaux coachings</p>
                <p className="text-sm text-slate-500">Recevoir une notification lors de nouveaux coachings</p>
              </div>
              <input type="checkbox" className="w-5 h-5" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Nouveaux ateliers</p>
                <p className="text-sm text-slate-500">Recevoir une notification lors de nouveaux ateliers</p>
              </div>
              <input type="checkbox" className="w-5 h-5" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Nouvelles vidéos</p>
                <p className="text-sm text-slate-500">Recevoir une notification pour les nouveaux contenus</p>
              </div>
              <input type="checkbox" className="w-5 h-5" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Messages experts</p>
                <p className="text-sm text-slate-500">Notification quand un expert vous répond</p>
              </div>
              <input type="checkbox" className="w-5 h-5" defaultChecked />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sécurité */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-[#123055] mb-6 flex items-center gap-2">
            <Lock size={20} />
            Sécurité
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Mot de passe actuel</label>
              <Input type="password" placeholder="••••••••" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Nouveau mot de passe</label>
              <Input type="password" placeholder="••••••••" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Confirmer le mot de passe</label>
              <Input type="password" placeholder="••••••••" />
            </div>
          </div>

          <Button className="mt-6 bg-amber-500 hover:bg-amber-600 text-white">
            Modifier le mot de passe
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}