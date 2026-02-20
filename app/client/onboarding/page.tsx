import { OnboardingVideo } from '@/components/OnboardingVideo';

export default function OnboardingPage() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <OnboardingVideo pageSlug="general" role="CLIENT" />
      
      <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
        <h1 className="text-3xl font-bold text-[#123055] mb-4">
          Bienvenue sur DÉCLIC Entrepreneurs ! 🎉
        </h1>
        <p className="text-gray-600">
          Regardez la vidéo ci-dessus pour découvrir votre espace client et toutes les fonctionnalités disponibles.
        </p>
      </div>
    </div>
  );
}