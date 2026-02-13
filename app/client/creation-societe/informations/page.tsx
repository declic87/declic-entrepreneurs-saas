'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ShareholdersForm, { Shareholder } from './components/ShareholdersForm';
import { useShareholders } from '@/hooks/useShareholders';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { requiresMultipleAssocies, requiresProfession } from '@/lib/config/documents-config';

const PROFESSIONS = [
  { value: 'medecin', label: 'Médecin' },
  { value: 'architecte', label: 'Architecte' },
  { value: 'avocat', label: 'Avocat' },
  { value: 'expert_comptable', label: 'Expert-comptable' },
  { value: 'kine', label: 'Masseur-Kinésithérapeute' },
  { value: 'infirmier', label: 'Infirmier' },
  { value: 'dentiste', label: 'Chirurgien-dentiste' },
  { value: 'veterinaire', label: 'Vétérinaire' },
];

export default function InformationsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Données du formulaire
  const [companyType, setCompanyType] = useState<string>('');
  const [companyName, setCompanyName] = useState('');
  const [capitalAmount, setCapitalAmount] = useState<number>(0);
  const [activityDescription, setActivityDescription] = useState('');
  const [duree, setDuree] = useState('99');
  const [profession, setProfession] = useState('');

  // Adresse
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('France');

  // Président/Gérant (pour unipersonnelles)
  const [presidentFirstName, setPresidentFirstName] = useState('');
  const [presidentLastName, setPresidentLastName] = useState('');
  const [presidentBirthDate, setPresidentBirthDate] = useState('');
  const [presidentBirthPlace, setPresidentBirthPlace] = useState('');
  const [presidentNationality, setPresidentNationality] = useState('Française');
  const [presidentAddress, setPresidentAddress] = useState('');

  // Banque
  const [bankName, setBankName] = useState('');
  const [iban, setIban] = useState('');

  // Hook pour les associés
  const {
    shareholders,
    loading: shareholdersLoading,
    saveShareholders,
  } = useShareholders(userId);

  const [localShareholders, setLocalShareholders] = useState<Shareholder[]>(shareholders);

  // Déterminer si multi-associés
  const isMultiAssocies = companyType ? requiresMultipleAssocies(companyType) : false;
  const needsProfession = companyType ? requiresProfession(companyType) : false;

  // Charger les données au montage
  useEffect(() => {
    const loadData = async () => {
      try {
        // Récupérer l'utilisateur
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        // Récupérer le user_id depuis la table users
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();

        if (!userData) {
          router.push('/login');
          return;
        }

        setUserId(userData.id);

        // Charger les données de création
        const { data: companyData } = await supabase
          .from('company_creation_data')
          .select('*')
          .eq('user_id', userData.id)
          .single();

        if (companyData) {
          setCompanyType(companyData.company_type || '');
          setCompanyName(companyData.company_name || '');
          setCapitalAmount(companyData.capital_amount || 0);
          setActivityDescription(companyData.activity_description || '');
          setDuree(companyData.duree || '99');
          setProfession(companyData.profession || '');
          setAddressLine1(companyData.address_line1 || '');
          setAddressLine2(companyData.address_line2 || '');
          setPostalCode(companyData.postal_code || '');
          setCity(companyData.city || '');
          setCountry(companyData.country || 'France');
          setPresidentFirstName(companyData.president_first_name || '');
          setPresidentLastName(companyData.president_last_name || '');
          setPresidentBirthDate(companyData.president_birth_date || '');
          setPresidentBirthPlace(companyData.president_birth_place || '');
          setPresidentNationality(companyData.president_nationality || 'Française');
          setPresidentAddress(companyData.president_address || '');
          setBankName(companyData.bank_name || '');
          setIban(companyData.iban || '');
        }
      } catch (error) {
        console.error('Erreur chargement:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router, supabase]);

  // Synchroniser shareholders avec localShareholders
  useEffect(() => {
    if (shareholders.length > 0) {
      setLocalShareholders(shareholders);
    }
  }, [shareholders]);

  // Sauvegarder les données
  const handleSave = async () => {
    setSaving(true);

    try {
      // 1. Sauvegarder les données société
      const { error: companyError } = await supabase
        .from('company_creation_data')
        .update({
          company_name: companyName,
          capital_amount: capitalAmount,
          activity_description: activityDescription,
          duree: duree,
          profession: needsProfession ? profession : null,
          address_line1: addressLine1,
          address_line2: addressLine2,
          postal_code: postalCode,
          city: city,
          country: country,
          president_first_name: presidentFirstName,
          president_last_name: presidentLastName,
          president_birth_date: presidentBirthDate,
          president_birth_place: presidentBirthPlace,
          president_nationality: presidentNationality,
          president_address: presidentAddress,
          bank_name: bankName,
          iban: iban,
          step: 'documents',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (companyError) throw companyError;

      // 2. Sauvegarder les associés (si multi-associés)
      if (isMultiAssocies && localShareholders.length >= 2) {
        const success = await saveShareholders(localShareholders);
        if (!success) {
          alert('Erreur lors de la sauvegarde des associés');
          return;
        }
      }

      // 3. Rediriger vers l'étape suivante
      router.push('/client/creation-societe/documents');
    } catch (error: any) {
      console.error('Erreur sauvegarde:', error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Validation
  const isValid = () => {
    if (!companyName || !capitalAmount || !activityDescription) return false;
    if (!addressLine1 || !postalCode || !city) return false;

    // Si multi-associés, vérifier les associés
    if (isMultiAssocies) {
      if (localShareholders.length < 2) return false;
      const totalPercentage = localShareholders.reduce((sum, s) => sum + s.shares_percentage, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) return false;
    } else {
      // Si unipersonnel, vérifier le président/gérant
      if (!presidentFirstName || !presidentLastName || !presidentBirthDate) return false;
    }

    // Si profession requise, vérifier
    if (needsProfession && !profession) return false;

    return true;
  };

  if (loading || shareholdersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Informations de la société</h1>
          <p className="text-gray-600 mt-2">Étape 2/5 - Renseignez les informations de votre {companyType}</p>
        </div>

        <div className="space-y-6">
          {/* Informations société */}
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Dénomination sociale *</Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: Ma Société SAS"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Capital social (€) *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={capitalAmount}
                    onChange={(e) => setCapitalAmount(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Durée (années) *</Label>
                  <Input value={duree} onChange={(e) => setDuree(e.target.value)} />
                </div>
              </div>

              <div>
                <Label>Objet social / Activité *</Label>
                <Textarea
                  value={activityDescription}
                  onChange={(e) => setActivityDescription(e.target.value)}
                  placeholder="Décrivez l'activité de votre société..."
                  rows={4}
                />
              </div>

              {needsProfession && (
                <div>
                  <Label>Profession réglementée *</Label>
                  <Select value={profession} onValueChange={setProfession}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez votre profession" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROFESSIONS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Adresse */}
          <Card>
            <CardHeader>
              <CardTitle>Siège social</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Adresse ligne 1 *</Label>
                <Input
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="10 rue de la République"
                />
              </div>
              <div>
                <Label>Adresse ligne 2</Label>
                <Input
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Bâtiment A, 3ème étage"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Code postal *</Label>
                  <Input
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="75001"
                  />
                </div>
                <div>
                  <Label>Ville *</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Paris" />
                </div>
              </div>
              <div>
                <Label>Pays</Label>
                <Input value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Président/Gérant (si unipersonnel) */}
          {!isMultiAssocies && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {['SASU', 'SELASU'].includes(companyType) ? 'Président' : 'Gérant'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Prénom *</Label>
                    <Input
                      value={presidentFirstName}
                      onChange={(e) => setPresidentFirstName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Nom *</Label>
                    <Input
                      value={presidentLastName}
                      onChange={(e) => setPresidentLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date de naissance *</Label>
                    <Input
                      type="date"
                      value={presidentBirthDate}
                      onChange={(e) => setPresidentBirthDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Lieu de naissance *</Label>
                    <Input
                      value={presidentBirthPlace}
                      onChange={(e) => setPresidentBirthPlace(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label>Nationalité *</Label>
                  <Input
                    value={presidentNationality}
                    onChange={(e) => setPresidentNationality(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Adresse personnelle *</Label>
                  <Textarea
                    value={presidentAddress}
                    onChange={(e) => setPresidentAddress(e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Associés (si multi-associés) */}
          {isMultiAssocies && (
            <ShareholdersForm
              companyType={companyType}
              capitalAmount={capitalAmount}
              shareholders={localShareholders}
              onChange={setLocalShareholders}
              requiresProfession={needsProfession}
            />
          )}

          {/* Banque */}
          <Card>
            <CardHeader>
              <CardTitle>Informations bancaires</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nom de la banque</Label>
                <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
              </div>
              <div>
                <Label>IBAN</Label>
                <Input value={iban} onChange={(e) => setIban(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Boutons navigation */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => router.push('/client/creation-societe/statut')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <Button onClick={handleSave} disabled={!isValid() || saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  Continuer
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}