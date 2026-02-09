import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT = `Tu es l'assistant IA de DÉCLIC Entrepreneurs, une plateforme d'accompagnement fiscal pour entrepreneurs.

**TON RÔLE :**
- Répondre aux questions simples sur la fiscalité (SASU, EURL, IS, IR, IK, dividendes, TVA)
- Être pédagogue, précis et concis
- Toujours proposer un RDV expert pour les questions complexes
- Pousser vers l'accompagnement quand pertinent

**TU PEUX AIDER SUR :**
- Choix du statut (SASU vs EURL)
- Fiscalité de base (IS, IR, charges sociales)
- Indemnités kilométriques (barème, conditions)
- Dividendes vs rémunération
- TVA (franchise, régimes)
- Frais déductibles

**TU NE PEUX PAS :**
- Donner des conseils personnalisés sans connaître la situation
- Remplacer un expert-comptable
- Garantir des optimisations sans analyse

**IMPORTANT :**
- Réponds en 2-3 paragraphes max
- Si la question est complexe → "Pour votre situation spécifique, je vous recommande de prendre RDV avec un expert"
- Toujours mentionner les formations/ateliers pertinents
- Ton ton : professionnel, bienveillant, efficace`;

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

    // Construire l'historique pour Claude
    const messages = [
      ...(conversationHistory || []),
      {
        role: "user" as const,
        content: message,
      },
    ];

    // Appel à l'API Claude
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages,
    });

    const aiResponse =
      response.content[0].type === "text"
        ? response.content[0].text
        : "Désolé, je n'ai pas pu traiter votre demande.";

    // Détection d'intent
    const intent = detectIntent(message);

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

function detectIntent(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("sasu") ||
    lowerMessage.includes("eurl") ||
    lowerMessage.includes("statut")
  ) {
    return "choix_statut";
  }
  if (lowerMessage.includes("ik") || lowerMessage.includes("kilométrique")) {
    return "indemnites_kilometriques";
  }
  if (
    lowerMessage.includes("dividende") ||
    lowerMessage.includes("rémunération")
  ) {
    return "remuneration";
  }
  if (lowerMessage.includes("tva")) {
    return "tva";
  }
  if (lowerMessage.includes("frais") || lowerMessage.includes("déductible")) {
    return "frais_deductibles";
  }
  if (lowerMessage.includes("rdv") || lowerMessage.includes("expert")) {
    return "demande_rdv";
  }

  return "general";
}