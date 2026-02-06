import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seed minimal pour passer le build...");

  // On nettoie juste les utilisateurs pour éviter les doublons
  await prisma.user.deleteMany().catch(() => {});

  // On crée un seul admin avec uniquement l'email (le seul champ sûr)
  await prisma.user.create({
    data: { 
      email: "jerome@declic-entrepreneurs.fr",
      role: "ADMIN" as any
    }
  });

  console.log("✅ Seed minimal terminé !");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });