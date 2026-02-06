"use client";
import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Shield, Save, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function CommercialSettingsPage() {
  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, msg: string }>({ type: null, msg: "" });
  
  // Form States
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: ""
  });
  
  const [passwords, setPasswords] = useState({
    new: "",
    confirm: ""
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from("users")
            .select("*")
            .eq("authId", session.user.id)
            .single();

          if (profile) {
            setFormData({
              name: profile.name || "",
              email: profile.email || session.user.email || "",
              phone: profile.phone || "",
              role: profile.role || ""
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

  const showStatus = (type: 'success' | 'error', msg: string) => {
    setStatus({ type, msg });
    setTimeout(() => setStatus({ type: null, msg: "" }), 4000);
  };

  async function saveProfil() {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { error } = await supabase
        .from("users")
        .update({ 
          name: formData.name, 
          phone: formData.phone, 
          updatedAt: new Date().toISOString() 
        })
        .eq("authId", session.user.id);
      
      if (error) showStatus('error', "Erreur lors de la sauvegarde");
      else showStatus('success', "Profil mis à jour avec succès");
    }
    setSaving(false);
  }

  async function changePassword() {
    if (!passwords.new || passwords.new !== passwords.confirm) {
      return showStatus('error', "Les mots de passe ne correspondent pas");
    }
    if (passwords.new.length < 8) {
      return showStatus('error', "8 caractères minimum requis");
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.new });
    
    if (error) {
      showStatus('error', error.message);
    } else {
      showStatus('success', "Mot de passe modifié");
      setPasswords({ new: "", confirm: "" });
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="animate-spin text-orange-500" size={40} />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Chargement du profil...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 uppercase italic">Paramètres</h1>
        <p className="text-gray-500 font-medium">Gérez vos accès et vos informations personnelles</p>
      </div>

      {/* Notification Toast */}
      {status.type && (
        <div className={`flex items-center gap-3 p-4 rounded-2xl border animate-in slide-in-from-top-4 duration-300 ${
          status.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-red-50 border-red-100 text-red-800"
        }`}>
          {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <p className="text-sm font-bold">{status.msg}</p>
        </div>
      )}

      <div className="grid gap-6">
        {/* Profile Card */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100">
            <CardTitle className="text-sm font-black uppercase italic flex items-center gap-2">
              <User size={18} className="text-orange-500" /> Informations Personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Nom complet</label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="rounded-xl border-gray-100 focus:ring-orange-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email (Lecture seule)</label>
                <Input value={formData.email} disabled className="rounded-xl bg-gray-50 border-gray-100 text-gray-400" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Téléphone</label>
                <Input 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="06 00 00 00 00"
                  className="rounded-xl border-gray-100 focus:ring-orange-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Rôle</label>
                <div className="px-4 py-2 bg-orange-50 text-orange-700 rounded-xl text-xs font-black uppercase italic inline-block w-fit">
                  {formData.role || "Commercial"}
                </div>
              </div>
            </div>
            <Button 
              className="mt-8 bg-gray-900 hover:bg-black text-white rounded-xl px-8 font-bold" 
              onClick={saveProfil} 
              disabled={saving}
            >
              {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
              Mettre à jour le profil
            </Button>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100">
            <CardTitle className="text-sm font-black uppercase italic flex items-center gap-2">
              <Shield size={18} className="text-emerald-500" /> Sécurité du compte
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="max-w-md space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Nouveau mot de passe</label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    value={passwords.new} 
                    onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                    className="rounded-xl border-gray-100 pr-10"
                    placeholder="••••••••"
                  />
                  <button 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Confirmer le mot de passe</label>
                <Input 
                  type={showPassword ? "text" : "password"} 
                  value={passwords.confirm} 
                  onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                  className="rounded-xl border-gray-100"
                  placeholder="••••••••"
                />
              </div>
              <Button 
                variant="outline" 
                className="mt-2 rounded-xl font-bold border-gray-200" 
                onClick={changePassword} 
                disabled={saving}
              >
                Changer le mot de passe
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}