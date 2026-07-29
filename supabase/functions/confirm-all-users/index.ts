import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verify the caller is authenticated and is a master admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const meRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: authHeader, apikey: serviceRoleKey },
    });
    if (!meRes.ok) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const me = await meRes.json();

    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/atendentes?id=eq.${me.id}&select=is_master,is_admin`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
      },
    );
    const profileData = await profileRes.json();
    const profile = profileData?.[0];
    if (!profile?.is_master && !profile?.is_admin) {
      return new Response(
        JSON.stringify({ error: "Apenas administradores podem realizar esta ação." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // List all users via Admin API (page through if needed)
    const confirmed: string[] = [];
    let page = 1;
    const perPage = 1000;
    let hasMore = true;

    while (hasMore) {
      const listRes = await fetch(
        `${supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
        {
          headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (!listRes.ok) {
        const err = await listRes.json();
        return new Response(
          JSON.stringify({ error: err.message ?? "Erro ao listar usuários." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const listData = await listRes.json();
      const users = listData.users ?? [];
      if (users.length === 0) { hasMore = false; break; }

      for (const user of users) {
        if (!user.email_confirmed_at) {
          // Confirm the user's email via Admin API
          const updateRes = await fetch(
            `${supabaseUrl}/auth/v1/admin/users/${user.id}`,
            {
              method: "PUT",
              headers: {
                apikey: serviceRoleKey,
                Authorization: `Bearer ${serviceRoleKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ email_confirm: true }),
            },
          );
          if (updateRes.ok) {
            confirmed.push(user.email ?? user.id);
          }
        }
      }

      if (users.length < perPage) hasMore = false;
      else page++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        confirmed_count: confirmed.length,
        confirmed_emails: confirmed,
        message: confirmed.length === 0
          ? "Todos os usuários já têm email confirmado."
          : `${confirmed.length} email(s) confirmado(s) com sucesso.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message ?? "Erro interno do servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
