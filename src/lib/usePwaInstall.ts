// src/lib/usePwaInstall.ts — Estado de instalación como app.
// Android/Chrome: captura el prompt nativo. iOS: detecta para mostrar instrucciones manuales.
import { useEffect, useState } from 'react';

export function usePwaInstall() {
  const [deferred, setDeferred] = useState<any>(null);
  const [yaInstalada, setYaInstalada] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;
    setYaInstalada(standalone);

    const onPrompt = (e: Event) => { e.preventDefault(); setDeferred(e); };
    const onInstalled = () => { setYaInstalada(true); setDeferred(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const esIOS = /iphone|ipad|ipod/i.test(ua) && !(window as any).MSStream;

  async function instalar(): Promise<boolean> {
    if (!deferred) return false;
    deferred.prompt();
    const res = await deferred.userChoice;
    setDeferred(null);
    return res?.outcome === 'accepted';
  }

  return { instalable: !!deferred, esIOS, yaInstalada, instalar };
}
