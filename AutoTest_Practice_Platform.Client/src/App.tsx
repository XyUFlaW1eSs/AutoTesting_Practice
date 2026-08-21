import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { Toaster } from './components/ui/sonner';
import { useEffect } from 'react';
import { NetworkStatus } from './components/NetworkStatus';
import { useNetworkStore } from './store/useNetworkStore';

function App() {
  const initializeNetwork = useNetworkStore((state) => state.initialize);

  useEffect(() => { return initializeNetwork(); }, [initializeNetwork]);

  return (
    <>
      <RouterProvider router={router} />
      <NetworkStatus />
      {/* 挂载全局弹窗，配置为暗黑主题优先 */}
      <Toaster theme="dark" position="top-center" />
    </>
  );
}

export default App;