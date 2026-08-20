import { useEffect } from 'react';
import { Navigate, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { authService } from '../../api/authService';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { initializeSync } from '@/api/syncInitializer';

export const AuthLayout = () => {
  const { token, user, isFetchingUser, fetchUser, clearAuth } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // 1. 页面挂载或刷新时，尝试静默获取用户信息
  useEffect(() => {
    let cancelled = false;

    const initializeAuthentication = async () => {
      await fetchUser();

      if (cancelled) return;
      const { token: currentToken } = useAuthStore.getState();

      if (currentToken ) {
        initializeSync();
      }
    };
    void initializeAuthentication();

    return () => {
      cancelled = true;
    }
  }, [fetchUser]);

  // 2. 拦截未登录用户
  if (!token) return <Navigate to="/login" replace />;

  // 3. 在拉取用户信息期间，显示全局加载状态（避免页面渲染一半突然被踢出去）
  if (isFetchingUser) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 space-y-4">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p>正在验证身份信息...</p>
      </div>
    );
  }

  const isActive = (path: string) => location.pathname === path ? 'text-white font-bold' : 'text-zinc-400';

  // 4. 真正安全的退出登录逻辑
  const handleLogout = async () => {
    try {
      // 通知后端销毁 Session / 将 Token 加入黑名单
      await authService.logout();
    } catch (error) {
      console.error('后端退出登出异常', error);
    } finally {
      // 无论后端是否成功，前端必须清空凭证并跳转
      clearAuth();
      toast.success('您已安全退出系统');
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col">
      {/* 顶部导航栏 */}
      <header className="h-16 border-b border-zinc-800 bg-zinc-950/50 flex items-center px-6 justify-between">
        <div className="flex items-center space-x-6">
          <span className="text-xl font-black tracking-tight text-indigo-500">AutoTest</span>
          <nav className="flex space-x-4">
            <Link to="/dashboard" className={`hover:text-white transition-colors ${isActive('/dashboard')}`} data-testid="nav-dashboard">控制台</Link>
            <Link to="/tasks" className={`hover:text-white transition-colors ${isActive('/tasks')}`} data-testid="nav-tasks">任务管理</Link>
            <Link to="/files" className={`hover:text-white transition-colors ${isActive('/files')}`} data-testid="nav-files">文件管理</Link>
            <Link to="/reports" className={`hover:text-white transition-colors ${isActive('/reports')}`} data-testid="nav-reports">报表历史</Link>
            <Link to="/cards" className={`hover:text-white transition-colors ${isActive('/cards')}`} data-testid="nav-cards">卡片管理</Link>
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* 新增：展示当前拉取到的用户信息 */}
          <div className="text-sm text-right mr-2 hidden md:block">
            <p className="font-medium text-zinc-200">{user?.userName || '未知用户'}</p>
            <p className="text-xs text-zinc-500">{user?.role || 'User'}</p>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout} 
            className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800" 
            data-testid="btn-logout"
          >
            退出登录
          </Button>
        </div>
      </header>
      
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
};