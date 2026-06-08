// src/App.tsx
// Raíz de la app: provider de TanStack Query + portón de sesión.
// Si no hay sesión → LoginScreen. Si hay → stub (lo reemplaza el Home en Sem 2).

import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from './lib/supabase';
import { colors, fontFamily, fontSize, space, radius } from './lib/tokens';
import { LoginScreen } from './components/LoginScreen';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, gcTime: 5 * 60_000 } },
});

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sesión inicial
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    // Escuchar cambios de auth (login / logout). Esto NO es data fetching:
    // es un listener de eventos de auth, por eso va con useEffect y no con
    // TanStack Query.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {loading ? <Splash /> : session ? <LoggedInStub email={session.user.email ?? ''} /> : <LoginScreen />}
    </QueryClientProvider>
  );
}

function Splash() {
  return (
    <div style={{ fontFamily, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.bg, color: colors.ink4, fontSize: fontSize.body }}>
      Cargando…
    </div>
  );
}

function LoggedInStub({ email }: { email: string }) {
  return (
    <div style={{ fontFamily, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: space.md, background: colors.bg, color: colors.ink, padding: space.lg, textAlign: 'center' }}>
      <p style={{ fontSize: fontSize.body, margin: 0 }}>Estás dentro como {email}.</p>
      <p style={{ fontSize: fontSize.footnote, color: colors.ink4, margin: 0 }}>Auth y sesión andando. Acá va a ir el Home.</p>
      <button
        onClick={() => supabase.auth.signOut()}
        style={{ marginTop: space.sm, fontFamily, fontSize: fontSize.callout, fontWeight: 600, color: '#fff', background: colors.greenInk, border: 'none', borderRadius: radius.md, padding: `${space.sm}px ${space.lg}px`, cursor: 'pointer' }}
      >
        Cerrar sesión
      </button>
    </div>
  );
}
