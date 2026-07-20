import { useEffect, useState, useMemo } from 'react';
import { resourceService } from '../api/resourceService';
import { type ResourceResponse, ResourceStatus } from '../api/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { toast } from 'sonner';
import { Server, Search, RotateCcw, Link2, Hash } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export const ResourceList = () => {
  const [resources, setResources] = useState<ResourceResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 获取当前用户信息
  const user = useAuthStore((state) => state.user);

  // 搜索过滤状态
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 弹窗表单状态
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // 表单数据，将 Tags 暂时存为字符串，方便用户用逗号输入
  const [formData, setFormData] = useState<{
    name: string;
    type: string;
    url: string;
    status: ResourceStatus | number;
    tags: string; 
    ownerId: string;
  }>({
    name: '', type: '', url: '', status: ResourceStatus.Available, tags: '', ownerId: ''
  });

  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (typeFilter.trim()) params.type = typeFilter.trim();
      if (statusFilter !== 'all') params.status = Number(statusFilter);

      const data = await resourceService.getResources(params);
      setResources(data || []);
    } catch (error) {
      toast.error('获取资源列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleReset = () => {
    setTypeFilter('');
    setStatusFilter('all');
    setTimeout(() => fetchResources(), 0);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除这个资源吗？此操作不可恢复。')) return;
    try {
      await resourceService.deleteResource(id);
      toast.success('删除成功');
      fetchResources();
    } catch (error) { toast.error('删除失败'); }
  };

  const openCreateDialog = () => {
    setEditingId(null);
    setFormData({ name: '', type: '', url: '', status: ResourceStatus.Available, tags: '', ownerId: user?.id || '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (resource: ResourceResponse) => {
    setEditingId(resource.id!);
    setFormData({
      name: resource.name || '',
      type: resource.type || '',
      url: resource.url || '',
      status: resource.status ?? ResourceStatus.Available,
      tags: resource.tags || '',
      ownerId: resource.ownerId || ''
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) return toast.warning('资源名称不能为空');
    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        status: Number(formData.status) as ResourceStatus,
        type: formData.type,
        url: formData.url,
        ownerId: formData.ownerId,
        tags: formData.tags.trim()
      };

      if (editingId) {
        await resourceService.updateResource(editingId, payload);
        toast.success('资源已更新');
      } else {
        await resourceService.createResource(payload);
        toast.success('新资源创建成功');
      }
      setIsDialogOpen(false);
      fetchResources();
    } catch (error) { toast.error(editingId ? '更新失败' : '创建失败'); } 
    finally { setIsSubmitting(false); }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    const utc8 = new Date(d.getTime() + 8 * 3600 * 1000);
    return `${utc8.getUTCFullYear()}-${String(utc8.getUTCMonth() + 1).padStart(2, '0')}-${String(utc8.getUTCDate()).padStart(2, '0')} ${String(utc8.getUTCHours()).padStart(2, '0')}:${String(utc8.getUTCMinutes()).padStart(2, '0')}`;
  };

  const renderStatusBadge = (status?: number) => {
    switch (status) {
      case ResourceStatus.Available: return <Badge className="bg-emerald-600">可用</Badge>;
      case ResourceStatus.InUse: return <Badge className="bg-blue-600">使用中</Badge>;
      case ResourceStatus.Maintenance: return <Badge className="bg-orange-600">维护中</Badge>;
      case ResourceStatus.Offline: return <Badge variant="destructive">离线</Badge>;
      default: return <Badge variant="outline">未知</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-50">测试资源管理</h2>
          <p className="text-zinc-400 mt-2">集中管理测试环境、设备、账号等各类资源资产。</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200">
          + 登记资源
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 items-center bg-zinc-900 p-4 border border-zinc-800 rounded-md">
        <div className="flex-1 min-w-[200px]">
          <Input 
            placeholder="输入资源类型 (如：VM, Database, API)" 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-zinc-100"
          />
        </div>
        
        <div className="w-[180px]">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
              <SelectValue placeholder="全部状态" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-100">
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value={ResourceStatus.Available.toString()}>可用</SelectItem>
              <SelectItem value={ResourceStatus.InUse.toString()}>使用中</SelectItem>
              <SelectItem value={ResourceStatus.Maintenance.toString()}>维护中</SelectItem>
              <SelectItem value={ResourceStatus.Offline.toString()}>离线</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex space-x-2">
          <Button onClick={fetchResources} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Search className="w-4 h-4 mr-2" /> 搜索
          </Button>
          <Button onClick={handleReset} variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">
            <RotateCcw className="w-4 h-4 mr-2" /> 重置
          </Button>
        </div>
      </div>

      <div className="border border-zinc-800 rounded-md bg-zinc-900 overflow-hidden">
        <div className="overflow-x-auto p-4">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent whitespace-nowrap">
                <TableHead className="w-[80px] text-zinc-400">ID</TableHead>
                <TableHead className="text-zinc-400">资源名称</TableHead>
                <TableHead className="text-zinc-400">类型</TableHead>
                <TableHead className="text-zinc-400">状态</TableHead>
                <TableHead className="text-zinc-400">标签</TableHead>
                <TableHead className="text-zinc-400">链接信息</TableHead>
                <TableHead className="text-zinc-400">最近更新</TableHead>
                <TableHead className="text-right text-zinc-400 sticky right-0 bg-zinc-900">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <TableRow key={idx} className="border-zinc-800"><TableCell colSpan={8}><Skeleton className="h-6 w-full bg-zinc-800" /></TableCell></TableRow>
                ))
              ) : resources.length === 0 ? (
                <TableRow className="border-zinc-800"><TableCell colSpan={8} className="h-24 text-center text-zinc-500">没有找到符合条件的资源</TableCell></TableRow>
              ) : (
                resources.map((res) => (
                  <TableRow key={res.id} className="border-zinc-800 hover:bg-zinc-800/50 whitespace-nowrap">
                    <TableCell className="font-medium text-zinc-400">{res.id?.substring(0, 8)}</TableCell>
                    <TableCell className="text-zinc-200">
                      <div className="flex items-center">
                        <Server className="w-4 h-4 mr-2 text-indigo-400" />
                        {res.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-300">{res.type || '-'}</TableCell>
                    <TableCell>{renderStatusBadge(res.status)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {res.tags ? res.tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
                          <Badge key={tag} variant="secondary" className="bg-zinc-800 text-zinc-300">{tag}</Badge>
                        )) : '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {res.url ? (
                        <a href={res.url} target="_blank" rel="noreferrer" className="flex items-center text-indigo-400 hover:underline" title={res.url}>
                          <Link2 className="w-4 h-4 mr-1" /> 访问
                        </a>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-zinc-400">{formatTime(res.updatedAt)}</TableCell>
                    <TableCell className="text-right space-x-2 sticky right-0 bg-zinc-900 shadow-[-10px_0_10px_-10px_rgba(0,0,0,0.5)]">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(res)} className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">编辑</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(res.id!)} className="text-white bg-red-600 hover:bg-red-700">删除</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? '编辑测试资源' : '登记新资源'}</DialogTitle>
            <DialogDescription className="text-zinc-400">完善资源信息，支持设置逗号分隔的标签矩阵。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">资源名称 <span className="text-red-500">*</span></Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-zinc-800 border-zinc-700 text-zinc-100" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">类型类别</Label>
                <Input placeholder="如: VM, Account" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="bg-zinc-800 border-zinc-700 text-zinc-100" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">当前状态</Label>
                <Select value={formData.status.toString()} onValueChange={(v) => setFormData({...formData, status: Number(v)})}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-100">
                    <SelectItem value={ResourceStatus.Available.toString()}>可用</SelectItem>
                    <SelectItem value={ResourceStatus.InUse.toString()}>使用中</SelectItem>
                    <SelectItem value={ResourceStatus.Maintenance.toString()}>维护中</SelectItem>
                    <SelectItem value={ResourceStatus.Offline.toString()}>离线</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">负责人ID</Label>
                <Input placeholder="输入Owner UUID" value={formData.ownerId} onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })} className="bg-zinc-800 border-zinc-700 text-zinc-100" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">URL 链接</Label>
              <Input placeholder="http://" value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} className="bg-zinc-800 border-zinc-700 text-zinc-100" />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">标签 (Tags)</Label>
              <div className="relative">
                <Hash className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                <Input 
                  placeholder="多个标签请用英文逗号分隔，如: prod, linux, ui-test" 
                  value={formData.tags} 
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })} 
                  className="pl-8 bg-zinc-800 border-zinc-700 text-zinc-100" 
                />
              </div>
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">取消</Button>
            <Button onClick={handleSave} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">{isSubmitting ? '保存中...' : '确认保存'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};