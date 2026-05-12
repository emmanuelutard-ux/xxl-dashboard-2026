import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { pathname } = request.nextUrl;

  // Static assets and OAuth callbacks — bypass all checks
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/auth/") ||
    pathname.includes(".")
  ) {
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Root and main login — redirect authenticated users to their space
  if (pathname === "/" || pathname === "/login") {
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const role = profile?.role ?? "client";
      if (role === "client") {
        return NextResponse.redirect(new URL("/client", request.url));
      }
      return NextResponse.redirect(new URL("/agency", request.url));
    }
    return response;
  }

  // Client login page — always public
  if (pathname === "/client/login") {
    return response;
  }

  // Client space — require session + role === 'client'
  if (pathname === "/client" || pathname.startsWith("/client/")) {
    if (!user) {
      const loginUrl = new URL("/client/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "client") {
      return NextResponse.redirect(new URL("/agency", request.url));
    }

    return response;
  }

  // All other routes (agency, etc.) — require session
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
