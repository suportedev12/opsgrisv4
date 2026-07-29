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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verify the caller is authenticated
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

    // Check if caller is admin or master
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
    const callerProfile = profileData?.[0];
    if (!callerProfile?.is_master && !callerProfile?.is_admin) {
      return new Response(
        JSON.stringify({ error: "Apenas administradores podem realizar esta ação." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const { action, targetUserId } = body;

    if (action === "create_user") {
      const { new_email, new_password, new_name } = body;
      if (!new_email || !new_email.includes("@")) {
        return new Response(
          JSON.stringify({ error: "Email inválido." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (!new_password || new_password.length < 6) {
        return new Response(
          JSON.stringify({ error: "A senha deve ter no mínimo 6 caracteres." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Create auth user with email already confirmed
      const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: "POST",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: new_email,
          password: new_password,
          email_confirm: true,
          user_metadata: { nome: new_name ?? "" },
        }),
      });
      if (!createRes.ok) {
        const err = await createRes.json();
        return new Response(
          JSON.stringify({ error: err.message ?? "Erro ao criar usuário." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const created = await createRes.json();

      if (created.id) {
        // Upsert row in atendentes — handles both trigger-created and missing rows
        await fetch(`${supabaseUrl}/rest/v1/atendentes`, {
          method: "POST",
          headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates",
          },
          body: JSON.stringify({
            id: created.id,
            nome: new_name ?? "",
            email: new_email,
            is_admin: false,
            is_master: false,
            active: true,
            can_add_checklist: true,
            can_add_cadastro: true,
            can_view_dashboard: false,
            can_manage_users: false,
            must_change_password: true,
          }),
        });
      }

      return new Response(
        JSON.stringify({ success: true, message: "Operador criado com sucesso. Email já confirmado." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "reset_password") {
      const { new_password } = body;
      if (!new_password || new_password.length < 6) {
        return new Response(
          JSON.stringify({ error: "A senha deve ter no mínimo 6 caracteres." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const updateRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${targetUserId}`, {
        method: "PUT",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: new_password }),
      });
      if (!updateRes.ok) {
        const err = await updateRes.json();
        return new Response(
          JSON.stringify({ error: err.message ?? "Erro ao alterar senha." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      await fetch(`${supabaseUrl}/rest/v1/atendentes?id=eq.${targetUserId}`, {
        method: "PATCH",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ must_change_password: true }),
      });
      return new Response(
        JSON.stringify({ success: true, message: "Senha alterada. Usuário deverá alterá-la no próximo login." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "update_email") {
      const { new_email } = body;
      if (!new_email || !new_email.includes("@")) {
        return new Response(
          JSON.stringify({ error: "Email inválido." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const updateRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${targetUserId}`, {
        method: "PUT",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: new_email }),
      });
      if (!updateRes.ok) {
        const err = await updateRes.json();
        return new Response(
          JSON.stringify({ error: err.message ?? "Erro ao alterar email." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      await fetch(`${supabaseUrl}/rest/v1/atendentes?id=eq.${targetUserId}`, {
        method: "PATCH",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: new_email }),
      });
      return new Response(
        JSON.stringify({ success: true, message: "Email atualizado com sucesso." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "confirm_email") {
      const updateRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${targetUserId}`, {
        method: "PUT",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email_confirm: true }),
      });
      if (!updateRes.ok) {
        const err = await updateRes.json();
        return new Response(
          JSON.stringify({ error: err.message ?? "Erro ao confirmar email." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({ success: true, message: "Email confirmado com sucesso." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "force_password_change") {
      await fetch(`${supabaseUrl}/rest/v1/atendentes?id=eq.${targetUserId}`, {
        method: "PATCH",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ must_change_password: true }),
      });
      return new Response(
        JSON.stringify({ success: true, message: "Usuário deverá criar uma nova senha no próximo login." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "update_name") {
      const { new_name } = body;
      if (!new_name || !new_name.trim()) {
        return new Response(
          JSON.stringify({ error: "Nome inválido." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      await fetch(`${supabaseUrl}/rest/v1/atendentes?id=eq.${targetUserId}`, {
        method: "PATCH",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nome: new_name.trim() }),
      });
      return new Response(
        JSON.stringify({ success: true, message: "Nome atualizado com sucesso." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: "Ação inválida." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message ?? "Erro interno do servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
