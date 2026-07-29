import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
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

    // Client with the caller's token to verify their identity
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Admin client with service role key (bypasses RLS)
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check if caller is a master admin
    const { data: profile } = await adminClient
      .from("atendentes")
      .select("is_master, is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.is_master) {
      return new Response(
        JSON.stringify({ error: "Apenas o administrador master pode realizar esta ação." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const { action, targetUserId } = body;

    if (action === "create_user") {
      const { email, password, nome } = body;
      if (!email || !password || !nome) {
        return new Response(
          JSON.stringify({ error: "Email, senha e nome são obrigatórios." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (password.length < 6) {
        return new Response(
          JSON.stringify({ error: "A senha deve ter no mínimo 6 caracteres." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nome },
      });
      if (createError) {
        return new Response(
          JSON.stringify({ error: createError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (newUser.user) {
        await adminClient
          .from("atendentes")
          .update({ must_change_password: true, nome })
          .eq("id", newUser.user.id);
      }
      return new Response(
        JSON.stringify({ success: true, userId: newUser.user?.id }),
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
      const { error: pwdError } = await adminClient.auth.admin.updateUserById(targetUserId, {
        password: new_password,
      });
      if (pwdError) {
        return new Response(
          JSON.stringify({ error: pwdError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      await adminClient
        .from("atendentes")
        .update({ must_change_password: true })
        .eq("id", targetUserId);
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
      const { error: emailError } = await adminClient.auth.admin.updateUserById(targetUserId, {
        email: new_email,
      });
      if (emailError) {
        return new Response(
          JSON.stringify({ error: emailError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      await adminClient
        .from("atendentes")
        .update({ email: new_email })
        .eq("id", targetUserId);
      return new Response(
        JSON.stringify({ success: true, message: "Email atualizado com sucesso." }),
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
      await adminClient
        .from("atendentes")
        .update({ nome: new_name.trim() })
        .eq("id", targetUserId);
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
      JSON.stringify({ error: err.message ?? "Erro interno do servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
