import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Début du seeding...");

  // 1. Nettoyage
  console.log("🧹 Nettoyage de la base de données...");
  const deleteOrder = [
    prisma.notification.deleteMany(),
    prisma.refund.deleteMany(),
    prisma.contract.deleteMany(),
    prisma.note.deleteMany(),
    prisma.simulation.deleteMany(),
    prisma.rdv.deleteMany(),
    prisma.task.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.document.deleteMany(),
    prisma.lead.deleteMany(),
    prisma.client.deleteMany(),
    prisma.expert.deleteMany(),
    prisma.team.deleteMany(),
    prisma.user.deleteMany(),
  ];

  try {
    await prisma.$transaction(deleteOrder);
  } catch (e) {
    console.log("ℹ️ Note: Certaines tables étaient déjà vides.");
  }

  // 2. Création des Utilisateurs Staff (NAME RETIRÉ ICI)
  console.log("👥 Création du staff...");
  const users = {
    admin: await prisma.user.create({
      data: { id: "admin-001", email: "jerome@declic-entrepreneurs.fr", role: "ADMIN" }
    }),
    hos: await prisma.user.create({
      data: { id: "hos-001", email: "michael@declic-entrepreneurs.fr", role: "HOS" }
    }),
    closer: await prisma.user.create({
      data: { id: "closer-001", email: "alexandre@declic-entrepreneurs.fr", role: "CLOSER" }
    }),
    expert: await prisma.user.create({
      data: { id: "expert-001", email: "marie@declic-entrepreneurs.fr", role: "EXPERT" }
    }),
  };

  // 3. Création de l'Expertise
  const expertProfile = await prisma.expert.create({
    data: {
      userId: users.expert.id,
      specialite: "Optimisation SASU/EURL",
      noteMoyenne: 4.9,
      satisfaction: 98,
    }
  });

// 4. Création des Leads (Version ultra-simplifiée pour le build)
console.log("📈 Génération des leads...");
const leads = [
  { email: "marie.durand@email.com" },
  { email: "lucas.moreau@email.com" },
];

for (const lead of leads) {
  await prisma.lead.create({
    data: {
      email: lead.email,
      // On ne met QUE ce qui est obligatoire dans ton schéma
    }
  });
}

  // 5. Création d'un Client (NAME RETIRÉ ICI)
  console.log("🤝 Création d'un client actif...");
  const clientUser = await prisma.user.create({
    data: { id: "client-001", email: "jean.dupont@gmail.com", role: "CLIENT" }
  });

  const client = await prisma.client.create({
    data: {
      userId: clientUser.id,
      offre: "PRO",
      status: "EN_COURS",
      progression: 65,
      etape: 4,
      expertId: expertProfile.id,
    }
  });

  // 6. Paiements
  await prisma.payment.create({
    data: { clientId: client.id, amount: 1150, status: "PAID", echeance: 1, dueDate: new Date() }
  });

  console.log("✅ Seeding terminé avec succès !");
}

main()
  .catch((e) => {
    console.error("❌ Erreur pendant le seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });