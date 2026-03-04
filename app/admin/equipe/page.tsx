"use client";
import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Trash2, Mail, Phone, Calendar, ChevronDown } from "lucide-react";

interface Member { 
  id: string; 
  name: string; 
  email: string; 
  phone: string; 
  role: string; 
  status: string;
  leadsCount: number; 
  closesCount: number; 
  perdusCount: number; 
  showUps: number; 
  noShows: number; 
}

const ROLE_COLORS: Record<string, string> = { 
  ADMIN: "bg-orange-100 text-orange-700", 
  HOS: "bg-indigo-100 text-indigo-700", 
  CLOSER: "bg-purple-100 text-purple-700", 
  SETTER: "bg-cyan-100 text-cyan-700", 
  EXPERT: "bg-emerald-100 text-emerald-700" 
};

const ROLE_OPTIONS = [ 
  { value: "CLOSER", label: "Closer" }, 
  { value: "SETTER", label: "Setter" }, 
  { value: "HOS", label: "Head of Sales" }, 
  { value: "EXPERT", label: "Expert" }, 
  { value: "ADMIN", label: "Admin" } 
];

export default function EquipePage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState("ALL");
  const [period, setPeriod] = useState<"ALL" | "MONTH">("MONTH");
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRole, setFormRole] = useState("CLOSER");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [sendingInvite, setSendingInvite] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
  }, [period]);

  async function fetchMembers() {
    setLoading(true);
    const { data: users } = await supabase
      .from("users")
      .select("*, status")
      .in("role", ["ADMIN", "HOS", "CLOSER", "SETTER", "EXPERT"])
      .neq("is_active", false)
      .order("first_name");
    
    if (!users) { 
      setLoading(false); 
      return; 
    }

    let leadsQuery = supabase
      .from("leads")
      .select("id, closerId, setterId, status, showUp, createdAt");
    
    if (period === "MONTH") {
      const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      leadsQuery = leadsQuery.gte("createdAt", firstDay);
    }

    const { data: leads } = await leadsQuery;

    const enriched = users.map((u) => {
      const asCloser = (leads || []).filter((l) => l.closerId === u.id);
      const asSetter = (leads || []).filter((l) => l.setterId === u.id);
      return {
        id: u.id,
        name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
        email: u.email || "",
        phone: u.phone || "",
        role: u.role,
        status: u.status || 'active',
        leadsCount: asCloser.length + asSetter.length,
        closesCount: asCloser.filter((l) => l.status === "CLOSE").length,
        perdusCount: asCloser.filter((l) => l.status === "PERDU").length,
        showUps: asSetter.filter((l) => l.showUp === true).length,
        noShows: asSetter.filter((l) => l.showUp === false).length,
      };
    });

    setMembers(enriched);
    setLoading(false);
  }

  async function addMember() {
    if (!formName.trim() || !formEmail.trim()) { 
      setMessage("Nom et email requis"); 
      setTimeout(() => setMessage(""), 2000); 
      return; 
    }
    setSaving(true);
    const newId = "usr_" + Date.now();
    const { error } = await supabase
      .from("users")
      .insert({ 
        id: newId, 
        first_name: formName.trim().split(' ')[0],
        last_name: formName.trim().split(' ').slice(1).join(' ') || '',
        email: formEmail.trim(), 
        phone: formPhone.trim(), 
        role: formRole,
        status: 'pending'
      });
    
    if (error) { 
      setMessage("Erreur: " + error.message); 
    } else { 
      setMessage("Membre ajouté avec succès"); 
      setFormName(""); 
      setFormEmail(""); 
      setFormPhone(""); 
      setFormRole("CLOSER"); 
      setShowForm(false); 
      await fetchMembers(); 
    }
    setSaving(false);
    setTimeout(() => setMessage(""), 3000);
  }

  async function removeMember(id: string) {
    const { error } = await supabase
      .from("users")
      .update({ is_active: false })
      .eq("id", id);
    
    if (error) { 
      setMessage("Erreur: " + error.message); 
    } else { 
      setMembers(members.filter((m) => m.id !== id)); 
      setMessage("Membre désactivé"); 
    }
    setConfirmDelete(null);
    setTimeout(() => setMessage(""), 3000);
  }

  async function resendInvitation(email: string, memberId: string) {
    setSendingInvite(memberId);
    
    try {
      const response = await fetch('/api/staff/resend-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const result = await response.json();
      
      if (result.error) {
        setMessage('❌ ' + result.error);
      } else {
        setMessage('✅ Invitation renvoyée avec succès !');
      }
    } catch (error: any) {
      setMessage('❌ Erreur : ' + error.message);
    } finally {
      setSendingInvite(null);
      setTimeout(() => setMessage(""), 3000);
    }
  }

  const filtered = filterRole === "ALL" ? members : members.filter((m) => m.role === filterRole);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Équipe</h1>
          <p className="text-gray-500 mt-1">{members.length} membres actifs</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 p-1 rounded-lg mr-2">
            <button 
              onClick={() => setPeriod("MONTH")} 
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                period === "MONTH" 
                  ? "bg-white shadow-sm text-orange-600" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Mois en cours
            </button>
            <button 
              onClick={() => setPeriod("ALL")} 
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                period === "ALL" 
                  ? "bg-white shadow-sm text-orange-600" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Global
            </button>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <UserPlus size={16} className="mr-2" />
            {showForm ? "Annuler" : "Ajouter un membre"}
          </Button>
        </div>
      </div>

      {message && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          {message}
        </div>
      )}

      {showForm && (
        <Card className="border-orange-200 bg-orange-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <CardContent className="p-6">
            <h2 className="font-bold text-gray-900 mb-4">Nouveau membre</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Nom complet *</p>
                <input 
                  type="text" 
                  value={formName} 
                  onChange={(e) => setFormName(e.target.value)} 
                  placeholder="Jean Dupont" 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-500" 
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Email *</p>
                <input 
                  type="email" 
                  value={formEmail} 
                  onChange={(e) => setFormEmail(e.target.value)} 
                  placeholder="jean@declic.fr" 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-500" 
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Téléphone</p>
                <input 
                  type="text" 
                  value={formPhone} 
                  onChange={(e) => setFormPhone(e.target.value)} 
                  placeholder="06 12 34 56 78" 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-500" 
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Rôle *</p>
                <select 
                  value={formRole} 
                  onChange={(e) => setFormRole(e.target.value)} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={addMember} disabled={saving}>
                {saving ? "Ajout..." : "Ajouter"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2">
        {["ALL", "CLOSER", "SETTER", "HOS", "EXPERT", "ADMIN"].map((role) => (
          <Button 
            key={role} 
            variant={filterRole === role ? "default" : "outline"} 
            size="sm" 
            onClick={() => setFilterRole(role)}
          >
            {role === "ALL" ? "Tous" : role}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((m) => {
            const convRate = m.leadsCount > 0 ? Math.round((m.closesCount / m.leadsCount) * 100) : 0;
            const showRate = (m.showUps + m.noShows) > 0 ? Math.round((m.showUps / (m.showUps + m.noShows)) * 100) : 0;
            
            return (
              <Card key={m.id} className="hover:shadow-md transition-shadow relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-sm">
                        {m.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{m.name}</p>
                        <div className="flex items-center gap-2">
                          <span className={"px-2 py-0.5 text-[10px] font-bold uppercase rounded " + (ROLE_COLORS[m.role] || "bg-gray-100 text-gray-600")}>
                            {m.role}
                          </span>
                          {m.status === 'pending' && (
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-orange-100 text-orange-700">
                              En attente
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {confirmDelete === m.id ? (
                      <div className="flex gap-1 animate-in zoom-in-95 duration-200">
                        <button 
                          onClick={() => removeMember(m.id)} 
                          className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold"
                        >
                          Confirmer
                        </button>
                        <button 
                          onClick={() => setConfirmDelete(null)} 
                          className="text-gray-500 px-2 py-1 rounded text-xs"
                        >
                          Non
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setConfirmDelete(m.id)} 
                        className="text-gray-300 hover:text-red-500"
                      >
                        <Trash2 size={16}/>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Mail size={12}/> {m.email}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Phone size={12}/> {m.phone || "N/A"}
                    </div>
                  </div>

                  {m.status === 'pending' && (
                    <button
                      onClick={() => resendInvitation(m.email, m.id)}
                      disabled={sendingInvite === m.id}
                      className="w-full mb-3 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm font-medium transition-all disabled:opacity-50"
                    >
                      {sendingInvite === m.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Envoi...
                        </>
                      ) : (
                        <>
                          <Mail size={14} />
                          Renvoyer l'invitation
                        </>
                      )}
                    </button>
                  )}

                  {(m.role === "CLOSER" || m.role === "HOS") && (
                    <div className="space-y-2 pt-3 border-t">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-gray-500">Conversion: {m.closesCount}/{m.leadsCount}</span>
                        <span className="text-emerald-600">{convRate}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                          style={{ width: `${convRate}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {m.role === "SETTER" && (
                    <div className="space-y-2 pt-3 border-t">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-gray-500">Show-up: {m.showUps}/{m.showUps + m.noShows}</span>
                        <span className="text-cyan-600">{showRate}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full">
                        <div 
                          className="h-full bg-cyan-500 rounded-full transition-all duration-500" 
                          style={{ width: `${showRate}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}