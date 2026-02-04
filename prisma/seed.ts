import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Nettoyer les données existantes
  await prisma.notification.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.note.deleteMany();
  await prisma.simulation.deleteMany();
  await prisma.rdv.deleteMany();
  await prisma.task.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.document.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.client.deleteMany();
  await prisma.expert.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();

  // Créer les utilisateurs
  console.log("Creating users...");

  const admin = await prisma.user.create({
    data: {
      id: "admin-001",
      email: "jerome@declic-entrepreneurs.fr",
      name: "Jérôme Jonnard",
      role: "ADMIN",
      phone: "06 00 00 00 00",
    },
  });

  const hos = await prisma.user.create({
    data: {
      id: "hos-001",
      email: "michael@declic-entrepreneurs.fr",
      name: "Michael Stoppani",
      role: "HOS",
      phone: "06 11 11 11 11",
    },
  });

  const closer1 = await prisma.user.create({
    data: {
      id: "closer-001",
      email: "alexandre@declic-entrepreneurs.fr",
      name: "Alexandre Martin",
      role: "CLOSER",
      phone: "06 22 22 22 22",
    },
  });

  const closer2 = await prisma.user.create({
    data: {
      id: "closer-002",
      email: "marine@declic-entrepreneurs.fr",
      name: "Marine Dubois",
      role: "CLOSER",
      phone: "06 33 33 33 33",
    },
  });

  const setter1 = await prisma.user.create({
    data: {
      id: "setter-001",
      email: "sarah@declic-entrepreneurs.fr",
      name: "Sarah Petit",
      role: "SETTER",
      phone: "06 44 44 44 44",
    },
  });

  const expert1 = await prisma.user.create({
    data: {
      id: "expert-001",
      email: "marie@declic-entrepreneurs.fr",
      name: "Marie Laurent",
      role: "EXPERT",
      phone: "06 55 55 55 55",
    },
  });

  const client1User = await prisma.user.create({
    data: {
      id: "client-001",
      email: "jean.dupont@email.com",
      name: "Jean Dupont",
      role: "CLIENT",
      phone: "06 66 66 66 66",
    },
  });

  const client2User = await prisma.user.create({
    data: {
      id: "client-002",
      email: "sophie.martin@email.com",
      name: "Sophie Martin",
      role: "CLIENT",
      phone: "06 77 77 77 77",
    },
  });

  // Créer l'expert
  console.log("Creating expert...");
  const expert = await prisma.expert.create({
    data: {
      userId: expert1.id,
      specialite: "Optimisation fiscale SASU",
      calendlyUrl: "https://calendly.com/declic-experts/marie",
      bio: "Expert en optimisation fiscale avec 10 ans d'expérience.",
      noteMoyenne: 4.9,
      satisfaction: 98,
    },
  });

  // Créer les clients
  console.log("Creating clients...");
  const client1 = await prisma.client.create({
    data: {
      userId: client1User.id,
      offre: "PRO",
      status: "EN_COURS",
      progression: 42,
      etape: 3,
      expertId: expert.id,
      note: 5,
    },
  });

  const client2 = await prisma.client.create({
    data: {
      userId: client2User.id,
      offre: "STARTER",
      status: "ONBOARDING",
      progression: 14,
      etape: 1,
      expertId: expert.id,
    },
  });

  // Créer des leads
  console.log("Creating leads...");
  const leadsData = [
    { name: "Marie Durand", email: "marie.durand@email.com", phone: "06 12 34 56 78", temperature: "HOT", ca: 85000, activite: "Consultante RH", source: "Google", status: "NOUVEAU", stage: 0 },
    { name: "Pierre Martin", email: "pierre.martin@email.com", temperature: "WARM", ca: 65000, activite: "Développeur", source: "Meta", status: "NOUVEAU", stage: 0 },
    { name: "Sophie Bernard", email: "sophie.bernard@email.com", temperature: "COLD", activite: "Coach", source: "Referral", status: "NOUVEAU", stage: 0 },
    { name: "Lucas Moreau", email: "lucas.moreau@email.com", temperature: "HOT", ca: 95000, activite: "Formateur", status: "QUALIFIE", stage: 2 },
    { name: "Emma Leroy", email: "emma.leroy@email.com", phone: "06 11 22 33 44", temperature: "HOT", ca: 78000, activite: "Naturopathe", status: "RDV_PLANIFIE", stage: 3 },
    { name: "Thomas Richard", email: "thomas.richard@email.com", temperature: "HOT", ca: 145000, activite: "Avocat", status: "PROPOSITION", stage: 5 },
    { name: "Julie Garcia", email: "julie.garcia@email.com", temperature: "HOT", ca: 88000, activite: "Architecte", status: "NEGOCIE", stage: 6 },
    { name: "Antoine Blanc", email: "antoine.blanc@email.com", temperature: "HOT", ca: 92000, activite: "Kiné", status: "CLOSE", stage: 7 },
  ];

  for (const lead of leadsData) {
    await prisma.lead.create({
      data: {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        temperature: lead.temperature as any,
        ca: lead.ca,
        activite: lead.activite,
        source: lead.source,
        status: lead.status as any,
        stage: lead.stage,
        closerId: closer1.id,
        setterId: setter1.id,
      },
    });
  }

  // Créer des documents
  console.log("Creating documents...");
  await prisma.document.createMany({
    data: [
      { clientId: client1.id, type: "CNI", name: "CNI_Jean_Dupont.pdf", url: "/documents/cni.pdf", status: "VALIDE" },
      { clientId: client1.id, type: "JUSTIFICATIF_DOMICILE", name: "Justificatif_Domicile.pdf", url: "/documents/domicile.pdf", status: "VALIDE" },
      { clientId: client1.id, type: "DESCRIPTIF_ACTIVITE", name: "Descriptif_Activite.pdf", url: "/documents/activite.pdf", status: "EN_ATTENTE" },
    ],
  });

  // Créer des paiements
  console.log("Creating payments...");
  await prisma.payment.createMany({
    data: [
      { clientId: client1.id, amount: 1150, status: "PAID", echeance: 1, dueDate: new Date("2026-01-15"), paidAt: new Date("2026-01-15") },
      { clientId: client1.id, amount: 1150, status: "PAID", echeance: 2, dueDate: new Date("2026-02-15"), paidAt: new Date("2026-02-14") },
      { clientId: client1.id, amount: 1150, status: "PENDING", echeance: 3, dueDate: new Date("2026-03-15") },
      { clientId: client1.id, amount: 1150, status: "PENDING", echeance: 4, dueDate: new Date("2026-04-15") },
    ],
  });

  // Créer des tâches
  console.log("Creating tasks...");
  await prisma.task.createMany({
    data: [
      { assignedToId: expert1.id, clientId: client1.id, title: "Finaliser statuts SASU", priority: "HIGH", status: "IN_PROGRESS", dueDate: new Date("2026-02-01") },
      { assignedToId: expert1.id, clientId: client1.id, title: "Préparer RDV création société", priority: "MEDIUM", status: "TODO", dueDate: new Date("2026-02-05") },
      { assignedToId: expert1.id, clientId: client2.id, title: "Appel de bienvenue", priority: "URGENT", status: "TODO", dueDate: new Date("2026-01-31") },
      { assignedToId: closer1.id, title: "Relancer leads froids", priority: "LOW", status: "TODO", dueDate: new Date("2026-02-10") },
    ],
  });

  // Créer des RDV
  console.log("Creating rdvs...");
  await prisma.rdv.createMany({
    data: [
      { clientId: client1.id, expertId: expert.id, type: "SUIVI", status: "PLANIFIE", date: new Date("2026-02-15T10:00:00"), duration: 30 },
      { clientId: client2.id, expertId: expert.id, type: "DIAGNOSTIC", status: "PLANIFIE", date: new Date("2026-02-01T14:00:00"), duration: 45 },
    ],
  });

  // Créer une équipe
  console.log("Creating team...");
  await prisma.team.create({
    data: {
      name: "Équipe Alpha",
      headOfSalesId: hos.id,
    },
  });

  console.log("✅ Seeding completed!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });