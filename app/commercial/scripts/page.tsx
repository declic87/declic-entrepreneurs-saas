"use client";
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Phone, Target, XCircle, Calendar, CheckCircle, 
  ChevronDown, ChevronUp, Copy, BookOpen, Search 
} from "lucide-react";

const SCRIPTS = [
  {
    id: "1", title: "Appel découverte", role: "Setter", icon: Phone, color: "bg-blue-100 text-blue-700",
    content: `INTRODUCTION\n"Bonjour [Prénom], c'est [Votre prénom] de Déclic Entrepreneurs. Je vous appelle suite à votre demande de diagnostic fiscal gratuit. Vous avez 5 minutes ?"\n\nACCROCHE\n"J'ai vu que vous êtes en micro-entreprise avec un CA de [montant]. Savez-vous combien vous payez réellement en charges et impôts chaque année ?"\n\nQUALIFICATION\n- Quel est votre CA annuel ?\n- Depuis combien de temps êtes-vous en micro ?\n- Avez-vous des frais professionnels importants (véhicule, bureau, matériel) ?\n- Êtes-vous seul ou avez-vous des salariés ?\n- Quel est votre objectif principal : payer moins d'impôts, protéger votre patrimoine, ou les deux ?\n\nENGAGEMENT\n"D'après ce que vous me dites, il y a clairement des économies possibles. Je vous propose un RDV de 30 min avec notre expert pour analyser votre situation en détail. Quel créneau vous arrange ?"`,
  },
  {
    id: "2", title: "Closing", role: "Closer", icon: Target, color: "bg-emerald-100 text-emerald-700",
    content: `INTRODUCTION\n"Bonjour [Prénom], c'est [Votre prénom] de Déclic Entrepreneurs. On avait convenu de ce RDV pour parler de votre optimisation fiscale. Vous êtes bien installé ?"\n\nRAPPEL SITUATION\n"Si je résume : vous êtes en micro avec [CA] de CA, vous payez environ [montant] en charges URSSAF et [montant] d'IR. C'est bien ça ?"\n\nPRESENTATION RESULTATS\n"J'ai fait tourner les simulations. En passant en [SASU/EURL], vous pourriez économiser [montant] par an. Ça représente [montant] par mois de plus dans votre poche."\n\nOBJECTIONS\n- "C'est trop compliqué" → "On s'occupe de tout, vous n'avez rien à faire"\n- "C'est cher" → "L'accompagnement coûte [X] mais vous économisez [Y], le ROI est de [Z] mois"\n- "J'ai mon comptable" → "Votre comptable fait la compta, nous on optimise la structure. Les deux sont complémentaires"\n\nCLOSING\n"Pour démarrer, il me faut simplement votre avis d'imposition et une pièce d'identité. On peut faire ça maintenant ?"`,
  },
  {
    id: "3", title: "Relance no-show", role: "Setter", icon: XCircle, color: "bg-red-100 text-red-700",
    content: `MESSAGE 1 (J+0, 1h après le RDV)\n"Bonjour [Prénom], j'avais un RDV prévu avec vous aujourd'hui à [heure]. J'espère que tout va bien. Souhaitez-vous qu'on reprogramme ? Je suis disponible [créneaux]."\n\nMESSAGE 2 (J+1)\n"Bonjour [Prénom], je me permets de revenir vers vous. Votre diagnostic fiscal est prêt et montre des économies significatives possibles. Quel créneau vous conviendrait cette semaine ?"\n\nMESSAGE 3 (J+3)\n"[Prénom], dernière tentative de ma part. Si le timing n'est pas bon, je comprends. Sachez que votre simulation reste disponible. N'hésitez pas à me recontacter quand vous serez prêt."`,
  },
  {
    id: "4", title: "Confirmation RDV", role: "Setter", icon: Calendar, color: "bg-amber-100 text-amber-700",
    content: `SMS / EMAIL (J-1)\n"Bonjour [Prénom], petit rappel de notre RDV demain [date] à [heure]. Le lien de connexion : [lien]. À demain !"\n\nSMS (J, 30min avant)\n"[Prénom], on se retrouve dans 30 min pour votre diagnostic fiscal. Lien : [lien]. À tout de suite !"`,
  },
  {
    id: "5", title: "Post-closing", role: "Closer", icon: CheckCircle, color: "bg-purple-100 text-purple-700",
    content: `EMAIL DE BIENVENUE\nObjet: Bienvenue chez Déclic Entrepreneurs [Prénom] !\n\n"Félicitations [Prénom] pour cette décision !\n\nVoici les prochaines étapes :\n1. Vous allez recevoir un email de notre expert-comptable partenaire\n2. Votre expert fiscal [Nom] va vous contacter sous 48h\n3. Premier RDV d'audit dans les 2 semaines\n\nEn attendant, préparez :\n- Votre dernier avis d'imposition\n- Vos 3 derniers relevés URSSAF\n- Un RIB professionnel\n\nOn est là pour vous. Bienvenue dans la famille Déclic !"`,
  },
];

export default function ScriptsPage() {
  const [filterRole, setFilterRole] = useState("ALL");
  const [openId, setOpenId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = SCRIPTS.filter((s) => filterRole === "ALL" || s.role === filterRole);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase italic">Script Book</h1>
          <p className="text-gray-500 font-medium">Les process de vente validés</p>
        </div>
        <BookOpen className="text-orange-500 mb-2" size={32} />
      </div>

      {/* Filters */}
      <div className="flex bg-gray-100 p-1.5 rounded-2xl w-fit">
        {["ALL", "Setter", "Closer"].map((r) => (
          <button
            key={r}
            onClick={() => setFilterRole(r)}
            className={`
              px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all
              ${filterRole === r ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"}
            `}
          >
            {r === "ALL" ? "Tous" : r}
          </button>
        ))}
      </div>

      {/* Scripts List */}
      <div className="grid gap-3">
        {filtered.map((s) => {
          const Icon = s.icon;
          const isOpen = openId === s.id;
          
          return (
            <Card key={s.id} className="border-none shadow-sm overflow-hidden transition-all duration-300">
              <CardContent className="p-0">
                <button 
                  onClick={() => setOpenId(isOpen ? null : s.id)} 
                  className={`w-full flex items-center justify-between p-5 text-left transition-colors ${isOpen ? "bg-gray-50" : "hover:bg-gray-50/50"}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform ${isOpen ? "scale-110" : ""} ${s.color}`}>
                      <Icon size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="font-black text-gray-900 uppercase italic tracking-tight">{s.title}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className={`h-6 w-6 rounded-full flex items-center justify-center border-2 border-gray-100 ${isOpen ? "rotate-180" : ""} transition-all duration-300`}>
                        <ChevronDown size={14} className="text-gray-400" />
                     </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-6 bg-gray-50 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-between items-center py-4">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Contenu du script</span>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => copyToClipboard(s.content, s.id)}
                        className={`h-8 text-[10px] font-black uppercase tracking-tighter transition-all ${copiedId === s.id ? "bg-emerald-500 text-white border-emerald-500" : "bg-white"}`}
                      >
                        {copiedId === s.id ? (
                          <><CheckCircle size={12} className="mr-1.5"/> Copié !</>
                        ) : (
                          <><Copy size={12} className="mr-1.5"/> Copier</>
                        )}
                      </Button>
                    </div>
                    
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-inner">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-medium leading-relaxed font-sans">
                        {s.content.split('\n').map((line, i) => (
                          <span key={i} className={line.toUpperCase() === line && line.length > 3 ? "text-orange-600 font-black block mt-4 first:mt-0 mb-1 tracking-tight" : "block"}>
                            {line}
                          </span>
                        ))}
                      </pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Aucun script dans cette catégorie</p>
        </div>
      )}
    </div>
  );
}