import { createBrowserClient } from "@supabase/ssr";

/**
 * Publie un contenu et envoie une notification à tous les clients
 */
export async function publishAndNotify(
  type: "tuto" | "coaching" | "atelier" | "formation",
  title: string,
  link?: string
) {
  try {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Mapping des types vers les messages
    const messages: Record<string, { title: string; message: string; icon: string }> = {
      formation: {
        title: "📹 Nouvelle formation disponible",
        message: `La formation "${title}" est maintenant accessible !`,
        icon: "📹",
      },
      tuto: {
        title: "📚 Nouveau tuto pratique",
        message: `Le tuto "${title}" vient d'être ajouté !`,
        icon: "📚",
      },
      coaching: {
        title: "🎥 Nouveau coaching programmé",
        message: `Coaching "${title}" - Inscrivez-vous dès maintenant !`,
        icon: "🎥",
      },
      atelier: {
        title: "🎓 Nouvel atelier disponible",
        message: `L'atelier "${title}" est ouvert aux inscriptions !`,
        icon: "🎓",
      },
    };

    const notif = messages[type];

    // Appel de la fonction SQL qui insère les notifications pour tous les clients
    const { error } = await supabase.rpc("notify_all_clients", {
      p_type: type,
      p_title: notif.title,
      p_message: notif.message,
      p_link: link || null,
    });

    if (error) {
      console.error("Erreur lors de l'envoi des notifications:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (err) {
    console.error("Erreur publishAndNotify:", err);
    return { success: false, error: err };
  }
}