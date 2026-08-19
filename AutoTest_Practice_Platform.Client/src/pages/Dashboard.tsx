import { useState } from 'react';
import { taskService } from '../api/taskService';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export const Dashboard = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  // 测试靶点 1：Flaky API (模拟不稳定环境)
  const handleTestFlaky = async () => {
    try {
      await taskService.triggerFlakyTask();
      toast.success('幸运！这次 Flaky 接口请求成功了 (返回 200)');
    } catch (error) {
      toast.error('捕获到 Flaky 接口的 500 错误！(你的自动化脚本准备好重试了吗？)');
    }
  };

  // 测试靶点 2：长耗时 API (模拟复杂报表生成)
  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);
      toast.info('正在生成报表，这可能需要几秒钟...');
      await taskService.generateReport({ title: '2026 Q3 自动化测试报告' });
      toast.success('报表生成完毕！');
    } catch (error) {
      toast.error('报表生成失败');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">测试控制台 (Dashboard)</h2>
        <p className="text-zinc-400 mt-2">欢迎来到 AutoTest 靶场，这里包含各种异常场景供脚本挑战。</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>稳定性测试靶点 (Flaky API)</CardTitle>
            <CardDescription>
              此接口有 20% 的概率返回 500 错误，用于训练自动化框架的 Retry 机制。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              onClick={handleTestFlaky}
              data-testid="btn-flaky-test"
            >
              发送不稳定请求
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>异步等待靶点 (Delayed API)</CardTitle>
            <CardDescription>
              此接口会随机阻塞 2-5 秒，用于训练 UI 测试的显式等待 (Wait-For) 和并发压测。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white" 
              onClick={handleGenerateReport}
              disabled={isGenerating}
              data-testid="btn-generate-report"
            >
              {isGenerating ? '处理中...' : '生成耗时报表'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};