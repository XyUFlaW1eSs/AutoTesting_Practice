import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../api/authService';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export const Login = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  // 表单状态管理
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 登录提交逻辑
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // 阻止表单默认的刷新行为

    if (!identity || !password) {
      toast.warning('请输入账号和密码');
      return;
    }

    try {
      setIsLoading(true);
      // 调用我们在 authService.ts 中封装的接口
      const response = await authService.login({ identity, password });

      if (response.token) {
        // 1. 将 Token 和用户信息存入 Zustand 全局 Store
        // 注意：这里的 user 对象我们做了个简单的映射，后续你可以根据实际后端返回的结构调整
        setAuth(response);

        // 2. 弹出成功提示
        toast.success('登录成功，欢迎回来！');

        // 3. 跳转到受保护的看板页
        navigate('/dashboard', { replace: true });
      } else {
        toast.error('服务器未返回有效的 Token');
      }
    } catch (error: any) {
      // 这里的错误捕获会接管 axiosClient 中抛出的异常
      const errorMsg = error.response?.data?.message || '账号或密码错误，请重试';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center p-4">
      <Card className="w-full max-w-sm bg-zinc-900 border-zinc-800 text-zinc-100" data-testid="login-card">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl tracking-tight">AutoTest 靶场</CardTitle>
          <CardDescription className="text-zinc-400">
            请输入您的凭证进入系统
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identity">账号 / 邮箱</Label>
              <Input
                id="identity"
                type="text"
                placeholder="admin"
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
                disabled={isLoading}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 focus-visible:ring-zinc-500"
                data-testid="input-identity" // UI 自动化测试定位锚点
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">密码</Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 focus-visible:ring-zinc-500"
                data-testid="input-password" // UI 自动化测试定位锚点
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
              disabled={isLoading}
              data-testid="btn-submit" // UI 自动化测试定位锚点
            >
              {isLoading ? '登录中...' : '登录'}
            </Button>
            <div className="text-center text-sm text-zinc-400 mt-4">
              还没有账号？ <a href="/register" className="text-indigo-400 hover:text-indigo-300">立即注册</a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};