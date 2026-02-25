import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT = `Tu es l'Assistant IA Expert de DÉCLIC Entrepreneurs, la plateforme premium d'optimisation fiscale pour entrepreneurs français.

## 🎯 TON RÔLE
Tu es un expert-comptable fiscal français spécialisé en :
- Création et gestion de sociétés (SASU, EURL, SAS, SARL, SCI)
- Optimisation fiscale légale et stratégies patrimoniales
- Analyse comparative des statuts juridiques
- Calculs de charges sociales, IS, IR, dividendes
- Indemnités kilométriques et frais déductibles
- Stratégies d'investissement immobilier (LMNP, SCI)
- Prévisions et business plans

## 💼 EXPERTISE TECHNIQUE
- Tu maîtrises le Code Général des Impôts 2024-2026
- Tu connais les barèmes URSSAF, charges sociales et fiscales en vigueur
- Tu es à jour sur les réformes fiscales récentes
- Tu utilises des exemples chiffrés concrets et pertinents

## 🎨 STYLE DE RÉPONSE
✅ **TON ULTRA-PRO :**
- Précis, factuel, professionnel mais accessible
- Tu vulgarises sans simplifier à l'excès
- Tu utilises des emojis stratégiques (📊💰✅❌) pour la lisibilité
- Tu structures avec des titres, listes, tableaux comparatifs

✅ **FORMAT IDÉAL :**
1. Réponse directe et claire en introduction (2-3 lignes max)
2. Développement structuré avec exemples chiffrés
3. Recommandation d'action concrète en conclusion

❌ **À ÉVITER :**
- Jargon incompréhensible sans explication
- Réponses vagues ou évasives
- Conseils génériques applicables à tout le monde
- Formules de politesse excessives

## ⚠️ RÈGLES DE SÉCURITÉ
- JAMAIS de conseil en investissement financier (actions, crypto)
- JAMAIS de validation définitive sans "consultez un expert"
- TOUJOURS préciser "selon les règles 2024-2026"
- En cas de doute technique : rediriger vers RDV Expert`;

// Fonction retry avec backoff exponentiel
async function callClaudeWithRetry(messages: any[], maxRetries = 3): Promise<Anthropic.Message> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: messages,
      });
      
      return response;
    } catch (error: any) {
      // Si overloaded, attendre et réessayer
      if (error.status === 529 && attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.log(`⏳ Retry ${attempt + 1}/${maxRetries} après ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // Autre erreur ou max retries atteint
      throw error;
    }
  }
  
  throw new Error("Max retries reached");
}

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

    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { message, userId, conversationId, conversationHistory = [] } = await req.json();

    if (!message || !userId) {
      return NextResponse.json(
        { error: "Message ou userId manquant" },
        { status: 400 }
      );
    }

    let finalConversationId = conversationId;

    if (!finalConversationId) {
      let { data: conversation } = await supabase
        .from("conversations")
        .select("id")
        .eq("client_id", userId)
        .single();

      if (!conversation) {
        const { data: newConv } = await supabase
          .from("conversations")
          .insert({ client_id: userId })
          .select("id")
          .single();

        conversation = newConv;
      }

      if (!conversation) {
        return NextResponse.json(
          { error: "Impossible de créer la conversation" },
          { status: 500 }
        );
      }

      finalConversationId = conversation.id;
    }

    // Construire l'historique
    const claudeMessages: Array<{ role: "user" | "assistant"; content: string }> = [];
    
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      claudeMessages.push({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      });
    }
    
    claudeMessages.push({
      role: "user",
      content: message,
    });

    // ✅ APPEL AVEC RETRY - Type explicite
    let claudeResponse: Anthropic.Message;
    try {
      claudeResponse = await callClaudeWithRetry(claudeMessages);
    } catch (error: any) {
      // Si toujours overloaded après retry
      if (error.status === 529) {
        return NextResponse.json({
          response: "⚠️ L'IA est temporairement surchargée. Réessayez dans quelques secondes ou passez en mode Expert.",
          intent: "overloaded",
          success: false,
        });
      }
      throw error;
    }

    const aiResponse = claudeResponse.content
      .filter((block) => block.type === "text")
      .map((block) => (block as any).text)
      .join("\n\n");

    // Détection d'intent
    const messageLower = message.toLowerCase();
    let intent = "general";
    
    if (messageLower.includes("sasu") || messageLower.includes("eurl") || messageLower.includes("statut")) {
      intent = "choix_statut";
    } else if (messageLower.includes("ik") || messageLower.includes("kilométrique")) {
      intent = "indemnites_kilometriques";
    } else if (messageLower.includes("dividende") || messageLower.includes("rémunération")) {
      intent = "remuneration";
    } else if (messageLower.includes("immobilier") || messageLower.includes("lmnp") || messageLower.includes("sci")) {
      intent = "immobilier";
    } else if (messageLower.includes("charges") || messageLower.includes("urssaf")) {
      intent = "charges_sociales";
    }

    // Insérer la réponse IA
    const { error: aiMsgError } = await supabase.from("messages").insert([
      {
        conversation_id: finalConversationId,
        sender_id: null,
        sender_type: "ai",
        content: aiResponse,
        is_read: false,
      },
    ]);

    if (aiMsgError) {
      console.error("Erreur insertion réponse IA:", aiMsgError);
      throw aiMsgError;
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
      .eq("id", finalConversationId);

    return NextResponse.json({
      response: aiResponse,
      intent,
      success: true,
    });
  } catch (error: any) {
    console.error("Erreur API chatbot:", error);
    
    return NextResponse.json({
      response: "⚠️ Une erreur est survenue. Veuillez passer en mode Expert pour contacter directement un conseiller.",
      intent: "error",
      success: false,
      error: error.message,
    });
  }
}