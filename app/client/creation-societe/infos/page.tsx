"use client";

import React, { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowRight, Building } from "lucide-react";

export default function InfosSocietePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    company_name: "",
    capital_amount: "",
    activity_description: "",
    address_line1: "",
    address_line2: "",
    postal_code: "",
    city: "",
    president_first_name: "",
    president_last_name: "",
    president_birth_date: "",
    president_birth_place: "",
    president_nationality: "Française",
    president_address: "",
    bank_name: "",
    iban: "",
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (userId) {
      loadExistingData();
    }
  }, [userId]);

  async function fetchUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: userData } = await supabase
        .from("users")
        .select("id, first_name, last_name")
        .eq("auth_id", user.id)
        .single();
      
      if (userData) {
        setUserId(userData.id);
        // Pré-remplir avec les données utilisateur
        setFormData((prev) => ({
          ...prev,
          president_first_name: userData.first_name || "",
          president_last_name: userData.last_name || "",
        }));
      }
    }
    setLoading(false);
  }

  async function loadExistingData() {
    const { data } = await supabase
      .from("company_creation_data")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (data) {
      setFormData({
        company_name: data.company_name || "",
        capital_amount: data.capital_amount || "",
        activity_description: data.activity_description || "",
        address_line1: data.address_line1 || "",
        address_line2: data.address_line2 || "",
        postal_code: data.postal_code || "",
        city: data.city || "",
        president_first_name: data.president_first_name || formData.president_first_name,
        president_last_name: data.president_last_name || formData.president_last_name,
        president_birth_date: data.president_birth_date || "",
        president_birth_place: data.president_birth_place || "",
        president_nationality: data.president_nationality || "Française",
        president_address: data.president_address || "",
        bank_name: data.bank_name || "",
        iban: data.iban || "",
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from("company_creation_data")
        .update({
          ...formData,
          step: "documents_upload",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) throw error;

      router.push("/client/creation-societe");
    } catch (err) {
      console.error("Erreur:", err);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-amber-500" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#123055] flex items-center gap-2">
          <Building size={32} />
          Informations de votre société
        </h1>
        <p className="text-slate-600 mt-1">
          Remplissez les informations nécessaires pour générer vos documents
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations société */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              1️⃣ Société
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Nom de la société *
                </label>
                <input
                  type="text"
                  required
                  value={formData.company_name}
                  onChange={(e) =>
                    setFormData({ ...formData, company_name: e.target.value })
                  }
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="Ex: DÉCLIC ENTREPRENEURS"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Capital social (€) *
                </label>
                <input
                  type="number"
                  required
                  value={formData.capital_amount}
                  onChange={(e) =>
                    setFormData({ ...formData, capital_amount: e.target.value })
                  }
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="Ex: 1000"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description de l'activité *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.activity_description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      activity_description: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="Ex: Conseil en gestion et optimisation fiscale"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Adresse siège social */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              2️⃣ Adresse du siège social
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Adresse ligne 1 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address_line1}
                  onChange={(e) =>
                    setFormData({ ...formData, address_line1: e.target.value })
                  }
                  className="w-full px-4 py-3 border rounded-lg"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Adresse ligne 2
                </label>
                <input
                  type="text"
                  value={formData.address_line2}
                  onChange={(e) =>
                    setFormData({ ...formData, address_line2: e.target.value })
                  }
                  className="w-full px-4 py-3 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Code postal *
                </label>
                <input
                  type="text"
                  required
                  value={formData.postal_code}
                  onChange={(e) =>
                    setFormData({ ...formData, postal_code: e.target.value })
                  }
                  className="w-full px-4 py-3 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Ville *
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="w-full px-4 py-3 border rounded-lg"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Président */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              3️⃣ Président / Gérant
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  required
                  value={formData.president_first_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      president_first_name: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  required
                  value={formData.president_last_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      president_last_name: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Date de naissance *
                </label>
                <input
                  type="date"
                  required
                  value={formData.president_birth_date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      president_birth_date: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Lieu de naissance *
                </label>
                <input
                  type="text"
                  required
                  value={formData.president_birth_place}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      president_birth_place: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border rounded-lg"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Adresse personnelle *
                </label>
                <input
                  type="text"
                  required
                  value={formData.president_address}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      president_address: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border rounded-lg"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informations bancaires */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              4️⃣ Informations bancaires
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Nom de la banque *
                </label>
                <input
                  type="text"
                  required
                  value={formData.bank_name}
                  onChange={(e) =>
                    setFormData({ ...formData, bank_name: e.target.value })
                  }
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="Ex: Crédit Agricole"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  IBAN *
                </label>
                <input
                  type="text"
                  required
                  value={formData.iban}
                  onChange={(e) =>
                    setFormData({ ...formData, iban: e.target.value })
                  }
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="FR76..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            Retour
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="flex-1 bg-amber-500 hover:bg-amber-600"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin mr-2" size={16} />
                Sauvegarde...
              </>
            ) : (
              <>
                Enregistrer et continuer
                <ArrowRight className="ml-2" size={16} />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}