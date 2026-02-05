import { createBrowserClient } from "@supabase/ssr";

// Initialisation du client Supabase pour le Browser
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Types pour l'authentification et les rôles
// Ces rôles correspondent à ton enum Prisma/DB
export type DBUserRole = "ADMIN" | "HOS" | "CLOSER" | "SETTER" | "EXPERT" | "CLIENT";

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  role: DBUserRole;
  uiRole: string; // Le rôle formaté pour la Sidebar (admin, commercial, etc.)
  avatar?: string;
};

/**
 * Helper : Convertit le rôle de la base de données en clé de menu pour la Sidebar
 */
export function mapRoleToUI(dbRole: DBUserRole): string {
  const mapping: Record<DBUserRole, string> = {
    ADMIN: "admin",
    HOS: "admin",       // Head of Sales a les accès Admin
    CLOSER: "commercial",
    SETTER: "commercial",
    EXPERT: "expert",
    CLIENT: "client",
  };
  return mapping[dbRole] || "client";
}

/**
 * Récupère l'utilisateur courant avec ses données de profil (rôle, nom, etc.)
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = createClient();
  
  // 1. Vérifier la session active
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // 2. Récupérer les données étendues depuis la table 'users'
  const { data: userData, error } = await supabase
    .from("users")
    .select("name, role, avatar")
    .eq("id", user.id)
    .single();

  if (error || !userData) {
    console.error("Erreur lors de la récupération du profil utilisateur:", error);
    return null;
  }

  return {
    id: user.id,
    email: user.email!,
    name: userData.name,
    role: userData.role as DBUserRole,
    uiRole: mapRoleToUI(userData.role as DBUserRole),
    avatar: userData.avatar,
  };
}

/**
 * Déconnexion
 */
export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}

/**
 * Connexion par email/password
 */
export async function signIn(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Inscription (SignUp)
 */
export async function signUp(email: string, password: string, name: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  if (error) throw error;
  return data;
}