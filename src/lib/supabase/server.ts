import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "../env";

export type MiddlewareContext = {
  request: NextRequest;
  response: {
    current: NextResponse;
  };
};

export type RouteHandlerContext = {
  request: NextRequest;
  response: NextResponse;
};

type ServerClientContext = MiddlewareContext | RouteHandlerContext;

function isMiddlewareContext(
  context: ServerClientContext,
): context is MiddlewareContext {
  return "current" in context.response;
}

export async function createClient(context?: ServerClientContext) {
  if (context) {
    return createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll() {
            return context.request.cookies.getAll();
          },
          setAll(
            cookiesToSet: Array<{
              name: string;
              value: string;
              options: CookieOptions;
            }>,
            headers: Record<string, string>,
          ) {
            cookiesToSet.forEach(({ name, value }) => {
              context.request.cookies.set(name, value);
            });

            const response = isMiddlewareContext(context)
              ? NextResponse.next({
                  request: context.request,
                })
              : context.response;

            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });

            Object.entries(headers).forEach(([key, value]) => {
              response.headers.set(key, value);
            });

            if (isMiddlewareContext(context)) {
              context.response.current = response;
            }
          },
        },
      },
    );
  }

  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options: CookieOptions;
          }>,
          _headers: Record<string, string>,
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {}
        },
      },
    },
  );
}
