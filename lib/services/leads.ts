import { prisma } from "@/lib/prisma";

export const LeadService = {
  // Récupérer tous les leads avec les infos du Closer et du Setter
  async getAllLeads() {
    return await prisma.lead.findMany({
      include: {
        closer: true,
        setter: true
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  // Mettre à jour le statut d'un lead (ex: Nouveau -> Qualifié)
  async updateStatus(id: string, status: any) {
    return await prisma.lead.update({
      where: { id },
      data: { status }
    });
  }
};