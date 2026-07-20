import { useEffect, useState } from 'react';
import { taskService } from '../api/taskService';
import type { ReportResponse } from '../api/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { toast } from 'sonner';
import { FileText, Eye, Clock, Plus, Timer } from 'lucide-react';

export const ReportHistory = () => {
  const [reports, setReports] = useState<ReportResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ====== 弹窗状态管理 ======
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  
  const [generateTitle, setGenerateTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [currentReport, setCurrentReport] = useState<ReportResponse | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // ====== 数据获取 ======
  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const data = await taskService.getReports();
      setReports(data || []);
    } catch (error) {
      toast.error('无法加载报表历史');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // ====== 交互逻辑 ======
  
  // 1. 发起生成请求（这里会触发后端 2-5 秒的随机延迟）
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await taskService.generateReport({ title: generateTitle });
      toast.success('报表生成成功！');
      setIsGenerateDialogOpen(false);
      fetchReports(); // 生成完后立刻刷新列表
    } catch (error) {
      toast.error('生成失败');
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. 查看详情请求
  const handleViewDetails = async (id: string) => {
    setIsDetailDialogOpen(true);
    setIsLoadingDetail(true);
    setCurrentReport(null);
    try {
      const data = await taskService.getReportById(id);
      setCurrentReport(data);
    } catch (error) {
      toast.error('获取报表详情失败');
      setIsDetailDialogOpen(false);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // ====== 时间格式化工具 (强制 UTC+08:00) ======
  const formatTime = (dateStr?: string, isFull = false) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    
    const utc8 = new Date(d.getTime() + 8 * 3600 * 1000);
    const YYYY = utc8.getUTCFullYear();
    const MM = String(utc8.getUTCMonth() + 1).padStart(2, '0');
    const DD = String(utc8.getUTCDate()).padStart(2, '0');
    const HH = String(utc8.getUTCHours()).padStart(2, '0');
    const mm = String(utc8.getUTCMinutes()).padStart(2, '0');
    const ss = String(utc8.getUTCSeconds()).padStart(2, '0');
    const sss = String(utc8.getUTCMilliseconds()).padStart(3, '0');

    if (isFull) return `${YYYY}-${MM}-${DD} ${HH}:${mm}:${ss}.${sss}`;
    return `${YYYY}-${MM}-${DD} ${HH}:${mm}:${ss}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-50">报表生成历史</h2>
          <p className="text-zinc-400 mt-2">点击生成报表可体验后端随机异步延迟响应。</p>
        </div>
        <Button 
          onClick={() => {
            setGenerateTitle('');
            setIsGenerateDialogOpen(true);
          }} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" /> 生成新报表
        </Button>
      </div>

      <div className="border border-zinc-800 rounded-md bg-zinc-900 flex flex-col">
        <div className="overflow-x-auto p-4">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">报表 ID</TableHead>
                <TableHead className="text-zinc-400">报表名称</TableHead>
                <TableHead className="text-zinc-400">生成状态</TableHead>
                <TableHead className="text-zinc-400">耗时 (ms)</TableHead>
                <TableHead className="text-zinc-400">生成时间</TableHead>
                <TableHead className="text-right text-zinc-400">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                 <TableRow><TableCell colSpan={6} className="text-center py-10 text-zinc-500">正在检索记录...</TableCell></TableRow>
              ) : reports.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-zinc-500">暂无报表记录，请点击右上角生成。</TableCell></TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report.id} className="border-zinc-800 hover:bg-zinc-800/50 whitespace-nowrap">
                    <TableCell className="font-medium text-zinc-400">{report.id?.substring(0, 8)}</TableCell>
                    <TableCell className="text-zinc-200">
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-2 text-indigo-400" />
                        {report.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-600/20 text-emerald-500 border-emerald-600/30">
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      <div className="flex items-center">
                        <Timer className="w-4 h-4 mr-1 text-zinc-500" />
                        {report.durationMs}
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-400 cursor-help" title={formatTime(report.createdAt, true)}>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1 text-zinc-500" />
                        {formatTime(report.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" size="sm" 
                        className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800" 
                        onClick={() => handleViewDetails(report.id!)}
                      >
                        <Eye className="w-4 h-4 mr-1" /> 查看详情
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ====== 弹窗 1：生成新报表 ====== */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>生成新报表</DialogTitle>
            <DialogDescription className="text-zinc-400">
              后端接口设置了 2000 - 5000 毫秒的随机延迟，用于测试 UI 的异步等待状态。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="generateTitle" className="text-zinc-300">自定义报表标题 (选填)</Label>
              <Input 
                id="generateTitle" 
                value={generateTitle} 
                onChange={(e) => setGenerateTitle(e.target.value)} 
                placeholder="例如：2026年Q3性能测试报告"
                className="bg-zinc-800 border-zinc-700 text-zinc-100" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)} disabled={isGenerating} className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">取消</Button>
            <Button onClick={handleGenerate} disabled={isGenerating} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {isGenerating ? '后端处理中...' : '开始生成'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====== 弹窗 2：查看报表详情 ====== */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>报表执行详情</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isLoadingDetail ? (
              <div className="text-center py-6 text-zinc-500">正在拉取报表数据...</div>
            ) : currentReport ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-800/50 p-3 rounded-md border border-zinc-800">
                    <p className="text-xs text-zinc-500 mb-1">报表名称</p>
                    <p className="text-sm text-zinc-200 font-medium">{currentReport.title}</p>
                  </div>
                  <div className="bg-zinc-800/50 p-3 rounded-md border border-zinc-800">
                    <p className="text-xs text-zinc-500 mb-1">执行耗时</p>
                    <p className="text-sm text-zinc-200 font-medium">{currentReport.durationMs} ms</p>
                  </div>
                </div>
                <div className="bg-zinc-800/50 p-3 rounded-md border border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-1">系统生成总结 (Summary)</p>
                  <p className="text-sm text-indigo-300 tracking-wide font-mono leading-relaxed">
                    {currentReport.summary}
                  </p>
                </div>
                <div className="bg-zinc-800/50 p-3 rounded-md border border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-1">生成时间 (UTC+08:00)</p>
                  <p className="text-sm text-zinc-400">{formatTime(currentReport.createdAt, true)}</p>
                </div>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsDetailDialogOpen(false)} className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200">
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};