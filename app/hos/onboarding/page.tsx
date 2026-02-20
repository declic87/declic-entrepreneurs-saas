'use client';

import { OnboardingVideo } from '@/components/OnboardingVideo';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Users, TrendingUp, Award } from 'lucide-react';

export default function HOSOnboardingPage() {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <OnboardingVideo pageSlug="general" role="HOS" />

      <div className="text-center">
        <h1 className="text-4xl font-bold text-[#123055] mb-4">
          Formation Head of Sales 🎯
        </h1>
        <p className="text-lg text-gray-600">
          Bienvenue dans votre formation complète pour piloter votre équipe commerciale
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <Target className="text-amber-500 mb-4" size={32} />
            <h3 className="text-xl font-bold text-[#123055] mb-2">
              Pilotage du Pipeline
            </h3>
            <p className="text-gray-600 text-sm">
              Apprenez à gérer efficacement le pipeline commercial de votre équipe et à optimiser les conversions.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <Users className="text-blue-500 mb-4" size={32} />
            <h3 className="text-xl font-bold text-[#123055] mb-2">
              Management d'Équipe
            </h3>
            <p className="text-gray-600 text-sm">
              Découvrez les meilleures pratiques pour motiver, coacher et développer votre équipe commerciale.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <TrendingUp className="text-green-500 mb-4" size={32} />
            <h3 className="text-xl font-bold text-[#123055] mb-2">
              Performance & KPIs
            </h3>
            <p className="text-gray-600 text-sm">
              Maîtrisez les indicateurs clés de performance et les tableaux de bord pour piloter efficacement.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <Award className="text-purple-500 mb-4" size={32} />
            <h3 className="text-xl font-bold text-[#123055] mb-2">
              Stratégie Commerciale
            </h3>
            <p className="text-gray-600 text-sm">
              Développez une stratégie commerciale gagnante adaptée à votre marché et vos objectifs.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold text-[#123055] mb-4">
            Prêt à devenir un Head of Sales d'exception ?
          </h3>
          <p className="text-gray-700 mb-6">
            Regardez la vidéo ci-dessus pour découvrir votre parcours de formation et commencer votre transformation.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
            <span>✅ Formation complète</span>
            <span>✅ Outils pratiques</span>
            <span>✅ Support dédié</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}