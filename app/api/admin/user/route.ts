import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// On ne crée plus le client ici en haut (top-level) pour éviter le crash au build

export async function GET(request: Request) {
  // Initialisation à l'intérieur de la fonction
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*");

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    const body = await request.json();
    const { data, error } = await supabaseAdmin
      .from("users")
      .insert([body])
      .select();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}