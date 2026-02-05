"use client";

import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Shield, Save, Eye, EyeOff, Briefcase, CheckCircle2, AlertCircle } from "lucide-react";

export default function ExpertSettingsPage() {
  const supabase = createBrowserClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Form states
  const [profileData, setProfileData] = useState({ name: "", email: "", phone: "", role: "" });
  const [expertData, setExpertData] = useState({ id: "", specialty: "", bio: "", calendly_url: "" });
  const [passwordData, setPasswordData] = useState({ new: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("authId", session.user.id)
          .single();

        if (profile) {
          setProfileData({
            name: profile.name || "",
            email: profile.email || session.user.email || "",
            phone: profile.phone || "",
            role: profile.role || ""
          });

          const { data: expert } = await supabase
            .from("experts")
            .select("*")
            .eq("user_id", profile.id)
            .single();

          if (expert) {
            setExpertData({
              id: expert.id,
              specialty: expert.specialty || "",
              bio: expert.bio || "",
              calendly_url: expert.calendly_url || ""
            });
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [supabase]);

  const showAlert = (type: "success" | "error", msg: string) => {
    setStatus({ type, msg });
    setTimeout(() => setStatus(null), 3000);
  };

  async function saveProfil() {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Update User table
      const { error: userErr } = await supabase
        .from("users")
        .update({ name: profileData.name, phone: profileData.phone })
        .eq("authId", session.user.id);

      // Update Expert table
      if (expertData.id) {
        const { error: expErr } = await supabase
          .from("experts")
          .update({
            specialty: expertData.specialty,
            bio: expertData.bio,
            calendly_url: expertData.calendly_url
          })
          .eq("id", expertData.id);
        
        if (userErr || expErr) throw new Error("Erreur de mise à jour");
      }
      showAlert("success", "Profil mis à jour avec succès");
    } catch (e) {
      showAlert("error", "Une erreur est survenue");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    if (passwordData.new !== passwordData.confirm) {
      return showAlert("error", "Les mots de passe ne correspondent pas");
    }
    if (passwordData.new.length < 8) {
      return showAlert("error", "8 caractères minimum");
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: passwordData.new });
    
    if (error) {
      showAlert("error", error.message);
    } else {
      showAlert("success", "Mot de passe modifié");
      setPasswordData({ new: "", confirm: "" });
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Paramètres</h1>
          <p className="text-gray-500 mt-1">Gérez votre identité et vos outils de consultation</p>
        </div>
        {status && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium animate-in fade-in slide-in-from-top-4 ${
            status.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"
          }`}>
            {status.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {status.msg}
          </div>
        )}
      </div>

      <div className="grid gap-8">
        {/* SECTION 1: INFOS PERSONNELLES */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100">
            <CardTitle className="text-lg flex items-center gap-2">
              <User size={18} className="text-orange-600" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-400">Nom complet</label>
              <input 
                type="text" 
                value={profileData.name} 
                onChange={(e) => setProfileData({...profileData, name: e.target.value})} 
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-400">Email (Lecture seule)</label>
              <input type="email" value={profileData.email} disabled className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-gray-500 cursor-not-allowed" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-400">Téléphone</label>
              <input 
                type="text" 
                value={profileData.phone} 
                onChange={(e) => setProfileData({...profileData, phone: e.target.value})} 
                placeholder="06..." 
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-400">Rôle</label>
              <div className="px-4 py-2.5 bg-orange-50 text-orange-700 font-bold rounded-xl text-sm inline-block">
                {profileData.role}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: PROFIL EXPERT */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100">
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase size={18} className="text-orange-600" />
              Profil Public & Outils
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-400">Spécialité</label>
                <input 
                  type="text" 
                  value={expertData.specialty} 
                  onChange={(e) => setExpertData({...expertData, specialty: e.target.value})} 
                  placeholder="ex: Fiscalité immobilière" 
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-400">Lien Calendly</label>
                <input 
                  type="text" 
                  value={expertData.calendly_url} 
                  onChange={(e) => setExpertData({...expertData, calendly_url: e.target.value})} 
                  placeholder="https://calendly.com/votre-nom" 
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-400">Biographie courte</label>
              <textarea 
                value={expertData.bio} 
                onChange={(e) => setExpertData({...expertData, bio: e.target.value})} 
                rows={4} 
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none resize-none" 
              />
            </div>
            <div className="flex justify-end border-t pt-4">
              <Button onClick={saveProfil} disabled={saving} className="bg-orange-600 hover:bg-orange-700 text-white px-8 rounded-xl h-11">
                <Save size={16} className="mr-2" />
                {saving ? "Enregistrement..." : "Sauvegarder les modifications"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3: SÉCURITÉ */}
        <Card className="border-none shadow-sm overflow-hidden border-l-4 border-l-red-500">
          <CardHeader className="bg-red-50/30 border-b border-gray-100">
            <CardTitle className="text-lg flex items-center gap-2 text-red-700">
              <Shield size={18} />
              Sécurité du compte
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2 relative">
                <label className="text-xs font-bold uppercase text-gray-400">Nouveau mot de passe</label>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={passwordData.new} 
                  onChange={(e) => setPasswordData({...passwordData, new: e.target.value})} 
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none pr-12" 
                />
                <button 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-4 top-9 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-400">Confirmation</label>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={passwordData.confirm} 
                  onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})} 
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none" 
                />
              </div>
            </div>
            <Button onClick={changePassword} variant="outline" disabled={saving} className="border-red-200 text-red-700 hover:bg-red-50 rounded-xl">
              Modifier le mot de passe
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}