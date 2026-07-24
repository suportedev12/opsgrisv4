import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';

export function Login() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message.includes('Invalid login')
          ? 'Email ou senha incorretos.'
          : error.message);
        setLoading(false);
      }
    } else {
      if (!nome.trim()) {
        setError('Informe seu nome completo.');
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nome: nome.trim() } },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else if (data.user && !data.session) {
        setError('Conta criada! Faça login para continuar.');
        setMode('signin');
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f1923] px-4">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[#F47920]/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#F47920]/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo header */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
            <img src="/losung.png" alt="Lösung Express" className="h-11 w-auto object-contain" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">Sistema GRIS / Cadastro</h1>
            <p className="mt-0.5 text-xs text-gray-400">Torre de Controle — Lösung Express</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-xl">
          {/* Tabs */}
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
            <button
              onClick={() => { setMode('signin'); setError(''); }}
              className={`rounded-md py-2 text-sm font-semibold transition-all ${mode === 'signin' ? 'bg-[#F47920] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Entrar
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); }}
              className={`rounded-md py-2 text-sm font-semibold transition-all ${mode === 'signup' ? 'bg-[#F47920] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Cadastrar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-300">Nome completo</label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#F47920]/50 focus:outline-none focus:ring-1 focus:ring-[#F47920]/30"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-300">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#F47920]/50 focus:outline-none focus:ring-1 focus:ring-[#F47920]/30"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-300">Senha</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 pr-11 text-sm text-white placeholder-gray-500 focus:border-[#F47920]/50 focus:outline-none focus:ring-1 focus:ring-[#F47920]/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#F47920] py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#F47920]/20 transition-colors hover:bg-[#d96a15] disabled:opacity-60"
            >
              {loading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <ShieldCheck className="h-4 w-4" />}
              {mode === 'signin' ? 'Acessar Sistema' : 'Criar Conta'}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-gray-500">
            {mode === 'signin'
              ? 'Novo operador? Clique em "Cadastrar" para criar sua conta.'
              : 'Já tem conta? Clique em "Entrar" para acessar.'}
          </p>
        </div>

        <p className="mt-4 text-center text-[10px] text-gray-600">
          Acesso restrito a operadores autorizados. Löesung Express © {new Date().getFullYear()}.
        </p>
      </div>
    </div>
  );
}
