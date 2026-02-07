export default function AppHome() {
    return (
      <main className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-extrabold text-[#123055]">Mon Espace</h1>
        <p className="mt-3 text-slate-600">
          Votre espace client arrive. Authentification, accès Formations et facturation seront activés ici.
        </p>
  
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <a href="/login" className="block rounded-xl border border-slate-200 bg-white p-6 hover:shadow-sm">
            <p className="font-semibold text-[#123055]">Se connecter</p>
            <p className="text-sm text-slate-500 mt-1">Accédez à votre espace sécurisé</p>
          </a>
          <a href="/formations" className="block rounded-xl border border-slate-200 bg-white p-6 hover:shadow-sm">
            <p className="font-semibold text-[#123055]">Voir les Formations</p>
            <p className="text-sm text-slate-500 mt-1">Accès immédiat après paiement</p>
          </a>
        </div>
  
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">
            Prochaines étapes : Auth Supabase → Webhook Stripe → Accès Formations (Créateur / Agent Immo).
          </p>
        </div>
      </main>
    );
  }