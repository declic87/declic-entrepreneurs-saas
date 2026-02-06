import { createBrowserClient } from "@supabase/ssr";

/**
 * Initialisation sécurisée du client Supabase.
 * On vérifie la présence des clés pour éviter de faire planter le build Vercel.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Si les clés sont absentes (pendant le build), on évite le crash
  if (!url || !anonKey) {
    // On retourne un objet vide typé pour ne pas bloquer la compilation
    return {} as any;
  }

  return createBrowserClient(url, anonKey);
}

// Types pour l'authentification et les rôles
export type DBUserRole = "ADMIN" | "HOS" | "CLOSER" | "SETTER" | "EXPERT" | "CLIENT";

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  role: DBUserRole;
  uiRole: string; 
  avatar?: string;
};

/**
 * Helper : Convertit le rôle de la base de données en clé de menu pour la Sidebar
 */
export function mapRoleToUI(dbRole: DBUserRole): string {
  const mapping: Record<DBUserRole, string> = {
    ADMIN: "admin",
    HOS: "admin",       
    CLOSER: "commercial",
    SETTER: "commercial",
    EXPERT: "expert",
    CLIENT: "client",
  };
  return mapping[dbRole] || "client";
}

/**
 * Récupère l'utilisateur courant avec ses données de profil
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = createClient();
  
  // Si le client n'est pas initialisé (cas du build), on sort proprement
  if (!supabase.auth) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

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
  if (supabase.auth) await supabase.auth.signOut();
}

/**
 * Connexion par email/password
 */
export async function signIn(email: string, password: string) {
  const supabase = createClient();
  if (!supabase.auth) throw new Error("Client non initialisé");
  
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
  if (!supabase.auth) throw new Error("Client non initialisé");

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