'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { CheckCircle2, Circle, Clock, Play } from 'lucide-react';

interface OnboardingStep {
  id: string;
  step: string;
  status: string;
  completed_at: string | null;
  data: any;
}

interface OnboardingTrackerProps {
  teamMemberId: string;
  role: string;
}

const STEP_LABELS: Record<string, { title: string; description: string }> = {
  contract_signature: { title: 'Signature du contrat', description: 'Signer électroniquement votre contrat' },
  profile_setup: { title: 'Profil complété', description: 'Remplir vos informations personnelles' },
  training_video_basics: { title: 'Vidéo : Les Bases', description: 'Comprendre le fonctionnement de la plateforme' },
  training_video_calls: { title: 'Vidéo : Techniques d\'Appel', description: 'Maîtriser les appels sortants' },
  training_video_sales: { title: 'Vidéo : Techniques de Vente', description: 'Closing et persuasion' },
  training_video_objections: { title: 'Vidéo : Gestion des Objections', description: 'Répondre aux blocages clients' },
  training_video_expert: { title: 'Vidéo : Rôle Expert', description: 'Accompagnement client expert' },
  script_review: { title: 'Revue des Scripts', description: 'Lire et comprendre les scripts d\'appel' },
  script_mastery: { title: 'Maîtrise des Scripts', description: 'Connaître les scripts par cœur' },
  shadow_call: { title: 'Écoute d\'Appel', description: 'Observer un closer expérimenté' },
  first_call_supervised: { title: 'Premier Appel Supervisé', description: 'Réaliser votre premier appel' },
  first_close_supervised: { title: 'Première Vente Supervisée', description: 'Closer votre premier deal' },
  platform_walkthrough: { title: 'Tour de la Plateforme', description: 'Découvrir les fonctionnalités' },
  first_client_assignment: { title: 'Premier Client Assigné', description: 'Recevoir votre premier client' },
  quiz_completed: { title: 'Quiz de Validation', description: 'Valider vos connaissances' },
};

export default function OnboardingTracker({ teamMemberId, role }: OnboardingTrackerProps) {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadOnboarding();
  }, [teamMemberId]);

  async function loadOnboarding() {
    const { data, error } = await supabase
      .from('team_member_onboarding')
      .select('*')
      .eq('team_member_id', teamMemberId)
      .order('created_at');

    if (data) {
      setSteps(data);
      
      const completed = data.filter(s => s.status === 'completed').length;
      const total = data.length;
      setProgress(total > 0 ? Math.round((completed / total) * 100) : 0);
    }

    setLoading(false);
  }

  async function completeStep(stepId: string) {
    const { error } = await supabase
      .from('team_member_onboarding')
      .update({ 
        status: 'completed', 
        completed_at: new Date().toISOString() 
      })
      .eq('id', stepId);

    if (!error) {
      loadOnboarding();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Progress Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-900">Onboarding</h2>
          <span className="text-3xl font-bold text-orange-600">{progress}%</span>
        </div>
        
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <p className="text-sm text-gray-500 mt-2">
          {steps.filter(s => s.status === 'completed').length} / {steps.length} étapes complétées
        </p>
      </div>

      {/* Steps List */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const stepInfo = STEP_LABELS[step.step] || { 
            title: step.step, 
            description: '' 
          };
          
          const isCompleted = step.status === 'completed';
          const isPending = step.status === 'pending';
          const isInProgress = step.status === 'in_progress';

          return (
            <div
              key={step.id}
              className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                isCompleted
                  ? 'border-green-200 bg-green-50'
                  : isInProgress
                  ? 'border-orange-200 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {/* Icon */}
              <div className="flex-shrink-0">
                {isCompleted ? (
                  <CheckCircle2 className="text-green-600" size={32} />
                ) : isInProgress ? (
                  <Clock className="text-orange-600" size={32} />
                ) : (
                  <Circle className="text-gray-400" size={32} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900">{stepInfo.title}</h3>
                {stepInfo.description && (
                  <p className="text-sm text-gray-600">{stepInfo.description}</p>
                )}
                {step.completed_at && (
                  <p className="text-xs text-gray-400 mt-1">
                    Complété le {new Date(step.completed_at).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>

              {/* Action */}
              {!isCompleted && (
                <button
                  onClick={() => completeStep(step.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Play size={16} />
                  Commencer
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Completion Message */}
      {progress === 100 && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-semibold flex items-center gap-2">
            <CheckCircle2 size={20} />
            🎉 Félicitations ! Vous avez terminé votre onboarding !
          </p>
        </div>
      )}
    </div>
  );
}