"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createLead(formData: FormData) {
  const firstName = formData.get("firstName") as string
  const email = formData.get("email") as string

  try {
    await prisma.lead.create({
      data: {
        first_name: firstName,
        email: email,
        // Ajoute ici les autres champs selon ton schéma (status, etc.)
      },
    })

    revalidatePath("/lead") // Actualise la liste des leads automatiquement
    return { success: true }
  } catch (error) {
    console.error("Erreur Prisma:", error)
    return { success: false, error: "Impossible de créer le lead" }
  }
}