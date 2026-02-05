import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Client Admin pour contourner le RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ users: data });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, firstName, lastName, role, teamId, phone } = body;

    // 1. Création du compte Auth (Admin bypass confirmation email)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { firstName, lastName, role }
    });

    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

    // 2. Création du profil dans la table 'users'
    const { error: profileError } = await supabaseAdmin.from("users").insert({
      authId: authData.user.id,
      email,
      firstName,
      lastName,
      role,
      phone: phone || "",
      team_id: teamId || null,
      is_active: true
    });

    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });

    // 3. Log d'activité
    await supabaseAdmin.from("activity_logs").insert({
      user_name: "Admin",
      action: `A créé le compte ${role} pour ${firstName} ${lastName}`,
      target_type: "user",
      details: { email, role }
    });

    return NextResponse.json({ success: true, userId: authData.user.id });
  } catch (err) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;
  const { error } = await supabaseAdmin.from("users").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  // Soft delete (désactivation)
  const { error } = await supabaseAdmin.from("users").update({ is_active: false }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}