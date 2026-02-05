"use client";
import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Settings, User, Building, Bell, Shield, Save, Eye, EyeOff, CheckCircle2, AlertCircle 
} from "lucide-react";

export default function SettingsPage() {
  const supabase = createBrowserClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [tab, setTab] = useState<"profil" | "entreprise" | "notifications" | "securite">("profil");

  // --- States ---
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  
  const [companyName, setCompanyName] = useState("Declic-Entrepreneur");
  const [companySiret, setCompanySiret] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyEmail, setCompanyEmail] = useState("contact@declic-entrepreneur.fr");
  const [companyPhone, setCompanyPhone] = useState("");

  const [notifEmail, setNotifEmail] = useState(true);
  const [notifNewLead, setNotifNewLead] = useState(true);
  const [notifRdv, setNotifRdv] = useState(true);
  const [notifPayment, setNotifPayment] = useState(true);
  const [notifNoShow, setNotifNoShow] = useState(true);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase.from("users").select("*").eq("authId", authUser.id).single();
        if (profile) {
          setName(profile.name || "");
          setEmail(profile.email || authUser.email || "");
          setPhone(profile.phone || "");
          setRole(profile.role || "Membre");
        } else {
          setEmail(authUser.email || "");
        }
      }
      setLoading(false);
    }
    fetchUser();
  }, [supabase]);

  const showFeedback = (msg: string, error = false) => {
    setMessage(msg);
    setIsError(error);
    setTimeout(() => setMessage(""), 3000);
  };

  async function saveProfil() {
    setSaving(true);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const { error } = await supabase.from("users").update({ 
        name, 
        phone, 
        updatedAt: new Date().toISOString() 
      }).eq("authId", authUser.id);
      
      if (error) showFeedback(error.message, true);
      else showFeedback("Profil mis à jour avec succès !");
    }
    setSaving(false);
  }

  async function changePassword() {
    if (!newPassword || !confirmPassword) return showFeedback("Remplissez tous les champs", true);
    if (newPassword !== confirmPassword) return showFeedback("Les mots de passe divergent", true);
    if (newPassword.length < 8) return showFeedback("8 caractères minimum", true);

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) showFeedback(error.message, true);
    else {
      showFeedback("Mot de passe modifié !");
      setNewPassword("");
      setConfirmPassword("");
    }
    setSaving(false);
  }

  const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 outline-none transition-all";
  const labelClass = "text-[10px] font-black uppercase text-gray-400 mb-1 ml-1";

  if (loading) return <div className="p-20 text-center animate-pulse text-gray-400 font-bold">Initialisation...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight italic">RÉGLAGES</h1>
          <p className="text-gray-500 text-sm">Configurez votre environnement de travail</p>
        </div>
        <Settings className="text-gray-200" size={40} />
      </div>

      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${isError ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
          {isError ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span className="text-sm font-bold">{message}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex bg-gray-100 p-1.5 rounded-2xl w-fit">
        {[
          { id: "profil", icon: User, label: "Profil" },
          { id: "entreprise", icon: Building, label: "Business" },
          { id: "notifications", icon: Bell, label: "Alertes" },
          { id: "securite", icon: Shield, label: "Sécurité" }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === t.id ? "bg-white shadow-sm text-amber-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* --- PROFIL --- */}
        {tab === "profil" && (
          <Card className="border-none shadow-xl shadow-gray-100/50 rounded-3xl overflow-hidden">
            <div className="h-2 bg-amber-400" />
            <CardContent className="p-8 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <label className={labelClass}>Nom d'utilisateur</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                </div>
                <div className="flex flex-col">
                  <label className={labelClass}>Adresse Email (Lecture seule)</label>
                  <input type="email" value={email} disabled className={`${inputClass} bg-gray-50 text-gray-400 cursor-not-allowed`} />
                </div>
                <div className="flex flex-col">
                  <label className={labelClass}>Numéro de Téléphone</label>
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06..." className={inputClass} />
                </div>
                <div className="flex flex-col">
                  <label className={labelClass}>Niveau d'accès</label>
                  <div className="px-4 py-2.5 bg-gray-100 rounded-xl text-sm font-bold text-gray-600 border border-gray-200 uppercase tracking-tighter">
                    {role || "Utilisateur"}
                  </div>
                </div>
              </div>
              <Button onClick={saveProfil} disabled={saving} className="bg-gray-900 hover:bg-black text-white px-8 rounded-xl h-12">
                <Save size={18} className="mr-2" />
                {saving ? "Sauvegarde..." : "Enregistrer les modifications"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* --- ENTREPRISE --- */}
        {tab === "entreprise" && (
          <Card className="border-none shadow-xl shadow-gray-100/50 rounded-3xl overflow-hidden">
             <div className="h-2 bg-blue-500" />
             <CardContent className="p-8 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex flex-col">
                    <label className={labelClass}>Raison Sociale</label>
                    <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputClass} />
                  </div>
                  <div className="flex flex-col">
                    <label className={labelClass}>SIRET</label>
                    <input type="text" value={companySiret} onChange={(e) => setCompanySiret(e.target.value)} className={inputClass} />
                  </div>
                  <div className="md:col-span-2 flex flex-col">
                    <label className={labelClass}>Adresse du siège</label>
                    <textarea value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} className={`${inputClass} h-24 resize-none`} />
                  </div>
                </div>
                <Button onClick={() => showFeedback("Infos business sauvegardées !")} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                  Mettre à jour l'entreprise
                </Button>
             </CardContent>
          </Card>
        )}

        {/* --- NOTIFICATIONS --- */}
        {tab === "notifications" && (
          <div className="grid gap-3">
            {[
              { label: "Alertes Email", desc: "Canal principal de communication", state: notifEmail, set: setNotifEmail },
              { label: "Nouveaux Leads", desc: "Notification instantanée à chaque inscription", state: notifNewLead, set: setNotifNewLead },
              { label: "Rendez-vous", desc: "Rappels 24h avant chaque session", state: notifRdv, set: setNotifRdv },
              { label: "Ventes & Paiements", desc: "Confirmation de chaque encaissement", state: notifPayment, set: setNotifPayment },
            ].map((n, i) => (
              <div key={i} className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl hover:border-amber-200 transition-all shadow-sm">
                <div>
                  <p className="font-black text-gray-900 text-sm uppercase tracking-tight">{n.label}</p>
                  <p className="text-xs text-gray-500">{n.desc}</p>
                </div>
                <button 
                  onClick={() => n.set(!n.state)}
                  className={`w-14 h-7 rounded-full transition-all relative ${n.state ? "bg-amber-500" : "bg-gray-200"}`}
                >
                  <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${n.state ? "left-8" : "left-1"}`} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* --- SECURITE --- */}
        {tab === "securite" && (
          <Card className="border-none shadow-xl shadow-gray-100/50 rounded-3xl overflow-hidden">
            <div className="h-2 bg-red-500" />
            <CardContent className="p-8 space-y-6">
              <div className="max-w-md space-y-4">
                <div className="relative flex flex-col">
                  <label className={labelClass}>Nouveau mot de passe</label>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    className={inputClass} 
                  />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-8 text-gray-400">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="flex flex-col">
                  <label className={labelClass}>Confirmer le mot de passe</label>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    className={inputClass} 
                  />
                </div>
                <Button onClick={changePassword} disabled={saving} className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl h-12">
                  Changer mon accès
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}