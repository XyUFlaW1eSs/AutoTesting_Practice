import { WifiOff } from 'lucide-react';
import { useNetworkStore } from '@/store/useNetworkStore';

export const NetworkStatus = () => {
  const isOnline = useNetworkStore((state) => state.isOnline);

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full border border-amber-500/30 bg-zinc-900 px-4 py-2 text-sm text-amber-400 shadow-lg">
      <div className="flex items-center gap-2">
        <WifiOff className="h-4 w-4" />
        <span>当前处于离线模式</span>
      </div>
    </div>
  );
};