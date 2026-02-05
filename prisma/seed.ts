import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Début du seeding...");

  // 1. Nettoyage (Ordre précis pour respecter les contraintes de clés étrangères)
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

  // 2. Création des Utilisateurs Staff
  console.log("👥 Création du staff...");
  const users = {
    admin: await prisma.user.create({
      data: { id: "admin-001", email: "jerome@declic-entrepreneurs.fr", name: "Jérôme Jonnard", role: "ADMIN" }
    }),
    hos: await prisma.user.create({
      data: { id: "hos-001", email: "michael@declic-entrepreneurs.fr", name: "Michael Stoppani", role: "HOS" }
    }),
    closer: await prisma.user.create({
      data: { id: "closer-001", email: "alexandre@declic-entrepreneurs.fr", name: "Alexandre Martin", role: "CLOSER" }
    }),
    expert: await prisma.user.create({
      data: { id: "expert-001", email: "marie@declic-entrepreneurs.fr", name: "Marie Laurent", role: "EXPERT" }
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

  // 4. Création des Leads (Pipeline)
  console.log("📈 Génération des leads...");
  const leads = [
    { name: "Marie Durand", email: "marie.durand@email.com", temperature: "HOT", status: "NOUVEAU", stage: 0 },
    { name: "Lucas Moreau", email: "lucas.moreau@email.com", temperature: "HOT", status: "QUALIFIE", stage: 2, ca: 95000 },
    { name: "Antoine Blanc", email: "antoine.blanc@email.com", temperature: "WARM", status: "CLOSE", stage: 7, ca: 120000 },
  ];

  for (const lead of leads) {
    await prisma.lead.create({
      data: {
        ...lead,
        temperature: lead.temperature as any,
        status: lead.status as any,
        closerId: users.closer.id,
      }
    });
  }

  // 5. Création d'un Client avec historique
  console.log("🤝 Création d'un client actif...");
  const clientUser = await prisma.user.create({
    data: { id: "client-001", email: "jean.dupont@gmail.com", name: "Jean Dupont", role: "CLIENT" }
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

  // 6. Paiements et Documents
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