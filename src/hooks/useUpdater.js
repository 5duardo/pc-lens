import { useState, useEffect, useCallback } from 'react';

// Estados posibles: idle, checking, available, not-available, downloading, downloaded, error
export function useUpdater() {
  const [version, setVersion] = useState('');
  const [status, setStatus] = useState('idle');
  const [info, setInfo] = useState({});

  useEffect(() => {
    if (window.updater?.getVersion) {
      window.updater.getVersion().then(setVersion).catch(() => {});
    }
    if (!window.updater?.onStatus) return undefined;
    const cleanup = window.updater.onStatus((data) => {
      setStatus(data.status);
      setInfo(data);
    });
    return cleanup;
  }, []);

  const check = useCallback(async () => {
    if (!window.updater?.check) return;
    setStatus('checking');
    const res = await window.updater.check();
    if (!res?.ok) {
      setStatus('error');
      setInfo({ message: res?.reason || 'No se pudo comprobar' });
    }
  }, []);

  const download = useCallback(() => {
    window.updater?.download?.();
    setStatus('downloading');
    setInfo((i) => ({ ...i, percent: 0 }));
  }, []);

  const install = useCallback(() => {
    window.updater?.install?.();
  }, []);

  return { version, status, info, check, download, install };
}
