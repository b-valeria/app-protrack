import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (!user && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (!user) return response;

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .single();

  if (pathname.startsWith("/auth") || pathname === "/") {
    if (profile?.rol === "Director General") {
      return NextResponse.redirect(new URL("/dashboard/director", request.url));
    }

    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (profile?.rol === "Director General" && pathname === "/dashboard") {
    return NextResponse.redirect(new URL("/dashboard/director", request.url));
  }

  if (
    profile?.rol !== "Director General" &&
    pathname.startsWith("/dashboard/director")
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}
