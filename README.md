# DÉCLIC Entrepreneurs - Plateforme SaaS

Plateforme d'accompagnement fiscal pour entrepreneurs. Développée avec Next.js 14, Supabase, Prisma et Stripe.

## 🎨 Charte Graphique

| Élément | Couleur |
|---------|---------|
| **Orange principal** | `#E67E22` |
| **Orange foncé** | `#D35400` |
| **Orange clair** | `#F39C12` |
| **Bleu foncé** | `#2C3E50` |
| **Bleu très foncé** | `#1A252F` |
| **Succès** | `#10B981` |

**Polices :** Plus Jakarta Sans (corps), DM Serif Display (titres)

## 🚀 Déploiement rapide (45 min)

### Étape 1 : Créer les comptes (5 min)

1. **Supabase** : https://supabase.com (gratuit)
2. **Vercel** : https://vercel.com (gratuit)
3. **Stripe** : https://stripe.com (1.4% par transaction)
4. **GitHub** : https://github.com

### Étape 2 : Configurer Supabase (15 min)

1. Créer un nouveau projet "declic-prod"
2. Aller dans **Settings > API** et copier :
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`
3. Aller dans **Settings > Database** et copier :
   - Connection string → `DATABASE_URL`
4. Aller dans **Authentication > Providers** :
   - Activer Email/Password
5. Aller dans **Storage** :
   - Créer un bucket "documents" (public: false)

### Étape 3 : Configurer Stripe (15 min)

1. Créer les produits dans le Dashboard Stripe :
   - **Plateforme** : 97€/mois
   - **Starter** : 3 600€ (paiement 4x possible)
   - **Pro** : 4 600€
   - **Expert** : 6 600€
   - **Formation Essentielle** : 497€
   - **Formation Agent Immo** : 897€

2. Configurer le webhook :
   - URL : `https://votre-domaine.vercel.app/api/webhooks/stripe`
   - Events : `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`

3. Copier les clés :
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`

### Étape 4 : Déployer sur Vercel (10 min)

1. Push le code sur GitHub :
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/votre-compte/declic-saas.git
   git push -u origin main
   ```

2. Connecter le repo à Vercel :
   - New Project > Import from GitHub
   - Sélectionner le repo

3. Ajouter les variables d'environnement (depuis `.env.example`)

4. Deploy !

### Étape 5 : Initialiser la base (5 min)

```bash
# Installer les dépendances
pnpm install

# Générer le client Prisma
pnpm db:generate

# Pousser le schéma vers Supabase
pnpm db:push

# Remplir avec des données de test
pnpm db:seed
```

## 📁 Structure du projet

```
declic-saas-branded/
├── app/                      # Pages Next.js (App Router)
│   ├── admin/                # Dashboard Admin
│   ├── client/               # Dashboard Client
│   ├── commercial/           # Dashboard Commercial
│   ├── auth/                 # Pages connexion/inscription
│   ├── globals.css           # Styles globaux
│   ├── layout.tsx            # Layout racine
│   └── page.tsx              # Landing page
├── components/
│   └── ui/                   # Composants UI
│       ├── button.tsx
│       ├── card.tsx
│       ├── logo.tsx
│       └── sidebar.tsx
├── lib/
│   ├── supabase/             # Configuration Supabase
│   └── utils.ts              # Fonctions utilitaires
├── prisma/
│   ├── schema.prisma         # Schéma de base de données
│   └── seed.ts               # Données de test
├── .env.example              # Variables d'environnement
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## 👥 Rôles utilisateurs

| Rôle | Accès |
|------|-------|
| **ADMIN** | Tout (KPIs, équipe, paiements, remboursements) |
| **HOS** | Pipeline global, gestion closers/setters |
| **CLOSER** | Leur pipeline, stats personnelles |
| **SETTER** | No-shows à relancer, RDV posés |
| **EXPERT** | Leurs clients, agenda, tâches |
| **CLIENT** | Leur dossier, documents, paiements |

## 🔧 Commandes utiles

```bash
# Développement local
pnpm dev

# Build production
pnpm build

# Lancer en production
pnpm start

# Ouvrir Prisma Studio (GUI base de données)
pnpm db:studio

# Reseed la base de données
pnpm db:seed
```

## 💰 Coûts estimés

| Service | Gratuit | Pro |
|---------|---------|-----|
| Supabase | 500 MB DB, 50k auth | 25€/mois |
| Vercel | 100 GB bandwidth | 20€/mois |
| Stripe | - | 1.4% + 0.25€/tx |
| **Total** | **0€/mois** | **~50€/mois + commissions** |

## 📞 Support

Pour toute question technique :
- Email : contact@declic-entrepreneurs.fr
- Documentation : https://docs.declic-entrepreneurs.fr

---

**EVERYBOD'IR** - Présent depuis plus de 10 ans