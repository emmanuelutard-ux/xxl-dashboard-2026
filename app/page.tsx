import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export default async function Home() {
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    // We can't set cookies in a Server Component directly like this usually in middleware 
                    // but for reading user session it's fine.
                    // However, createServerClient requires these methods.
                    try {
                        // Optional: handle cookie setting if needed, though usually reserved for Actions/Middleware
                        // cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing user sessions.
                    }
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch User Role
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    const role = profile?.role || "client";

    if (role === "expert") {
        redirect("/agency/media-room");
    } else if (role === "agency") {
        redirect("/agency/media-room");
    } else {
        // Default to client
        redirect("/client/dashboard");
    }
}
