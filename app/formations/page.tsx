import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, Star, Zap, Shield, Trophy } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                                   SEO                                      */
/* -------------------------------------------------------------------------- */

export const metadata: Metadata = {
  title: "Formations • Optimisation fiscale & création de société | Déclic‑Entrepreneur",
  description:
    "Formations premium pour indépendants et agents immobiliers : choisissez le bon statut (SASU/EURL), appliquez la méthode VASE, maximisez vos IK, pilotez vos revenus et économisez 5 000€ à 20 000€ par an selon votre profil.",
  alternates: { canonical: "/formations" },
  openGraph: {
    title: "Formations • Optimisation fiscale & création de société | Déclic‑Entrepreneur",
    description:
      "Copywriting high‑ticket, ROI immédiat, méthode VASE, cas pratiques — achetez votre formation et accédez à vie.",
    url: "/formations",
    siteName: "Déclic‑Entrepreneur",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Formations • Optimisation fiscale & création de société | Déclic‑Entrepreneur",
    description:
      "Des formations premium pour gagner plus en payant moins d’impôts — accès instantané.",
  },
};

/* -------------------------------------------------------------------------- */
/*                                JSON‑LD (SEO)                               */
/* -------------------------------------------------------------------------- */

function JsonLd() {
  const json = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Combien puis‑je économiser avec ces formations ?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "Selon votre CA, vos frais et votre statut, les économies courantes vont d’environ 5 000€ à 20 000€ par an grâce à la déduction des frais réels, au pilotage salaire/dividendes et aux IK."
            }
          },
          {
            "@type": "Question",
            "name": "L’accès est‑il immédiat et à vie ?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "Oui. Après paiement, vous recevez un accès immédiat et permanent, avec mises à jour annuelles incluses."
            }
          },
          {
            "@type": "Question",
            "name": "SASU ou EURL : quelle structure choisir ?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "Cela dépend de votre rémunération cible, de vos charges et de vos projets (investissement, associés). La formation compare précisément les deux et fournit des cas pratiques."
            }
          },
          {
            "@type": "Question",
            "name": "Puis‑je payer en entreprise et déduire l’achat ?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "Oui, dès lors que l’achat est réalisé pour l’activité professionnelle et conforme aux règles fiscales en vigueur."
            }
          },
          {
            "@type": "Question",
            "name": "Et si je débute ?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "C’est le meilleur moment : vous évitez les mauvais choix de départ et sécurisez votre trajectoire fiscale dès la création."
            }
          }
        ]
      },
      {
        "@type": "Course",
        "name": "Formation Créateur",
        "description":
          "Statut, fiscalité appliquée, méthode VASE, création de société pas‑à‑pas — pour indépendants qui veulent gagner plus net.",
        "provider": { "@type": "Organization", "name": "Déclic‑Entrepreneur" },
        "offers": {
          "@type": "Offer",
          "price": "497",
          "priceCurrency": "EUR",
          "url": "https://buy.stripe.com/aFafZg2Dt3sy06x5j19fW03",
          "availability": "https://schema.org/InStock"
        }
      },
      {
        "@type": "Course",
        "name": "Formation Agent Immobilier",
        "description":
          "Optimisation spécifique mandataires : IK maximisées, frais réels, cas par CA, holdings & SCI.",
        "provider": { "@type": "Organization", "name": "Déclic‑Entrepreneur" },
        "offers": {
          "@type": "Offer",
          "price": "897",
          "priceCurrency": "EUR",
          "url": "https://buy.stripe.com/4gM3cu5PFd382eF5j19fW02",
          "availability": "https://schema.org/InStock"
        }
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      // @ts-ignore
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                                   PAGE                                     */
/* -------------------------------------------------------------------------- */

export default function FormationsIndex() {
  return (
    <main className="min-h-screen bg-white">
      <JsonLd />

{/* HERO HIGH‑TICKET (contraste fixé) */}
<section className="bg-[linear-gradient(180deg,#0f2742_0%,#0f2742_60%,#102b48_100%)] text-white py-24 px-4 text-center relative overflow-hidden">
  <div className="absolute inset-0 opacity-10 pointer-events-none">
    {/* décor éventuel (icône/shape) */}
  </div>

  <div className="relative z-10 max-w-4xl mx-auto">
    <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
      Passez au niveau supérieur&nbsp;:{" "}
      <span className="text-[#F59E0B]">gagnez plus net, légalement.</span>
    </h1>

    <p className="text-lg md:text-xl mt-6 text-white/85 leading-relaxed">
      Nos programmes condensent 10+ ans d’optimisation terrain pour indépendants et agents.
      Vous suivez, vous appliquez, vous voyez la différence sur votre compte pro.
      Accès immédiat, à vie, mises à jour incluses.
    </p>

    {/* ✅ CTA : lisibilité assurée */}
    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
      {/* CTA primaire : bouton BLANC plein */}
      <Link href="#catalogue">
        <Button className="h-12 px-6 bg-white text-[#123055] hover:bg-slate-100 border-0 rounded-xl font-semibold shadow">
          Voir les programmes
        </Button>
      </Link>

      {/* CTA secondaire : bouton BLANC plein (robuste sur fond sombre) */}
      <Link href="/rdv">
        <Button className="h-12 px-6 bg-white text-[#123055] hover:bg-slate-100 border-0 rounded-xl font-semibold shadow">
          Parler à un expert
        </Button>
      </Link>
    </div>

    {/* Bullets crédibilité */}
    <div className="mt-6 flex items-center justify-center gap-5 text-white/80 text-sm">
      <div className="flex items-center gap-2">Paiement sécurisé</div>
      <div className="flex items-center gap-2">Accès à vie</div>
      <div className="flex items-center gap-2">Satisfaction 4.9/5*</div>
    </div>
    <p className="text-white/60 text-xs mt-2">
      *Témoignages et retours clients collectés sur nos cohortes internes.
    </p>
  </div>
</section>

      {/* SECTION PROMESSE / ROI */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            {
              title: "ROI mesurable",
              text:
                "Mettez en place la déduction des frais réels, optimisez salaire/dividendes et récupérez vos IK : votre net augmente, tout de suite.",
            },
            {
              title: "Méthode éprouvée",
              text:
                "Oubliez la théorie. Étapes pas‑à‑pas, check‑lists, cas chiffrés et simulateurs pour décider vite et bien.",
            },
            {
              title: "Vision long terme",
              text:
                "Structurez correctement (SASU/EURL), préparez holding/SCI si besoin, et sécurisez votre trajectoire.",
            },
          ].map((b) => (
            <div
              key={b.title}
              className="rounded-2xl border border-slate-200 p-6 bg-white shadow-sm"
            >
              <h3 className="font-bold text-[#123055]">{b.title}</h3>
              <p className="text-slate-600 mt-2 text-sm leading-relaxed">
                {b.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CATALOGUE */}
      <section id="catalogue" className="py-20 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-extrabold text-[#123055] text-center mb-12">
            Choisissez votre transformation
          </h2>

        <div className="grid md:grid-cols-2 gap-8">
          {/* CRÉATEUR */}
          <article className="rounded-3xl bg-white border border-slate-200 p-8 shadow-sm hover:shadow-xl transition-all">
            <header>
              <h3 className="text-2xl font-bold text-[#123055]">
                Formation Créateur
              </h3>
              <p className="text-lg font-extrabold text-[#123055] mt-2">
                497€
              </p>
              <p className="mt-4 text-slate-600 leading-relaxed">
                Choix du statut (SASU/EURL), fiscalité appliquée,{" "}
                <strong>méthode VASE</strong>, création de société pas‑à‑pas.
                Le programme pour arrêter de perdre de l’argent à cause d’un
                mauvais setup.
              </p>
            </header>

            <ul className="mt-6 space-y-3">
              {[
                "Comparatif SASU/EURL : le bon curseur selon vos objectifs",
                "Salaire vs dividendes : augmenter le net, réduire le superflu",
                "Méthode VASE (Exclusif) : véhicule, abondement, salaire, épargne",
                "Pack documents + simulateurs pour décider en 30 minutes",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 size={20} className="text-emerald-600 mt-1" />
                  <span className="text-slate-700">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link href="/formations/createur">
                <Button className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold h-12 rounded-xl">
                  En savoir plus <ArrowRight size={18} className="ml-2" />
                </Button>
              </Link>

              {/* Payment Link (Stripe) */}
              <a
                href="https://buy.stripe.com/aFafZg2Dt3sy06x5j19fW03"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button
                  variant="outline"
                  className="w-full h-12 font-semibold rounded-xl border-slate-300"
                >
                  Acheter — 497€
                </Button>
              </a>
            </div>
          </article>

          {/* AGENT IMMO */}
          <article className="rounded-3xl bg-white border border-amber-300 p-8 shadow-xl ring-2 ring-amber-400/40">
            <header>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                Populaire
              </div>
              <h3 className="text-2xl font-bold text-[#123055] mt-2">
                Formation Agent Immobilier
              </h3>
              <p className="text-lg font-extrabold text-[#123055] mt-2">
                897€
              </p>
              <p className="mt-4 text-slate-600 leading-relaxed">
                Optimisation <strong>spécifique mandataires</strong> :
                indemnités kilométriques (IK) maximisées, frais réels,
                cas pratiques par paliers de CA, holdings & SCI pour
                réinvestir sereinement.
              </p>
            </header>

            <ul className="mt-6 space-y-3">
              {[
                "IK & frais réels : 6 000€ à 15 000€ possibles selon usage",
                "Cas pratiques IAD, SAFTI, KW, etc. : décisions rapides",
                "Holding/SCI : structurer vos gains sans vous piéger",
                "Simulateur Agent Immo + tableur IK inclus",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 size={20} className="text-emerald-600 mt-1" />
                  <span className="text-slate-700">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link href="/formations/agent-immobilier">
                <Button className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold h-12 rounded-xl">
                  En savoir plus <ArrowRight size={18} className="ml-2" />
                </Button>
              </Link>

              {/* Payment Link (Stripe) */}
              <a
                href="https://buy.stripe.com/4gM3cu5PFd382eF5j19fW02"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button
                  variant="outline"
                  className="w-full h-12 font-semibold rounded-xl border-slate-300"
                >
                  Acheter — 897€
                </Button>
              </a>
            </div>
          </article>
        </div>

          <p className="text-center mt-12 text-slate-500 text-sm">
            Paiement sécurisé • Accès immédiat à vie • Mises à jour incluses
          </p>
        </div>
      </section>

      {/* PREUVE SOCIALE / MINI‑TÉMOIGNAGES */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            {
              quote:
                "“En appliquant la méthode VASE, j’ai augmenté mon net de 1 100€/mois.”",
              name: "Thomas R.",
              role: "Développeur freelance",
            },
            {
              quote:
                "“IK + société : +12 000€ l’année dernière. C’est carré et actionnable.”",
              name: "Sophie M.",
              role: "Consultante",
            },
            {
              quote:
                "“Mandataire : passage en SASU, IK, frais réels — +8 000€ récupérés.”",
              name: "Marie L.",
              role: "Agent immobilier",
            },
          ].map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border border-slate-200 p-6 bg-white shadow-sm"
            >
              <div className="flex gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="text-[#F59E0B] fill-[#F59E0B]"
                    size={16}
                  />
                ))}
              </div>
              <p className="text-slate-800">{t.quote}</p>
              <p className="mt-3 font-semibold text-[#123055]">{t.name}</p>
              <p className="text-slate-500 text-sm">{t.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ SEO (même contenu que JSON‑LD pour cohérence) */}
      <section id="faq" className="py-20 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-extrabold text-[#123055] text-center mb-12">
            Questions fréquentes
          </h2>
          <div className="divide-y rounded-2xl border border-slate-200 bg-white">
            {[
              {
                q: "Combien puis‑je économiser avec ces formations ?",
                a: "Selon votre CA, vos frais et votre statut, les économies courantes vont d’environ 5 000€ à 20 000€ par an grâce à la déduction des frais réels, au pilotage salaire/dividendes et aux IK.",
              },
              {
                q: "L’accès est‑il immédiat et à vie ?",
                a: "Oui. Après paiement, vous recevez un accès immédiat et permanent, avec mises à jour annuelles incluses.",
              },
              {
                q: "SASU ou EURL : quelle structure choisir ?",
                a: "Cela dépend de votre rémunération cible, de vos charges et de vos projets. La formation compare précisément les deux et fournit des cas pratiques chiffrés.",
              },
              {
                q: "Puis‑je payer en entreprise et déduire l’achat ?",
                a: "Oui, si l’achat est effectué pour l’activité professionnelle et conforme aux règles fiscales en vigueur.",
              },
              {
                q: "Et si je débute ?",
                a: "C’est le meilleur moment : vous évitez les erreurs de départ et sécurisez votre trajectoire fiscale dès la création.",
              },
            ].map((faq) => (
              <details key={faq.q} className="group px-6 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between">
                  <span className="font-semibold text-[#123055]">
                    {faq.q}
                  </span>
                  <span className="transition-transform group-open:rotate-180 text-slate-500">
                    ⌄
                  </span>
                </summary>
                <p className="mt-3 text-slate-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 px-4 bg-[linear-gradient(180deg,#0f2742_0%,#0f2742_60%,#102b48_100%)] text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold">
            Prêt à récupérer ce que vous laissez sur la table&nbsp;?
          </h2>
          <p className="text-white/85 mt-3">
            Rejoignez la formation adaptée à votre profil et mettez en place,
            cette semaine, les leviers qui augmentent votre net.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/formations/createur">
              <Button className="bg-white text-[#123055] hover:bg-slate-100 h-12 rounded-xl">
                Formation Créateur — En savoir plus
                <Button
  variant="outline"
  className="w-full h-12 rounded-xl font-semibold border border-white text-white hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/60"
>
  Formation Agent Immo — En savoir plus
</Button>
</Link>

          </div>
          <p className="text-white/60 text-xs mt-6">
            Paiement sécurisé • Accès à vie • Mises à jour incluses
          </p>
        </div>
      </section>
    </main>
  );
}