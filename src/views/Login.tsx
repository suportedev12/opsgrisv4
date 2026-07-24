import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message.includes('Invalid login')
        ? 'Email ou senha incorretos.'
        : error.message);
      setLoading(false);
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
        <div className="mb-8 flex flex-col items-center gap-4">
          <img
            src="/losung copy.png"
            alt="Lösung Express"
            className="h-16 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
          />
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">Sistema GRIS / Cadastro</h1>
            <p className="mt-0.5 text-xs text-gray-400">Torre de Controle — Lösung Express</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
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
              Acessar Sistema
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-[10px] text-gray-600">
          Acesso restrito a operadores autorizados. Lösung Express © {new Date().getFullYear()}.
        </p>
      </div>
    </div>
  );
}
