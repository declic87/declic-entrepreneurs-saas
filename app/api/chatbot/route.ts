import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Vérifier l'authentification
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { message, userId, conversationHistory } = await req.json();

    if (!message || !userId) {
      return NextResponse.json(
        { error: "Message ou userId manquant" },
        { status: 400 }
      );
    }

    // Récupérer ou créer la conversation
    let { data: conversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("client_id", userId)
      .single();

    if (!conversation) {
      const { data: newConv } = await supabase.rpc(
        "create_conversation_if_not_exists",
        { p_client_id: userId }
      );

      if (newConv) {
        const { data: createdConv } = await supabase
          .from("conversations")
          .select("id")
          .eq("id", newConv)
          .single();
        conversation = createdConv;
      }
    }

    if (!conversation) {
      return NextResponse.json(
        { error: "Impossible de créer la conversation" },
        { status: 500 }
      );
    }

    // Insérer le message utilisateur
    const { error: userMsgError } = await supabase.from("messages").insert([
      {
        conversation_id: conversation.id,
        sender_id: userId,
        sender_type: "client",
        content: message,
        is_read: false,
      },
    ]);

    if (userMsgError) {
      console.error("Erreur insertion message utilisateur:", userMsgError);
    }

    // ============================================
    // RÉPONSE SIMULÉE (TEMPORAIRE)
    // ============================================
    const messageLower = message.toLowerCase();
    
    let aiResponse = "";
    let intent = "general";

    // Détection basique d'intent
    if (messageLower.includes("sasu") || messageLower.includes("eurl") || messageLower.includes("statut")) {
      intent = "choix_statut";
      aiResponse = `La principale différence entre SASU et EURL réside dans la fiscalité :

**SASU (Société par Actions Simplifiée Unipersonnelle) :**
- Soumise à l'IS (Impôt sur les Sociétés)
- Dividendes taxés à 30% (flat tax)
- Idéal si vous prévoyez de vous verser des dividendes

**EURL (Entreprise Unipersonnelle à Responsabilité Limitée) :**
- Par défaut à l'IR (Impôt sur le Revenu)
- Peut opter pour l'IS
- Idéal pour les petits CA avec peu de charges

Pour choisir le bon statut selon VOTRE situation, je vous recommande de :
1. Utiliser notre simulateur comparatif
2. Visionner la formation "Choix du statut" dans Tutos Pratiques
3. Réserver un RDV expert si vous avez un pack accompagnement

💡 **Note :** Cette réponse est temporaire. L'IA Anthropic Claude sera activée prochainement pour des réponses encore plus personnalisées.`;
    } else if (messageLower.includes("ik") || messageLower.includes("kilométrique")) {
      intent = "indemnites_kilometriques";
      aiResponse = `Les **Indemnités Kilométriques (IK)** permettent de déduire vos frais de déplacement professionnel.

**Barème 2024 :**
- Jusqu'à 5 000 km : 0,529 €/km (pour une 5CV)
- De 5 001 à 20 000 km : 0,316 €/km
- Au-delà de 20 000 km : 0,370 €/km

**Conditions :**
✅ Véhicule personnel utilisé pour l'activité pro
✅ Carte grise à votre nom
✅ Justificatifs de déplacements

Pour optimiser vos IK, consultez notre tuto pratique "Maximiser ses IK" dans l'onglet Formations.

💡 Cette réponse est temporaire en attendant l'activation de l'IA Claude.`;
    } else if (messageLower.includes("dividende") || messageLower.includes("rémunération")) {
      intent = "remuneration";
      aiResponse = `**Dividendes vs Rémunération : quelle stratégie choisir ?**

**Rémunération (salaire) :**
- ✅ Valide des trimestres de retraite
- ❌ Soumise aux charges sociales (~45%)

**Dividendes :**
- ✅ Flat tax 30% (au lieu de 45%)
- ❌ Ne valide pas de trimestres retraite

**Stratégie optimale (souvent) :**
1. Se verser un SMIC pour valider 4 trimestres
2. Compléter avec des dividendes pour optimiser la fiscalité

💡 Pour votre situation spécifique, réservez un RDV expert.

(Réponse temporaire - IA Claude en cours d'activation)`;
    } else {
      intent = "general";
      aiResponse = `Bonjour ! Je suis l'assistant IA de DÉCLIC Entrepreneurs 👋

Je peux vous aider sur :
- Choix du statut (SASU vs EURL)
- Fiscalité (IS, IR, charges sociales)
- Indemnités kilométriques (IK)
- Dividendes vs rémunération
- TVA et frais déductibles

Pour des conseils personnalisés, passez en mode **Expert** ou réservez un RDV avec un conseiller.

💡 **Note :** Cette réponse est temporaire. L'IA Anthropic Claude sera bientôt activée pour des réponses encore plus précises et personnalisées.`;
    }

    // Insérer la réponse IA dans messages
    const { error: aiMsgError } = await supabase.from("messages").insert([
      {
        conversation_id: conversation.id,
        sender_id: userId,
        sender_type: "ai",
        content: aiResponse,
        is_read: false,
      },
    ]);

    if (aiMsgError) {
      console.error("Erreur insertion réponse IA:", aiMsgError);
    }

    // Sauvegarder dans ai_chat_history
    await supabase.from("ai_chat_history").insert([
      {
        user_id: userId,
        message,
        response: aiResponse,
        intent,
      },
    ]);

    // Mettre à jour last_message_at
    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversation.id);

    return NextResponse.json({
      response: aiResponse,
      intent,
      success: true,
    });
  } catch (error: any) {
    console.error("Erreur API chatbot:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}