import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FormationsIndex() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold text-[#123055]">Formations</h1>

      <div className="mt-8 grid md:grid-cols-2 gap-6">
        {/* Créateur */}
        <div className="rounded-2xl border border-slate-200 p-6 bg-white">
          <h2 className="text-xl font-semibold text-[#123055]">Formation Créateur</h2>
          <p className="text-slate-600 mt-2">
            Statut, fiscalité, méthode VASE, création de société pas à pas.
          </p>
          <div className="mt-4 flex gap-3">
            <Link href="/formations/createur">
              <Button className="bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-xl">En savoir plus</Button>
            </Link>
            <a
              href="https://buy.stripe.com/aFafZg2Dt3sy06x5j19fW03"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="rounded-xl">Acheter — 497€</Button>
            </a>
          </div>
        </div>

        {/* Agent Immobilier */}
        <div className="rounded-2xl border border-slate-200 p-6 bg-white">
          <h2 className="text-xl font-semibold text-[#123055]">Formation Agent Immobilier</h2>
          <p className="text-slate-600 mt-2">
            Spécificités mandataires, IK, cas pratiques, holdings, SCI.
          </p>
          <div className="mt-4 flex gap-3">
            <Link href="/formations/agent-immobilier">
              <Button className="bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-xl">En savoir plus</Button>
            </Link>
            <a
              href="https://buy.stripe.com/4gM3cu5PFd382eF5j19fW02"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="rounded-xl">Acheter — 897€</Button>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
``