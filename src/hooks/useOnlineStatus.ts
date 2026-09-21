import { useEffect, useState } from 'react';
import { Logger } from '../services/logger';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      Logger.info('NETWORK_ONLINE', 'Network connection re-established. Running in local mode with live connectivity.');
    };

    const handleOffline = () => {
      setIsOnline(false);
      Logger.warn('NETWORK_OFFLINE', 'Device went offline. Full offline mode active: all edits are saved locally.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
