import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Prompt système pour le chatbot fiscal
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
- Ton ton : professionnel, bienveillant, efficace

**EXEMPLE DE RÉPONSE :**
Question : "C'est quoi la différence entre SASU et EURL ?"
Réponse : "La principale différence réside dans la fiscalité : la SASU vous permet de vous verser des dividendes avec une fiscalité allégée (flat tax 30%), tandis que l'EURL est soumise à l'IR par défaut mais peut opter pour l'IS.

Pour choisir le bon statut selon VOTRE situation (CA prévisionnel, charges, patrimoine), je vous recommande de :
1. Utiliser notre simulateur comparatif
2. Visionner la formation 'Choix du statut' dans Tutos Pratiques
3. Réserver un RDV expert gratuit (si vous avez un pack accompagnement)

Besoin d'aide pour choisir ?"`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function askChatbot(
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<{ response: string; intent: string }> {
  try {
    // Construire l'historique de conversation
    const messages = [
      ...conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user" as const,
        content: userMessage,
      },
    ];

    // Appel à l'API Claude
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages,
    });

    const aiResponse = response.content[0].type === "text" 
      ? response.content[0].text 
      : "Désolé, je n'ai pas pu traiter votre demande.";

    // Détection d'intent basique
    const intent = detectIntent(userMessage);

    return {
      response: aiResponse,
      intent,
    };
  } catch (error) {
    console.error("Erreur chatbot IA:", error);
    return {
      response:
        "Désolé, je rencontre un problème technique. Un expert va prendre en charge votre demande sous peu. 🙏",
      intent: "error",
    };
  }
}

// Détection d'intent simplifiée
function detectIntent(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("sasu") || lowerMessage.includes("eurl") || lowerMessage.includes("statut")) {
    return "choix_statut";
  }
  if (lowerMessage.includes("ik") || lowerMessage.includes("kilométrique")) {
    return "indemnites_kilometriques";
  }
  if (lowerMessage.includes("dividende") || lowerMessage.includes("rémunération")) {
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

// Fonction pour sauvegarder l'historique IA dans Supabase
export async function saveAIHistory(
  supabase: any,
  userId: string,
  message: string,
  response: string,
  intent: string
) {
  try {
    await supabase.from("ai_chat_history").insert([
      {
        user_id: userId,
        message,
        response,
        intent,
      },
    ]);
  } catch (error) {
    console.error("Erreur sauvegarde historique IA:", error);
  }
}