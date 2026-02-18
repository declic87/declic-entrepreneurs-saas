import { Sidebar } from "@/components/ui/Sidebar";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function HOSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  
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
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", session.user.id)
    .single();

  if (!profile || profile.role !== "HOS") {
    redirect("/auth/login");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        role="hos"
        userName={`${profile.first_name} ${profile.last_name}`}
        userEmail={profile.email}
      />
      <main className="flex-1 ml-64">{children}</main>
    </div>
  );
}