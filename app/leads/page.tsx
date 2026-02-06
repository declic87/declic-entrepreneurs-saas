import { prisma } from "@/lib/prisma";

export default async function LeadsPage() {
  // 1. Protection : On vérifie si prisma est bien chargé
  if (!prisma) {
    return <div style={{ padding: "20px", color: "red" }}>Erreur : Prisma n'est pas initialisé.</div>;
  }

  try {
    // 2. On essaie de récupérer les leads (Note : j'ai ajouté des vérifications)
    // Si ta table s'appelle 'lead' sans 's', change 'leads' en 'lead' ci-dessous
    const leads = await prisma.lead.findMany({
      orderBy: {
        created_at: 'desc'
      }
    }) || [];

    return (
      <div style={{ padding: "40px", fontFamily: "sans-serif", color: "#333", maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "bold" }}>Tableau de bord des Leads</h1>
          <span style={{ backgroundColor: "#e0f2fe", color: "#0369a1", padding: "5px 15px", borderRadius: "20px", fontSize: "14px", fontWeight: "600" }}>
            {leads.length} prospect(s)
          </span>
        </div>

        <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "white" }}>
            <thead style={{ backgroundColor: "#f9fafb" }}>
              <tr>
                <th style={{ textAlign: "left", padding: "12px 24px", borderBottom: "1px solid #e5e7eb", color: "#6b7280", fontSize: "12px", textTransform: "uppercase" }}>Prénom</th>
                <th style={{ textAlign: "left", padding: "12px 24px", borderBottom: "1px solid #e5e7eb", color: "#6b7280", fontSize: "12px", textTransform: "uppercase" }}>Email</th>
                <th style={{ textAlign: "left", padding: "12px 24px", borderBottom: "1px solid #e5e7eb", color: "#6b7280", fontSize: "12px", textTransform: "uppercase" }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {leads.length > 0 ? (
                leads.map((lead: any) => (
                  <tr key={lead.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "16px 24px" }}>{lead.first_name || "N/A"}</td>
                    <td style={{ padding: "16px 24px" }}>{lead.email}</td>
                    <td style={{ padding: "16px 24px", color: "#6b7280", fontSize: "14px" }}>
                      {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : "Inconnue"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} style={{ padding: "40px", textAlign: "center", color: "#9ca3af", fontStyle: "italic" }}>
                    Aucun lead trouvé dans la base de données.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  } catch (error: any) {
    console.error("Erreur Prisma :", error);
    return (
      <div style={{ padding: "40px", color: "red", fontFamily: "sans-serif" }}>
        <h2>Erreur de connexion à la base de données</h2>
        <p>{error.message}</p>
        <p>Vérifiez que vos variables d'environnement dans le fichier <strong>.env</strong> sont correctes.</p>
      </div>
    );
  }
}