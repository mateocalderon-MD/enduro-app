// src/App.tsx — Provider de TanStack Query + portón de sesión + portón de perfil.
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from './lib/supabase';
import { colors, fontFamily, fontSize } from './lib/tokens';
import { LoginScreen } from './components/LoginScreen';
import { Onboarding } from './components/Onboarding';
import { MainTabs } from './components/MainTabs';
import { useProfile } from './lib/queries';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, gcTime: 5 * 60_000 } },
});

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {loading ? <Splash /> : session ? <Autenticado userId={session.user.id} /> : <LoginScreen />}
    </QueryClientProvider>
  );
}

// Con sesión: si no hay perfil -> onboarding; si hay -> la app.
function Autenticado({ userId }: { userId: string }) {
  const { data: profile, isLoading } = useProfile(userId);
  if (isLoading) return <Splash />;
  if (!profile) return <Onboarding userId={userId} />;
  return <MainTabs userId={userId} />;
}

function Splash() {
  return (
    <div style={{ fontFamily, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.bg, color: colors.ink4, fontSize: fontSize.body }}>
      Cargando…
    </div>
  );
}
