import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { Toaster } from './components/ui/sonner';

function App() {
  return (
    <>
      <RouterProvider router={router} />
      {/* 挂载全局弹窗，配置为暗黑主题优先 */}
      <Toaster theme="dark" position="top-center" />
    </>
  );
}

export default App;