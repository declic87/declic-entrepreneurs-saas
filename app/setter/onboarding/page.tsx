'use client';

import { OnboardingVideo } from '@/components/OnboardingVideo';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, Users, Target, TrendingUp } from 'lucide-react';

export default function SetterOnboardingPage() {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <OnboardingVideo pageSlug="general" role="SETTER" />

      <div className="text-center">
        <h1 className="text-4xl font-bold text-[#123055] mb-4">
          Formation Setter 📞
        </h1>
        <p className="text-lg text-gray-600">
          Tout ce que vous devez savoir pour réussir en tant que Setter
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <Phone className="text-amber-500 mb-4" size={32} />
            <h3 className="text-xl font-bold text-[#123055] mb-2">
              Techniques d'Appel
            </h3>
            <p className="text-gray-600 text-sm">
              Maîtrisez l'art de l'appel sortant : accroche, qualification, prise de rendez-vous.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <Users className="text-blue-500 mb-4" size={32} />
            <h3 className="text-xl font-bold text-[#123055] mb-2">
              Gestion des Leads
            </h3>
            <p className="text-gray-600 text-sm">
              Apprenez à qualifier efficacement vos leads et à optimiser votre taux de conversion.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <Target className="text-green-500 mb-4" size={32} />
            <h3 className="text-xl font-bold text-[#123055] mb-2">
              Scripts de Vente
            </h3>
            <p className="text-gray-600 text-sm">
              Découvrez les scripts éprouvés et apprenez à les personnaliser selon vos interlocuteurs.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <TrendingUp className="text-purple-500 mb-4" size={32} />
            <h3 className="text-xl font-bold text-[#123055] mb-2">
              Performance & Objectifs
            </h3>
            <p className="text-gray-600 text-sm">
              Suivez vos KPIs, atteignez vos objectifs et maximisez vos commissions.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold text-[#123055] mb-4">
            Prêt à devenir un Setter performant ?
          </h3>
          <p className="text-gray-700 mb-6">
            Regardez la vidéo ci-dessus pour découvrir votre parcours de formation et commencer votre transformation.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
            <span>✅ Scripts complets</span>
            <span>✅ Techniques éprouvées</span>
            <span>✅ Support expert</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}