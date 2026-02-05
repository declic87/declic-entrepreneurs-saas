"use client";

import Link from "next/link";
import { 
  Zap, 
  GraduationCap, 
  Calendar, 
  CreditCard, 
  Users, 
  Calculator, 
  FileText, 
  HelpCircle,
  Mail,
  MessageCircle,
  ArrowRight
} from "lucide-react";

export default function MonEspacePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="bg-[#1e3a5f] py-4 px-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
              <Zap className="text-white" size={22} fill="white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">Déclic-Entrepreneur</span>
          </Link>
          <Link href="/" className="text-white/80 hover:text-white flex items-center gap-2 text-sm font-medium">
            Retour au site
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-[#1e3a5f] text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-4 tracking-tight">Bienvenue dans votre espace client</h1>
          <p className="text-blue-100 text-lg max-w-2xl">
            Toutes vos ressources, formations et rendez-vous centralisés au même endroit.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-12 px-4">
        <h2 className="text-2xl font-bold text-[#1e3a5f] mb-8 flex items-center gap-2">
            <span className="w-2 h-8 bg-emerald-500 rounded-full"></span>
            Vos services prioritaires
        </h2>
        
        {/* Grille de services */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <ServiceCard 
            title="Mes Formations"
            desc="Accédez à votre cursus vidéo et suivez votre progression en temps réel."
            icon={<GraduationCap size={28} />}
            iconBg="bg-blue-600"
            link="https://www.systeme.io/"
            btnText="Accéder au portail"
            btnColor="bg-[#1e3a5f] hover:bg-blue-800"
          />
          <ServiceCard 
            title="Prendre RDV"
            desc="Réservez votre prochain créneau stratégique avec votre conseiller dédié."
            icon={<Calendar size={28} />}
            iconBg="bg-emerald-500"
            link="https://calendly.com/contact-jj-conseil"
            btnText="Ouvrir l'agenda"
            btnColor="bg-emerald-500 hover:bg-emerald-600"
          />
          <ServiceCard 
            title="Mon Abonnement"
            desc="Gérez vos informations de paiement, changez de plan ou téléchargez vos factures."
            icon={<CreditCard size={28} />}
            iconBg="bg-indigo-500"
            link="https://billing.stripe.com/p/login/test"
            btnText="Espace Billing"
            btnColor="bg-indigo-500 hover:bg-indigo-600"
          />
          <ServiceCard 
            title="Communauté"
            desc="Échangez avec les autres entrepreneurs du réseau et partagez vos succès."
            icon={<Users size={28} />}
            iconBg="bg-orange-500"
            link="https://www.systeme.io/"
            btnText="Rejoindre le groupe"
            btnColor="bg-orange-500 hover:bg-orange-600"
          />
        </div>

        {/* Section Ressources Secondaires */}
        <h2 className="text-2xl font-bold text-[#1e3a5f] mb-8 flex items-center gap-2">
            <span className="w-2 h-8 bg-blue-400 rounded-full"></span>
            Outils & Documents
        </h2>
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <ResourceLink icon={<Calculator />} title="Simulateurs" desc="Outils de calculs fiscaux" href="/simulateurs" />
          <ResourceLink icon={<FileText />} title="Templates" desc="Modèles de documents" href="https://drive.google.com" isExternal />
          <ResourceLink icon={<HelpCircle />} title="FAQ" desc="Aide et support" href="/#faq" />
        </div>

        {/* Bannière Support */}
        <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-xl shadow-blue-900/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6 text-center md:text-left">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 animate-pulse">
              <MessageCircle size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-[#1e3a5f]">Besoin d'un coup de main ?</h3>
              <p className="text-slate-500 text-lg">Notre équipe de support est là pour vous, du lundi au vendredi.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <a href="mailto:contact@declic-entrepreneur.fr" className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-100 text-[#1e3a5f] rounded-xl font-bold hover:bg-slate-200 transition-all shadow-sm">
              <Mail size={20} /> Email
            </a>
            <a href="https://wa.me/..." className="flex items-center justify-center gap-2 px-8 py-4 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-emerald-200 shadow-lg">
               WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sous-composants pour la lisibilité
function ServiceCard({ title, desc, icon, iconBg, link, btnText, btnColor }: any) {
  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all group">
      <div className="flex items-start gap-6">
        <div className={`w-16 h-16 rounded-2xl ${iconBg} text-white flex items-center justify-center flex-shrink-0 shadow-lg`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-[#1e3a5f] mb-2">{title}</h3>
          <p className="text-slate-500 mb-6 leading-relaxed">{desc}</p>
          <a href={link} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 ${btnColor} text-white px-6 py-3 rounded-xl transition-all font-semibold text-sm`}>
            {btnText} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </div>
  );
}

function ResourceLink({ icon, title, desc, href, isExternal = false }: any) {
    const Comp: any = isExternal ? 'a' : Link;
    return (
      <Comp href={href} className="bg-white p-6 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all flex items-center gap-4 group">
        <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center group-hover:bg-white group-hover:text-emerald-500 shadow-sm transition-colors">
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-[#1e3a5f]">{title}</h3>
          <p className="text-slate-400 text-sm">{desc}</p>
        </div>
      </Comp>
    );
}