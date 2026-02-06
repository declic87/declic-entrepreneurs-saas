import { prisma } from "@/lib/prisma";

export const LeadService = {
  // Récupérer tous les leads sans tri pour valider le build
  async getAllLeads() {
    return await prisma.lead.findMany();
  },

  // Mettre à jour le statut
  async updateStatus(id: string, status: any) {
    return await prisma.lead.update({
      where: { id },
      data: { status }
    });
  }
};