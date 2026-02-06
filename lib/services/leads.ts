import { prisma } from "@/lib/prisma";

export const LeadService = {
  // Récupérer tous les leads (Inclusions désactivées temporairement pour le build)
  async getAllLeads() {
    return await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' }
    });
  },

  // Mettre à jour le statut d'un lead
  async updateStatus(id: string, status: any) {
    return await prisma.lead.update({
      where: { id },
      data: { status }
    });
  }
};