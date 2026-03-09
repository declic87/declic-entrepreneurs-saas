"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface INPIFormData {
  // Créateur
  createur_secu: string;
  createur_activite_anterieure: boolean;
  createur_nom_activite: string;
  createur_date_fin: string;
  createur_pays_activite: string;
  createur_organisme_maladie: 'agricole' | 'autre' | 'enim' | 'non_salarie' | 'regime_general' | '';
  createur_activite_parallele: boolean;
  createur_statut_parallele: 'salarie' | 'retraite' | 'salarie_agricole' | 'invalide' | '';
  createur_biologiste: boolean;
  createur_pharmacien: boolean;
  createur_ayants_droit: boolean;
  createur_nb_ayants_droit: number;
  
  // Conjoint
  conjoint_fonction: 'aucune' | 'associe' | 'collaborateur' | 'salarie' | '';
  conjoint_prenoms: string;
  conjoint_nom: string;
  conjoint_genre: 'M' | 'F' | '';
  conjoint_date_naissance: string;
  conjoint_pays_naissance: string;
  conjoint_commune_naissance: string;
  conjoint_nationalite: string;
  conjoint_adresse: string;
  conjoint_secu: string;
  conjoint_activite_anterieure: boolean;
  conjoint_nom_activite: string;
  conjoint_date_fin: string;
  conjoint_pays_activite: string;
  conjoint_organisme_maladie: 'agricole' | 'autre' | 'enim' | 'non_salarie' | 'regime_general' | '';
  conjoint_activite_parallele: boolean;
  conjoint_statut_parallele: 'salarie' | 'retraite' | 'salarie_agricole' | 'invalide' | '';
  conjoint_biologiste: boolean;
  conjoint_pharmacien: boolean;
}

interface INPIFormProps {
  statut: string;
  onComplete: (data: INPIFormData) => void;
  onBack: () => void;
}

export function INPIFormulaire({ statut, onComplete, onBack }: INPIFormProps) {
  const [formData, setFormData] = useState<INPIFormData>({
    createur_secu: '',
    createur_activite_anterieure: false,
    createur_nom_activite: '',
    createur_date_fin: '',
    createur_pays_activite: 'France',
    createur_organisme_maladie: '',
    createur_activite_parallele: false,
    createur_statut_parallele: '',
    createur_biologiste: false,
    createur_pharmacien: false,
    createur_ayants_droit: false,
    createur_nb_ayants_droit: 0,
    
    conjoint_fonction: '',
    conjoint_prenoms: '',
    conjoint_nom: '',
    conjoint_genre: '',
    conjoint_date_naissance: '',
    conjoint_pays_naissance: 'France',
    conjoint_commune_naissance: '',
    conjoint_nationalite: 'Française',
    conjoint_adresse: '',
    conjoint_secu: '',
    conjoint_activite_anterieure: false,
    conjoint_nom_activite: '',
    conjoint_date_fin: '',
    conjoint_pays_activite: 'France',
    conjoint_organisme_maladie: '',
    conjoint_activite_parallele: false,
    conjoint_statut_parallele: '',
    conjoint_biologiste: false,
    conjoint_pharmacien: false,
  });

  const [currentSection, setCurrentSection] = useState<'createur' | 'conjoint'>('createur');

  function updateField(field: keyof INPIFormData, value: any) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  function validateCreateur(): boolean {
    if (!formData.createur_secu) {
      alert('⚠️ Veuillez renseigner le numéro de sécurité sociale');
      return false;
    }
    if (!formData.createur_organisme_maladie) {
      alert('⚠️ Veuillez sélectionner l\'organisme d\'assurance maladie');
      return false;
    }
    return true;
  }

  function handleNext() {
    if (currentSection === 'createur') {
      if (validateCreateur()) {
        setCurrentSection('conjoint');
      }
    } else {
      onComplete(formData);
    }
  }

  const showConjoint = formData.conjoint_fonction !== 'aucune' && formData.conjoint_fonction !== '';

  return (
    <div className="space-y-6">
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Informations INPI pour {statut}</strong><br />
          Ces informations sont obligatoires pour le dépôt à l'INPI
        </AlertDescription>
      </Alert>

      {/* Navigation sections */}
      <div className="flex gap-2">
        <button
          onClick={() => setCurrentSection('createur')}
          className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all ${
            currentSection === 'createur'
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          1. Créateur
        </button>
        <button
          onClick={() => setCurrentSection('conjoint')}
          className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all ${
            currentSection === 'conjoint'
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          2. Conjoint(e)
        </button>
      </div>

      {/* SECTION CRÉATEUR */}
      {currentSection === 'createur' && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
            <CardTitle className="text-xl">👤 Informations du créateur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div>
              <Label className="text-sm font-bold">Numéro de sécurité sociale *</Label>
              <Input
                value={formData.createur_secu}
                onChange={(e) => updateField('createur_secu', e.target.value)}
                placeholder="1 23 45 67 890 123 45"
                maxLength={15}
                className="mt-2"
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Checkbox
                checked={formData.createur_activite_anterieure}
                onCheckedChange={(checked) => updateField('createur_activite_anterieure', checked)}
              />
              <Label className="cursor-pointer">Activité non salariée antérieure</Label>
            </div>

            {formData.createur_activite_anterieure && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-4">
                <div>
                  <Label>Nom de l'activité antérieure</Label>
                  <Input
                    value={formData.createur_nom_activite}
                    onChange={(e) => updateField('createur_nom_activite', e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date de fin</Label>
                    <Input
                      type="date"
                      value={formData.createur_date_fin}
                      onChange={(e) => updateField('createur_date_fin', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Pays de l'activité</Label>
                    <Input
                      value={formData.createur_pays_activite}
                      onChange={(e) => updateField('createur_pays_activite', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label className="text-sm font-bold mb-3 block">Organisme d'assurance maladie actuel *</Label>
              <RadioGroup
                value={formData.createur_organisme_maladie}
                onValueChange={(value: string) => updateField('createur_organisme_maladie', value)}
                className="space-y-2"
              >
                <div className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded">
                  <RadioGroupItem value="regime_general" id="org1" />
                  <Label htmlFor="org1" className="cursor-pointer">Régime général</Label>
                </div>
                <div className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded">
                  <RadioGroupItem value="non_salarie" id="org2" />
                  <Label htmlFor="org2" className="cursor-pointer">Non salarié non agricole</Label>
                </div>
                <div className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded">
                  <RadioGroupItem value="agricole" id="org3" />
                  <Label htmlFor="org3" className="cursor-pointer">Agricole</Label>
                </div>
                <div className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded">
                  <RadioGroupItem value="enim" id="org4" />
                  <Label htmlFor="org4" className="cursor-pointer">ENIM (marins)</Label>
                </div>
                <div className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded">
                  <RadioGroupItem value="autre" id="org5" />
                  <Label htmlFor="org5" className="cursor-pointer">Autre</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Checkbox
                checked={formData.createur_activite_parallele}
                onCheckedChange={(checked) => updateField('createur_activite_parallele', checked)}
              />
              <Label className="cursor-pointer">Exercez-vous une activité en parallèle ?</Label>
            </div>

            {formData.createur_activite_parallele && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <Label className="text-sm font-bold mb-3 block">Statut de l'activité parallèle</Label>
                <RadioGroup
                  value={formData.createur_statut_parallele}
                  onValueChange={(value: string) => updateField('createur_statut_parallele', value)}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-3 p-2 hover:bg-white rounded">
                    <RadioGroupItem value="salarie" id="stat1" />
                    <Label htmlFor="stat1" className="cursor-pointer">Activité salariée</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-2 hover:bg-white rounded">
                    <RadioGroupItem value="retraite" id="stat2" />
                    <Label htmlFor="stat2" className="cursor-pointer">Retraité</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-2 hover:bg-white rounded">
                    <RadioGroupItem value="salarie_agricole" id="stat3" />
                    <Label htmlFor="stat3" className="cursor-pointer">Salarié agricole</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-2 hover:bg-white rounded">
                    <RadioGroupItem value="invalide" id="stat4" />
                    <Label htmlFor="stat4" className="cursor-pointer">Pensionné en invalidité</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Checkbox
                  checked={formData.createur_biologiste}
                  onCheckedChange={(checked) => updateField('createur_biologiste', checked)}
                />
                <Label className="cursor-pointer">Affiliation biologiste</Label>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Checkbox
                  checked={formData.createur_pharmacien}
                  onCheckedChange={(checked) => updateField('createur_pharmacien', checked)}
                />
                <Label className="cursor-pointer">Affiliation pharmacien</Label>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Checkbox
                checked={formData.createur_ayants_droit}
                onCheckedChange={(checked) => updateField('createur_ayants_droit', checked)}
              />
              <Label className="cursor-pointer">Avez-vous des ayants droit à déclarer ?</Label>
            </div>

            {formData.createur_ayants_droit && (
              <div>
                <Label>Nombre d'ayants droit</Label>
                <Input
                  type="number"
                  value={formData.createur_nb_ayants_droit}
                  onChange={(e) => updateField('createur_nb_ayants_droit', parseInt(e.target.value) || 0)}
                  min="0"
                  max="10"
                  className="mt-2"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* SECTION CONJOINT */}
      {currentSection === 'conjoint' && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-100">
            <CardTitle className="text-xl">💑 Informations du conjoint(e)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div>
              <Label className="text-sm font-bold mb-3 block">Fonction du conjoint dans la société</Label>
              <RadioGroup
                value={formData.conjoint_fonction}
                onValueChange={(value: string) => updateField('conjoint_fonction', value)}
                className="space-y-2"
              >
                <div className="flex items-center space-x-3 p-3 hover:bg-slate-50 rounded-lg">
                  <RadioGroupItem value="aucune" id="fonc1" />
                  <Label htmlFor="fonc1" className="cursor-pointer">Aucune fonction</Label>
                </div>
                <div className="flex items-center space-x-3 p-3 hover:bg-slate-50 rounded-lg">
                  <RadioGroupItem value="associe" id="fonc2" />
                  <Label htmlFor="fonc2" className="cursor-pointer">Associé ou chef d'exploitation</Label>
                </div>
                <div className="flex items-center space-x-3 p-3 hover:bg-slate-50 rounded-lg">
                  <RadioGroupItem value="collaborateur" id="fonc3" />
                  <Label htmlFor="fonc3" className="cursor-pointer">Collaborateur</Label>
                </div>
                <div className="flex items-center space-x-3 p-3 hover:bg-slate-50 rounded-lg">
                  <RadioGroupItem value="salarie" id="fonc4" />
                  <Label htmlFor="fonc4" className="cursor-pointer">Salarié</Label>
                </div>
              </RadioGroup>
            </div>

            {showConjoint && (
              <>
                <Alert className="border-purple-200 bg-purple-50">
                  <AlertDescription className="text-purple-800">
                    ✏️ Veuillez remplir les informations du conjoint
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Prénom(s) *</Label>
                    <Input
                      value={formData.conjoint_prenoms}
                      onChange={(e) => updateField('conjoint_prenoms', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Nom de famille de naissance *</Label>
                    <Input
                      value={formData.conjoint_nom}
                      onChange={(e) => updateField('conjoint_nom', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="mb-2 block">Genre *</Label>
                    <RadioGroup
                      value={formData.conjoint_genre}
                      onValueChange={(value: string) => updateField('conjoint_genre', value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="M" id="genM" />
                        <Label htmlFor="genM" className="cursor-pointer">Homme</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="F" id="genF" />
                        <Label htmlFor="genF" className="cursor-pointer">Femme</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div>
                    <Label>Date de naissance *</Label>
                    <Input
                      type="date"
                      value={formData.conjoint_date_naissance}
                      onChange={(e) => updateField('conjoint_date_naissance', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Nationalité *</Label>
                    <Input
                      value={formData.conjoint_nationalite}
                      onChange={(e) => updateField('conjoint_nationalite', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Pays de naissance *</Label>
                    <Input
                      value={formData.conjoint_pays_naissance}
                      onChange={(e) => updateField('conjoint_pays_naissance', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Commune de naissance *</Label>
                    <Input
                      value={formData.conjoint_commune_naissance}
                      onChange={(e) => updateField('conjoint_commune_naissance', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label>Adresse complète *</Label>
                  <Input
                    value={formData.conjoint_adresse}
                    onChange={(e) => updateField('conjoint_adresse', e.target.value)}
                    placeholder="Numéro, rue, code postal, ville"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Numéro de sécurité sociale *</Label>
                  <Input
                    value={formData.conjoint_secu}
                    onChange={(e) => updateField('conjoint_secu', e.target.value)}
                    maxLength={15}
                    placeholder="1 23 45 67 890 123 45"
                    className="mt-2"
                  />
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Checkbox
                    checked={formData.conjoint_activite_anterieure}
                    onCheckedChange={(checked) => updateField('conjoint_activite_anterieure', checked)}
                  />
                  <Label className="cursor-pointer">Activité non salariée antérieure</Label>
                </div>

                {formData.conjoint_activite_anterieure && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-4">
                    <div>
                      <Label>Nom de l'activité antérieure</Label>
                      <Input
                        value={formData.conjoint_nom_activite}
                        onChange={(e) => updateField('conjoint_nom_activite', e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Date de fin</Label>
                        <Input
                          type="date"
                          value={formData.conjoint_date_fin}
                          onChange={(e) => updateField('conjoint_date_fin', e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Pays de l'activité</Label>
                        <Input
                          value={formData.conjoint_pays_activite}
                          onChange={(e) => updateField('conjoint_pays_activite', e.target.value)}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-bold mb-3 block">Organisme d'assurance maladie actuel</Label>
                  <RadioGroup
                    value={formData.conjoint_organisme_maladie}
                    onValueChange={(value: string) => updateField('conjoint_organisme_maladie', value)}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded">
                      <RadioGroupItem value="regime_general" id="conjorg1" />
                      <Label htmlFor="conjorg1" className="cursor-pointer">Régime général</Label>
                    </div>
                    <div className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded">
                      <RadioGroupItem value="non_salarie" id="conjorg2" />
                      <Label htmlFor="conjorg2" className="cursor-pointer">Non salarié non agricole</Label>
                    </div>
                    <div className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded">
                      <RadioGroupItem value="agricole" id="conjorg3" />
                      <Label htmlFor="conjorg3" className="cursor-pointer">Agricole</Label>
                    </div>
                    <div className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded">
                      <RadioGroupItem value="enim" id="conjorg4" />
                      <Label htmlFor="conjorg4" className="cursor-pointer">ENIM</Label>
                    </div>
                    <div className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded">
                      <RadioGroupItem value="autre" id="conjorg5" />
                      <Label htmlFor="conjorg5" className="cursor-pointer">Autre</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Checkbox
                    checked={formData.conjoint_activite_parallele}
                    onCheckedChange={(checked) => updateField('conjoint_activite_parallele', checked)}
                  />
                  <Label className="cursor-pointer">Exerce une activité en parallèle ?</Label>
                </div>

                {formData.conjoint_activite_parallele && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <Label className="text-sm font-bold mb-3 block">Statut de l'activité parallèle</Label>
                    <RadioGroup
                      value={formData.conjoint_statut_parallele}
                      onValueChange={(value: string) => updateField('conjoint_statut_parallele', value)}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-3 p-2 hover:bg-white rounded">
                        <RadioGroupItem value="salarie" id="conjstat1" />
                        <Label htmlFor="conjstat1" className="cursor-pointer">Activité salariée</Label>
                      </div>
                      <div className="flex items-center space-x-3 p-2 hover:bg-white rounded">
                        <RadioGroupItem value="retraite" id="conjstat2" />
                        <Label htmlFor="conjstat2" className="cursor-pointer">Retraité</Label>
                      </div>
                      <div className="flex items-center space-x-3 p-2 hover:bg-white rounded">
                        <RadioGroupItem value="salarie_agricole" id="conjstat3" />
                        <Label htmlFor="conjstat3" className="cursor-pointer">Salarié agricole</Label>
                      </div>
                      <div className="flex items-center space-x-3 p-2 hover:bg-white rounded">
                        <RadioGroupItem value="invalide" id="conjstat4" />
                        <Label htmlFor="conjstat4" className="cursor-pointer">Pensionné en invalidité</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Checkbox
                      checked={formData.conjoint_biologiste}
                      onCheckedChange={(checked) => updateField('conjoint_biologiste', checked)}
                    />
                    <Label className="cursor-pointer">Affiliation biologiste</Label>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Checkbox
                      checked={formData.conjoint_pharmacien}
                      onCheckedChange={(checked) => updateField('conjoint_pharmacien', checked)}
                    />
                    <Label className="cursor-pointer">Affiliation pharmacien</Label>
                  </div>
                </div>
              </>
            )}

            {!showConjoint && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="text-green-600" />
                <AlertDescription className="text-green-800">
                  ✅ Aucune information conjoint nécessaire
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={currentSection === 'createur' ? onBack : () => setCurrentSection('createur')}
          size="lg"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {currentSection === 'createur' ? 'Retour' : 'Section précédente'}
        </Button>
        <Button 
          onClick={handleNext} 
          className="bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          {currentSection === 'createur' ? (
            <>
              Section suivante <ArrowRight className="ml-2 h-4 w-4" />
            </>
          ) : (
            <>
              Valider le formulaire <CheckCircle2 className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}