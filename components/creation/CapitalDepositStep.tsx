'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Upload, Video, ExternalLink, Calendar, Info } from 'lucide-react';
import { createClient } from '@/lib/supabase/client'; // TON import existant

interface CapitalDepositStepProps {
  companyId: string;
  onComplete: () => void;
}

export default function CapitalDepositStep({ companyId, onComplete }: CapitalDepositStepProps) {
  const [bankChoice, setBankChoice] = useState<'shine' | 'autre' | null>(null);
  const [otherBankName, setOtherBankName] = useState('');
  const [depositDate, setDepositDate] = useState('');
  const [attestationFile, setAttestationFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [attestationUrl, setAttestationUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  async function handleFileUpload(file: File) {
    setUploading(true);
    setError(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${companyId}/attestation-depot-capital-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      setAttestationUrl(publicUrl);
      return publicUrl;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!bankChoice) {
      setError('Veuillez choisir une banque');
      return;
    }

    if (bankChoice === 'autre' && !otherBankName) {
      setError('Veuillez saisir le nom de votre banque');
      return;
    }

    if (!depositDate) {
      setError('Veuillez saisir la date de dépôt');
      return;
    }

    if (!attestationUrl) {
      setError('Veuillez uploader l\'attestation de dépôt');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Mettre à jour la société avec les infos de dépôt capital
      const { error: updateError } = await supabase
        .from('user_companies')
        .update({
          bank_choice: bankChoice,
          bank_name: bankChoice === 'shine' ? 'Shine' : otherBankName,
          capital_deposit_date: depositDate,
          signature_date: depositDate, // La date de dépôt devient la date de signature
          attestation_depot_url: attestationUrl,
          capital_deposit_completed: true,
          current_step: 4
        })
        .eq('id', companyId);

      if (updateError) throw updateError;

      // Historiser l'étape
      const { error: historyError } = await supabase.rpc('complete_company_step', {
        p_company_id: companyId,
        p_step_number: 3,
        p_notes: `Dépôt capital effectué le ${depositDate} chez ${bankChoice === 'shine' ? 'Shine' : otherBankName}`
      });

      if (historyError) {
        console.warn('Historisation non disponible:', historyError);
        // On continue quand même si l'historisation échoue
      }

      setSuccess(true);
      setTimeout(() => onComplete(), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-8">
      {/* En-tête */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-slate-900 mb-3">Étape 3 : Dépôt de Capital</h2>
        <p className="text-slate-600">Le dépôt de capital est obligatoire pour créer votre société</p>
      </div>

      {/* Vidéo explicative */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-start gap-4">
          <Video className="text-blue-600 flex-shrink-0" size={32} />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-blue-900 mb-2">📹 Vidéo explicative</h3>
            <p className="text-blue-800 text-sm mb-4">
              Découvrez comment effectuer votre dépôt de capital en 3 minutes
            </p>
            <div className="aspect-video bg-slate-800 rounded-lg overflow-hidden">
              {/* Remplace VOTRE_VIDEO_ID par ton vrai ID Loom */}
              <iframe
                src="https://www.loom.com/embed/VOTRE_VIDEO_ID"
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Choix de la banque */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Où déposer votre capital ?</h3>
        
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* Option Shine */}
          <button
            type="button"
            onClick={() => setBankChoice('shine')}
            className={`p-6 rounded-xl border-2 transition-all text-left ${
              bankChoice === 'shine'
                ? 'border-emerald-500 bg-emerald-50 ring-4 ring-emerald-500/20'
                : 'border-slate-200 hover:border-emerald-300 bg-white'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-bold text-lg">Shine</h4>
                <p className="text-xs text-emerald-600 font-semibold">✨ Partenaire recommandé</p>
              </div>
              {bankChoice === 'shine' && <CheckCircle2 className="text-emerald-600" size={24} />}
            </div>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="text-emerald-500 flex-shrink-0 mt-0.5" size={16} />
                <span>Dépôt 100% en ligne en 5 min</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="text-emerald-500 flex-shrink-0 mt-0.5" size={16} />
                <span>Attestation immédiate</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="text-emerald-500 flex-shrink-0 mt-0.5" size={16} />
                <span>1 mois offert avec le code DECLIC</span>
              </li>
            </ul>
            <Button 
              type="button"
              className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700"
              onClick={(e) => {
                e.stopPropagation();
                window.open('https://www.shine.fr?referral=DECLIC', '_blank');
              }}
            >
              <ExternalLink size={16} className="mr-2" />
              Ouvrir avec Shine
            </Button>
          </button>

          {/* Option autre banque */}
          <button
            type="button"
            onClick={() => setBankChoice('autre')}
            className={`p-6 rounded-xl border-2 transition-all text-left ${
              bankChoice === 'autre'
                ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-500/20'
                : 'border-slate-200 hover:border-blue-300 bg-white'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-bold text-lg">Autre banque</h4>
                <p className="text-xs text-slate-500">Votre banque traditionnelle</p>
              </div>
              {bankChoice === 'autre' && <CheckCircle2 className="text-blue-600" size={24} />}
            </div>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={16} />
                <span>Délai : 3-5 jours ouvrés</span>
              </li>
              <li className="flex items-start gap-2">
                <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={16} />
                <span>RDV physique souvent nécessaire</span>
              </li>
              <li className="flex items-start gap-2">
                <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={16} />
                <span>Frais variables selon banque</span>
              </li>
            </ul>
          </button>
        </div>

        {/* Nom banque si "autre" */}
        {bankChoice === 'autre' && (
          <div className="mb-6">
            <Label className="mb-2 block">Nom de votre banque</Label>
            <Input
              type="text"
              value={otherBankName}
              onChange={(e) => setOtherBankName(e.target.value)}
              placeholder="Ex: Crédit Agricole, BNP Paribas..."
              className="h-12"
            />
          </div>
        )}
      </Card>

      {/* Upload attestation */}
      {bankChoice && (
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Attestation de dépôt de capital</h3>
          
          <div className="mb-6">
            <Label className="mb-2 block">Date de dépôt du capital</Label>
            <div className="flex items-center gap-3">
              <Calendar className="text-slate-400" size={20} />
              <Input
                type="date"
                value={depositDate}
                onChange={(e) => setDepositDate(e.target.value)}
                className="h-12 flex-1"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              ⚠️ Cette date sera utilisée comme date de signature de vos documents officiels
            </p>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
            {attestationUrl ? (
              <div className="space-y-4">
                <CheckCircle2 className="mx-auto text-emerald-600" size={48} />
                <p className="font-bold text-emerald-900">Attestation uploadée ✓</p>
                <p className="text-sm text-slate-600">{attestationFile?.name}</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setAttestationUrl(null);
                    setAttestationFile(null);
                  }}
                >
                  Changer le fichier
                </Button>
              </div>
            ) : (
              <>
                <Upload className="mx-auto text-slate-400 mb-4" size={48} />
                <p className="font-bold text-slate-900 mb-2">
                  Uploadez votre attestation de dépôt de capital
                </p>
                <p className="text-sm text-slate-600 mb-4">
                  PDF, JPG ou PNG • Max 10 Mo
                </p>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 10 * 1024 * 1024) {
                        setError('Fichier trop volumineux (max 10 Mo)');
                        return;
                      }
                      setAttestationFile(file);
                      const url = await handleFileUpload(file);
                      if (!url) {
                        setAttestationFile(null);
                      }
                    }
                  }}
                  className="hidden"
                  id="attestation-upload"
                  disabled={uploading}
                />
                <label htmlFor="attestation-upload">
                  <Button type="button" asChild disabled={uploading}>
                    <span>
                      {uploading ? 'Upload en cours...' : 'Choisir un fichier'}
                    </span>
                  </Button>
                </label>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Erreur */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </Card>
      )}

      {/* Succès */}
      {success && (
        <Card className="p-4 bg-emerald-50 border-emerald-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="text-emerald-600 flex-shrink-0" size={20} />
            <p className="text-emerald-800 text-sm font-semibold">
              ✓ Dépôt de capital validé ! Redirection vers l'étape suivante...
            </p>
          </div>
        </Card>
      )}

      {/* Bouton validation */}
      <div className="flex justify-between items-center pt-6 border-t">
        <p className="text-sm text-slate-500">
          Étape 3/5 • Dépôt de capital
        </p>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!bankChoice || !depositDate || !attestationUrl || uploading}
          className="bg-indigo-600 hover:bg-indigo-700 h-12 px-8 font-bold"
          size="lg"
        >
          {uploading ? 'Enregistrement...' : 'Valider et continuer →'}
        </Button>
      </div>

      {/* Info importante */}
      <Card className="p-4 bg-amber-50 border-amber-200">
        <div className="flex items-start gap-3">
          <Info className="text-amber-600 flex-shrink-0" size={20} />
          <div className="text-xs text-amber-800">
            <p className="font-bold mb-2">💡 Important à savoir :</p>
            <ul className="space-y-1 ml-4">
              <li>• Le capital déposé reste bloqué jusqu'à l'immatriculation</li>
              <li>• Vous récupérerez les fonds après réception du Kbis</li>
              <li>• L'attestation est valable 6 mois</li>
              <li>• La date de dépôt sera celle des statuts signés</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}