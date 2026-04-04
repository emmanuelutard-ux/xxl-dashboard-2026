import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // If user is not logged in and trying to access protected routes, redirect to login
    if (!user && request.nextUrl.pathname !== "/login") {
        // Allow public assets and login
        if (request.nextUrl.pathname.startsWith("/_next") ||
            request.nextUrl.pathname.includes(".") ||
            request.nextUrl.pathname === "/") {
            return response;
        }
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // If user IS logged in
    if (user) {
        // Check if we are on the login page or root, we want to redirect to the dashboard
        const isAuthRoute = request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/";

        if (isAuthRoute) {
            // Fetch user profile to get the role
            // Note: In a real high-traffic app, we might store role in user_metadata to avoid this DB hit.
            // But per instructions, we fetch from 'profiles'.
            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();

            const role = profile?.role || "client"; // Default to client if unknown

            if (role === "client") {
                return NextResponse.redirect(new URL("/client/dashboard", request.url));
            } else if (role === "agency") {
                return NextResponse.redirect(new URL("/agency/media-room", request.url));
            } else if (role === "expert") {
                return NextResponse.redirect(new URL("/expert/cockpit", request.url));
            }
        }
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
