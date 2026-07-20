import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../api/authService';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export const Register = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !email || !password) {
      toast.warning('请填写所有必填项');
      return;
    }

    try {
      setIsLoading(true);
      const response = await authService.register({ userName, email, password });

      if (response.token) {
        setAuth(response);
        toast.success('注册成功，已自动为您登录');
        navigate('/dashboard', { replace: true });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || '注册失败，邮箱可能已被占用');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center p-4">
      <Card className="w-full max-w-sm bg-zinc-900 border-zinc-800 text-zinc-100" data-testid="register-card">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl tracking-tight">创建靶场账号</CardTitle>
          <CardDescription className="text-zinc-400">注册以进行您的自动化测试实践</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userName">用户名</Label>
              <Input
                id="userName" type="text" placeholder="Your Name"
                value={userName} onChange={(e) => setUserName(e.target.value)} disabled={isLoading}
                className="bg-zinc-800 border-zinc-700 text-zinc-100" data-testid="input-register-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">邮箱地址</Label>
              <Input
                id="email" type="email" placeholder="name@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading}
                className="bg-zinc-800 border-zinc-700 text-zinc-100" data-testid="input-register-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password" type="password" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading}
                className="bg-zinc-800 border-zinc-700 text-zinc-100" data-testid="input-register-password"
              />
            </div>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isLoading} data-testid="btn-register-submit">
              {isLoading ? '提交中...' : '注册并登录'}
            </Button>
          </form>
          <div className="text-center text-sm text-zinc-400 mt-4">
            已有账号？ <a href="/login" className="text-indigo-400 hover:text-indigo-300">返回登录</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};