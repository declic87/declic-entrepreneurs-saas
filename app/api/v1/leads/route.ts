import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email?.toLowerCase().trim();

    if (!email) {
      return NextResponse.json({ error: "L'email est requis" }, { status: 400 });
    }

    // 1. Vérification Anti-Doublon
    const { data: existingLead } = await supabaseAdmin
      .from("leads")
      .select("id, metadata")
      .eq("email", email)
      .single();

    const leadData = {
      firstName: body.firstName || body.first_name || "Prénom non spécifié",
      lastName: body.lastName || body.last_name || "",
      phone: body.phone || body.contact_phone || "",
      source: body.source || "Vitrine/Inconnue",
      status: "NEW",
      metadata: {
        utm_source: body.utm_source || null,
        utm_campaign: body.utm_campaign || null,
        ghl_id: body.contact_id || null,
        last_updated_at: new Date().toISOString()
      }
    };

    if (existingLead) {
      // 2. Mise à jour si le lead existe déjà
      await supabaseAdmin
        .from("leads")
        .update({
          ...leadData,
          status: "RE-ENGAGED", // On signale qu'il est revenu
          metadata: { ...existingLead.metadata, ...leadData.metadata }
        })
        .eq("id", existingLead.id);

      return NextResponse.json({ success: true, message: "Lead mis à jour", id: existingLead.id });
    }

    // 3. Création si nouveau lead
    const { data, error } = await supabaseAdmin
      .from("leads")
      .insert([{ email, ...leadData }])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, id: data[0].id }, { status: 201 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}