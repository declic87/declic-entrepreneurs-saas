"use client";
import React, { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bell, Calendar, Save, Loader2, Mail, Phone, UserPlus } from "lucide-react";
import Link from "next/link";

export default function DetailProspectPage() {
  const supabase = createClientComponentClient();
  const params = useParams();
  const router = useRouter();
  
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    fetchLead();
  }, [params.id]);

  async function fetchLead() {
    const { data } = await supabase.from("leads").select("*").eq("id", params.id).single();
    if (data) {
      setLead(data);
      setNotes(data.notes || "");
    }
    setLoading(false);
  }

  async function updateReminder(days: number | null) {
    setSaving(true);
    let isoDate = null;
    if (days !== null) {
      const date = new Date();
      date.setDate(date.getDate() + days);
      isoDate = date.toISOString();
    }

    const { error } = await supabase
      .from("leads")
      .update({ next_reminder: isoDate, reminder_sent: false })
      .eq("id", params.id);

    if (!error) {
      setLead({ ...lead, next_reminder: isoDate });
      setFeedback("✅ Rappel mis à jour");
      setTimeout(() => setFeedback(""), 3000);
    }
    setSaving(false);
  }

  async function saveNotes() {
    setSaving(true);
    await supabase.from("leads").update({ notes }).eq("id", params.id);
    setFeedback("✅ Notes enregistrées");
    setSaving(false);
    setTimeout(() => setFeedback(""), 3000);
  }

  if (loading) return <div className="p-20 text-center italic">Chargement du prospect...</div>;

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <Link href="/admin/pipeline">
          <Button variant="ghost" className="text-slate-500"><ArrowLeft size={16} className="mr-2"/> Pipeline</Button>
        </Link>
        {feedback && <span className="text-emerald-600 font-bold animate-bounce text-sm">{feedback}</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h1 className="text-3xl font-black text-slate-900 mb-2">{lead.name}</h1>
            <div className="flex gap-4 text-slate-500 text-sm">
              <span className="flex items-center gap-1"><Mail size={14}/> {lead.email}</span>
              <span className="flex items-center gap-1"><Phone size={14}/> {lead.phone || 'Aucun numéro'}</span>
            </div>
          </div>

          <Card className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-slate-800">Notes de suivi</h2>
                <Button size="sm" onClick={saveNotes} disabled={saving}>
                  {saving ? <Loader2 className="animate-spin" size={14}/> : <Save size={14} className="mr-2"/>}
                  Sauvegarder
                </Button>
              </div>
              <textarea 
                className="w-full h-64 p-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-700"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Détails de l'appel, objections, besoins du client..."
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className={`border-t-4 ${lead.next_reminder && new Date(lead.next_reminder) < new Date() ? 'border-red-500 shadow-red-100' : 'border-blue-500 shadow-blue-100'}`}>
            <CardContent className="p-6">
              <h2 className="font-bold mb-4 flex items-center gap-2 text-slate-800">
                <Bell size={18} className="text-blue-500"/> Rappel de suivi
              </h2>
              
              {lead.next_reminder ? (
                <div className={`p-4 rounded-xl mb-6 text-center ${new Date(lead.next_reminder) < new Date() ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                  <p className="text-[10px] uppercase font-bold mb-1 opacity-70">Date prévue</p>
                  <p className="font-black text-lg">{new Date(lead.next_reminder).toLocaleDateString('fr-FR')}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center mb-6 italic text-balance px-4">Aucun rappel automatique programmé par email.</p>
              )}

              <div className="grid grid-cols-1 gap-2">
                <Button variant="outline" className="justify-start" onClick={() => updateReminder(1)}>Rappel demain</Button>
                <Button variant="outline" className="justify-start" onClick={() => updateReminder(3)}>Rappel dans 3j</Button>
                <Button variant="outline" className="justify-start" onClick={() => updateReminder(7)}>Rappel dans 1 semaine</Button>
                <Button variant="ghost" className="text-red-500 hover:bg-red-50 mt-4" onClick={() => updateReminder(null)}>Supprimer le rappel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}