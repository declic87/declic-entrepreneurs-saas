import { prisma } from "./lib/prisma.ts";

async function test() {
  console.log("🔍 Test de la base de données...");
  try {
    const users = await prisma.user.findMany();
    console.log(`✅ Connexion réussie ! ${users.length} utilisateur(s) trouvé(s).`);
  } catch (e) {
    console.error("❌ Erreur :", e);
  }
}

test();