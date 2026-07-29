import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, AlertCircle, ShieldCheck, Loader2, Lock } from 'lucide-react';

interface Props {
  userName: string;
  onDone: () => void;
}

export function ForcePasswordChange({ userName, onDone }: Props) {
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPwd.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (newPwd !== confirmPwd) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    const { error: updErr } = await supabase.auth.updateUser({ password: newPwd });
    if (updErr) {
      setError(updErr.message);
      setLoading(false);
      return;
    }

    const { data: user } = await supabase.auth.getUser();
    if (user.data.user) {
      await supabase
        .from('atendentes')
        .update({ must_change_password: false })
        .eq('id', user.data.user.id);
    }

    setLoading(false);
    onDone();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f1923] px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[#F47920]/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#F47920]/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-4">
          <img src="/losung copy.png" alt="Lösung Express" className="h-16 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]" />
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">Troca de Senha Obrigatória</h1>
            <p className="mt-0.5 text-xs text-gray-400">Olá, {userName}. Por segurança, defina uma nova senha.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-300">
            <Lock className="h-4 w-4 shrink-0" />
            <span>Esta é sua primeira tentativa de login. Você deve criar uma nova senha para continuar.</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-300">Nova Senha</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  value={newPwd}
                  onChange={e => setNewPwd(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 pr-11 text-sm text-white placeholder-gray-500 focus:border-[#F47920]/50 focus:outline-none focus:ring-1 focus:ring-[#F47920]/30"
                />
                <button type="button" onClick={() => setShowPwd(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-300">Confirmar Senha</label>
              <input
                type={showPwd ? 'text' : 'password'}
                required
                value={confirmPwd}
                onChange={e => setConfirmPwd(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#F47920]/50 focus:outline-none focus:ring-1 focus:ring-[#F47920]/30"
              />
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
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Definir Nova Senha
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-[10px] text-gray-600">Lösung Express © {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}
