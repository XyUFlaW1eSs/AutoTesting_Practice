import { useEffect, useState, useMemo } from 'react';
import { taskService } from '../api/taskService';
import { type TaskResponse, WorkTaskStatus, TaskPriority } from '../api/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Search, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale'; // 引入中文语言包
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
// 借用 shadcn 默认提供的类名合并工具 (确保你的项目中路径正确，通常在 lib/utils 里)
import { cn } from '../lib/utils';
import { TimePicker } from '../components/ui/TimePicker';

export const TaskList = () => {
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ====== 核心：新增搜索过滤状态 ======
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // 分页状态
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  // 排序状态 (针对当前页)
  const [sortConfig, setSortConfig] = useState<{ key: keyof TaskResponse, direction: 'asc' | 'desc' } | null>(null);

  // 弹窗状态
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    status: WorkTaskStatus | number;
    priority: TaskPriority | number;
    dueDate?: Date;
  }>({
    title: '',
    description: '',
    status: WorkTaskStatus.Todo,
    priority: TaskPriority.Medium,
    dueDate: new Date(),
  });

  // ====== 数据获取 (接入过滤参数) ======
  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, pageSize };
      
      if (keyword.trim()) params.keyword = keyword.trim();
      if (statusFilter !== 'all') params.status = Number(statusFilter);
      if (priorityFilter !== 'all') params.priority = Number(priorityFilter);

      const data = await taskService.getTasks(params);
      setTasks(data.items || []);
      setTotal(data.total || 0);
    } catch (error) {
      toast.error('获取任务列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 监听页码变化拉取数据
  useEffect(() => {
    fetchTasks();
  }, [page]);

  // 触发搜索时，重置回第一页
  const handleSearch = () => {
    if (page === 1) {
      fetchTasks();
    } else {
      setPage(1); // setPage 会触发 useEffect
    }
  };

  const handleReset = () => {
    setKeyword('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setPage(1);
    // 注意：React 状态更新是异步的，所以这里直接用默认值去查
    setTimeout(() => {
      fetchTasks();
    }, 0);
  };

  // ====== 排序逻辑 ======
  const handleSort = (key: keyof TaskResponse) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedTasks = useMemo(() => {
    let sortableItems = [...tasks];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key]?.toString().toLowerCase() || '';
        const valB = b[sortConfig.key]?.toString().toLowerCase() || '';
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [tasks, sortConfig]);

  // ====== 格式化辅助 ======
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
    return `${YYYY}-${MM}-${DD} ${HH}:${mm}`;
  };

  const renderStatusBadge = (status?: number) => {
    switch (status) {
      case WorkTaskStatus.Todo: return <Badge variant="secondary">待办</Badge>;
      case WorkTaskStatus.InProgress: return <Badge className="bg-blue-600">进行中</Badge>;
      case WorkTaskStatus.Done: return <Badge className="bg-green-600">已完成</Badge>;
      case WorkTaskStatus.Blocked: return <Badge className="bg-green-600">阻塞中</Badge>;
      default: return <Badge variant="destructive">已取消</Badge>;
    }
  };

  const renderPriorityBadge = (priority?: number) => {
    switch (priority) {
      case TaskPriority.Low: return <span className="text-zinc-500">低</span>;
      case TaskPriority.Medium: return <span className="text-blue-400">中</span>;
      case TaskPriority.High: return <span className="text-orange-400 font-bold">高</span>;
      case TaskPriority.Urgent: return <span className="text-red-500 font-bold">紧急</span>;
      default: return '-';
    }
  };

  // ====== 交互操作 ======
  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除这个任务吗？')) return;
    try {
      await taskService.deleteTask(id);
      toast.success('删除成功');
      fetchTasks();
    } catch (error) { toast.error('删除失败'); }
  };

  const openCreateDialog = () => {
    setEditingId(null);
    setFormData({ title: '', description: '', status: WorkTaskStatus.Todo, priority: TaskPriority.Medium,dueDate: new Date() });
    setIsDialogOpen(true);
  };

  const openEditDialog = (task: TaskResponse) => {
    setEditingId(task.id!);
    setFormData(
      {
        title: task.title || '',
        description: task.description || '',
        status: task.status ?? WorkTaskStatus.Todo,
        priority: task.priority ?? TaskPriority.Medium,
        dueDate: task.dueDate ? new Date(task.dueDate) : new Date()
      });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title) return toast.warning('标题不能为空');
    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        status: Number(formData.status) as WorkTaskStatus,
        priority: Number(formData.priority) as TaskPriority,
        dueDate: formData.dueDate ? formData.dueDate.toISOString() : new Date().toISOString(),
      };

      if (editingId) {
        await taskService.updateTask(editingId, payload);
        toast.success('任务已更新');
      } else {
        await taskService.createTask(payload);
        toast.success('新任务创建成功');
      }
      setIsDialogOpen(false);
      fetchTasks();
    } catch (error)
    { 
      toast.error(editingId ? '更新失败' : '创建失败');
    }
    finally { setIsSubmitting(false); }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-50">任务管理</h2>
          <p className="text-zinc-400 mt-2">支持多条件检索、服务端分页及精确时间格式化。</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200">
          + 新建任务
        </Button>
      </div>

      {/* 👇 新增的搜索过滤面板 👇 */}
      <div className="flex flex-wrap gap-4 items-center bg-zinc-900 p-4 border border-zinc-800 rounded-md">
        <div className="flex-1 min-w-[200px]">
          <Input 
            placeholder="搜索任务标题或描述..." 
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-zinc-100 focus-visible:ring-zinc-500"
            data-testid="search-keyword"
          />
        </div>
        
        <div className="w-[150px]">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100" data-testid="search-status">
              <SelectValue placeholder="所有状态" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-100">
              <SelectItem value="all">所有状态</SelectItem>
              <SelectItem value={WorkTaskStatus.Todo.toString()}>待办</SelectItem>
              <SelectItem value={WorkTaskStatus.InProgress.toString()}>进行中</SelectItem>
              <SelectItem value={WorkTaskStatus.Done.toString()}>已完成</SelectItem>
              <SelectItem value={WorkTaskStatus.Cancelled.toString()}>已取消</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-[150px]">
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100" data-testid="search-priority">
              <SelectValue placeholder="所有优先级" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-100">
              <SelectItem value="all">所有优先级</SelectItem>
              <SelectItem value={TaskPriority.Low.toString()}>低</SelectItem>
              <SelectItem value={TaskPriority.Medium.toString()}>中</SelectItem>
              <SelectItem value={TaskPriority.High.toString()}>高</SelectItem>
              <SelectItem value={TaskPriority.Urgent.toString()}>紧急</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex space-x-2">
          <Button onClick={handleSearch} className="bg-indigo-600 hover:bg-indigo-700 text-white" data-testid="btn-search">
            <Search className="w-4 h-4 mr-2" /> 搜索
          </Button>
          <Button onClick={handleReset} variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800" data-testid="btn-reset">
            <RotateCcw className="w-4 h-4 mr-2" /> 重置
          </Button>
        </div>
      </div>

      <div className="border border-zinc-800 rounded-md bg-zinc-900 flex flex-col">
        <div className="overflow-x-auto p-4">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent whitespace-nowrap">
                <TableHead className="w-[80px] text-zinc-400">ID</TableHead>
                <TableHead 
                  className="text-zinc-400 cursor-pointer hover:text-zinc-200 transition-colors select-none group"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center space-x-1">
                    <span>任务标题</span>
                    <span className="text-zinc-600 group-hover:text-zinc-400">
                      {sortConfig?.key === 'title' ? (
                        sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4" />
                      )}
                    </span>
                  </div>
                </TableHead>
                <TableHead className="text-zinc-400">状态</TableHead>
                <TableHead className="text-zinc-400">优先级</TableHead>
                <TableHead className="text-zinc-400">到期时间</TableHead>
                <TableHead className="text-zinc-400">创建时间</TableHead>
                <TableHead className="text-zinc-400">更新时间</TableHead>
                <TableHead className="text-right text-zinc-400 sticky right-0 bg-zinc-900">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={idx} className="border-zinc-800"><TableCell colSpan={8}><Skeleton className="h-6 w-full bg-zinc-800" /></TableCell></TableRow>
                ))
              ) : sortedTasks.length === 0 ? (
                <TableRow className="border-zinc-800"><TableCell colSpan={8} className="h-24 text-center text-zinc-500">没有找到符合条件的任务</TableCell></TableRow>
              ) : (
                sortedTasks.map((task) => (
                  <TableRow key={task.id} className="border-zinc-800 hover:bg-zinc-800/50 whitespace-nowrap">
                    <TableCell className="font-medium text-zinc-300">{task.id?.substring(0, 8)}</TableCell>
                    <TableCell className="text-zinc-200">{task.title}</TableCell>
                    <TableCell>{renderStatusBadge(task.status)}</TableCell>
                    <TableCell>{renderPriorityBadge(task.priority)}</TableCell>
                    <TableCell className="text-zinc-400 cursor-help" title={formatTime(task.dueDate, true)}>{formatTime(task.dueDate)}</TableCell>
                    <TableCell className="text-zinc-400 cursor-help" title={formatTime(task.createdAt, true)}>{formatTime(task.createdAt)}</TableCell>
                    <TableCell className="text-zinc-400 cursor-help" title={formatTime(task.updatedAt, true)}>{formatTime(task.updatedAt)}</TableCell>
                    <TableCell className="text-right space-x-2 sticky right-0 bg-zinc-900 shadow-[-10px_0_10px_-10px_rgba(0,0,0,0.5)]">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(task)} className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">编辑</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(task.id!)} className="text-white bg-red-600 hover:bg-red-700">删除</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800">
          <div className="text-sm text-zinc-400">
            共 <span className="text-zinc-200 font-medium">{total}</span> 条记录
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-zinc-400">
              第 <span className="text-zinc-200 font-medium">{page}</span> / {totalPages === 0 ? 1 : totalPages} 页
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || isLoading}
                className="w-8 h-8 p-0 border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800"
              ><ChevronLeft className="w-4 h-4" /></Button>
              <Button 
                variant="outline" size="icon" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0 || isLoading}
                className="w-8 h-8 p-0 border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800"
              ><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingId ? '编辑任务' : '创建新任务'}</DialogTitle>
            <DialogDescription className="text-zinc-400">请填写任务的核心信息，完成后点击保存。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-zinc-300">任务标题 <span className="text-red-500">*</span></Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="bg-zinc-800 border-zinc-700 text-zinc-100" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-zinc-300">详细描述</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="bg-zinc-800 border-zinc-700 text-zinc-100 resize-none" rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">状态</Label>
                <Select
                  value={formData.status.toString()}
                  onValueChange={(v) => setFormData({ ...formData, status: Number(v) })}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-100">
                    <SelectItem value={WorkTaskStatus.Todo.toString()}>待办</SelectItem>
                    <SelectItem value={WorkTaskStatus.InProgress.toString()}>进行中</SelectItem>
                    <SelectItem value={WorkTaskStatus.Done.toString()}>已完成</SelectItem>
                    <SelectItem value={WorkTaskStatus.Cancelled.toString()}>已取消</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">优先级</Label>
                <Select
                  value={formData.priority.toString()}
                  onValueChange={(v) => setFormData({ ...formData, priority: Number(v) })}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-100">
                    <SelectItem value={TaskPriority.Low.toString()}>低</SelectItem>
                    <SelectItem value={TaskPriority.Medium.toString()}>中</SelectItem>
                    <SelectItem value={TaskPriority.High.toString()}>高</SelectItem>
                    <SelectItem value={TaskPriority.Urgent.toString()}>紧急</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2 flex flex-col">
              <Label className="text-zinc-300">到期时间</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-zinc-800 border-zinc-700 text-zinc-100 hover:bg-zinc-700 hover:text-white",
                      !formData.dueDate && "text-zinc-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dueDate
                      ? format(formData.dueDate, "yyyy-MM-dd HH:mm", { locale: zhCN })
                      : <span>选择日期和时间...</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.dueDate}
                    onSelect={(date) => {
                      // 逻辑：如果之前没时间，默认设为当前的小时分钟；如果已有，保留小时分钟
                      const newDate = date ? new Date(date) : undefined;
                      if (newDate && formData.dueDate) {
                        newDate.setHours(formData.dueDate.getHours());
                        newDate.setMinutes(formData.dueDate.getMinutes());
                      }
                      setFormData({ ...formData, dueDate: newDate });
                    }}
                    className="text-zinc-100"
                  />
                  {/* 嵌入时间选择器 */}
                  <TimePicker
                    date={formData.dueDate}
                    onChange={(d) => setFormData({ ...formData, dueDate: d })}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">取消</Button>
            <Button onClick={handleSave} disabled={isSubmitting} className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200">{isSubmitting ? '保存中...' : '确认保存'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};