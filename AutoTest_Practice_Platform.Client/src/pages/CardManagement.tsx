import { useEffect, useState } from 'react';
import { useCardStore } from '../store/useCardStore';
import type { CardResponse } from '../api/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { toast } from 'sonner';
import { CreditCard, Search, RotateCcw, Copy, Trash2, Edit } from 'lucide-react';

export const CardManagement = () => {

  const { cards, isLoading, initialize, fetchCards, addCard, updateCard, deleteCard, sync } = useCardStore();

  // 搜索参数
  const [searchCardNumber, setSearchCardNumber] = useState('');
  const [searchExpiry, setSearchExpiry] = useState('');
  const [filterDeleted, setFilterDeleted] = useState<boolean | null>(null); // null=全部, false=未删除, true=已删除

  // 弹窗与表单
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ cardNumber: '', expiryDate: '', ccv: '', isDeleted: false });

  // 计算默认有效期：当前时间推后 5 年，格式为 MM/YY
  const getDefaultExpiryDate = () => {
    const today = new Date();
    // getMonth() 返回 0-11，需要 +1 并补齐两位数
    const month = String(today.getMonth() + 1).padStart(2, '0');
    // 获取 5 年后的年份，并截取最后两位
    const futureYear = String(today.getFullYear() + 5).slice(-2);
    return `${month}/${futureYear}`;
  };

  const handleFetchCards = async () => {
    try {
      await fetchCards({
        cardNumber:
          searchCardNumber.trim() ||
          undefined,

        expiryDate:
          searchExpiry.trim() ||
          undefined,

        isDeleted:
          filterDeleted ??
          undefined,
      });
    } catch {
      toast.error(
        '获取卡片列表失败',
      );
    }
  };

  useEffect(() => {

    const initializeCards = async () => {
      try {
        await initialize();
      } catch {
        toast.error('初始化卡片数据失败',);
      }
    };
    void initializeCards();
  }, [initialize, fetchCards]);

  const handleReset = async () => {
    setSearchCardNumber('');
    setSearchExpiry('');
    setFilterDeleted(null)
    try {
      await fetchCards({});
    } catch {
      toast.error(
        '获取卡片列表失败',
      );
    }
  };

  // 复制前端根据本地 Card 数据生成的格式化信息。
  const handleCopy = (formattedText: string) => {
    navigator.clipboard.writeText(formattedText).then(() => {
      toast.success('卡片信息已复制到剪贴板！');
    }).catch(() => {
      toast.error('复制失败，请检查浏览器权限');
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除这张卡片吗？')) return;
    try {
      await deleteCard(id);
      toast.success('删除成功');
    } catch { toast.error('删除失败'); }
  };

  const openCreateDialog = () => {
    setEditingId(null);
    setFormData({ cardNumber: '', expiryDate: getDefaultExpiryDate(), ccv: '', isDeleted: false });
    setIsDialogOpen(true);
  };

  const openEditDialog = (card: CardResponse) => {
    setEditingId(card.id);
    setFormData({ cardNumber: card.cardNumber || '', expiryDate: card.expiryDate || '', ccv: card.ccv || '', isDeleted: card.isDeleted });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.cardNumber || !formData.expiryDate || !formData.ccv) {
      return toast.warning('请填写完整的卡片信息');
    }
    try {
      if (editingId) {
        await updateCard(editingId, formData);
        toast.success('卡片已更新');
      } else {
        await addCard(formData);
        toast.success('新卡片添加成功');
      }
      setIsDialogOpen(false);
    } catch { toast.error('保存失败'); }
  };

  const handleRefresh = async () => {
    try {
      await sync();

      await fetchCards({
        cardNumber: searchCardNumber.trim() || undefined,
        expiryDate: searchExpiry.trim() || undefined,
        isDeleted: filterDeleted ?? undefined,
      });
      toast.success('同步完成');
    } catch {
      toast.error('同步失败');
    }
  };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-50">支付卡包管理</h2>
            <p className="text-zinc-400 mt-2">用于自动化测试支付链路的银行卡数据池 (支持逻辑删除)。</p>
          </div>
          <Button onClick={openCreateDialog} className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200">
            + 录入新卡片
          </Button>
        </div>

        {/* 搜索区域 */}
        <div className="flex flex-wrap gap-4 items-center bg-zinc-900 p-4 border border-zinc-800 rounded-md">
          <Input placeholder="检索卡号片段..." value={searchCardNumber} onChange={e => setSearchCardNumber(e.target.value)} className="w-[220px] bg-zinc-800 border-zinc-700 text-zinc-100" />
          <Input placeholder="检索有效期 (如 12/26)" value={searchExpiry} onChange={e => setSearchExpiry(e.target.value)} className="w-[180px] bg-zinc-800 border-zinc-700 text-zinc-100" />
          <div className="flex bg-zinc-800 p-1 rounded-md border border-zinc-700">
            <button onClick={() => setFilterDeleted(null)} className={`px-4 py-1 text-sm rounded-sm transition-colors ${filterDeleted === null ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}>全部</button>
            <button onClick={() => setFilterDeleted(false)} className={`px-4 py-1 text-sm rounded-sm transition-colors ${filterDeleted === false ? 'bg-green-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}>未删除</button>
            <button onClick={() => setFilterDeleted(true)} className={`px-4 py-1 text-sm rounded-sm transition-colors ${filterDeleted === true ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}>已删除</button>
          </div>
          <Button onClick={handleFetchCards} className="bg-indigo-600 hover:bg-indigo-700 text-white"><Search className="w-4 h-4 mr-2" /> 检索</Button>
          <Button onClick={handleReset} variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"><RotateCcw className="w-4 h-4 mr-2" /> 重置</Button>
          <Button onClick={handleRefresh} variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"><RotateCcw className="w-4 h-4 mr-2" /> 同步</Button>
          <Label className="text-zinc-400 text-sm ml-auto">共 {cards.length} 张卡片</Label>
        </div>

        {/* 数据表格 */}
        <div className="border border-zinc-800 rounded-md bg-zinc-900 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent whitespace-nowrap">
                <TableHead className="text-zinc-400">卡号 (Card Number)</TableHead>
                <TableHead className="text-zinc-400">有效期 (EXP)</TableHead>
                <TableHead className="text-zinc-400">安全码 (CCV)</TableHead>
                <TableHead className="text-zinc-400">状态</TableHead>
                <TableHead className="text-zinc-400">创建时间</TableHead>
                <TableHead className="text-zinc-400">更新时间</TableHead>
                <TableHead className="text-right text-zinc-400">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-zinc-500">加载中...</TableCell></TableRow>
              ) : cards.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-zinc-500">暂无卡片数据</TableCell></TableRow>
              ) : (
                cards.map(card => (
                  <TableRow key={card.id} className={`border-zinc-800 transition-colors ${card.isDeleted ? 'bg-red-950/20 opacity-80 hover:bg-red-950/40' : 'hover:bg-zinc-800/50'}`}>
                    <TableCell className="text-zinc-200 font-mono flex items-center">
                      <CreditCard className="w-4 h-4 mr-2 text-indigo-400 tabular-nums" />
                      <span className={card.isDeleted ? 'line-through text-zinc-500' : ''}>{card.cardNumber}</span>
                    </TableCell>
                    <TableCell className="text-zinc-300">{card.expiryDate}</TableCell>
                    <TableCell className="text-zinc-300">***</TableCell> {/* 列表中对 CCV 进行脱敏展示 */}
                    <TableCell>
                      {/* 列表中的只读滑块状态 */}
                      <div className="flex items-center gap-2">
                        <Switch checked={card.isDeleted} disabled={true} />
                        <span className={`text-xs ${card.isDeleted ? 'text-red-400' : 'text-green-400'}`}>{card.isDeleted ? '已废弃' : '活跃'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-300 tabular-nums">{card.createdAt}</TableCell>
                    <TableCell className="text-zinc-300 tabular-nums">{card.updatedAt}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleCopy(card.formattedInfo)} className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800" title="一键复制">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(card)} className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(card.id)} className="bg-red-600/80 hover:bg-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* 新增/编辑弹窗 */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-[425px]">
            <DialogHeader><DialogTitle>{editingId ? '编辑卡片' : '录入新卡片'}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">卡号 (Card Number)</Label>
                <Input value={formData.cardNumber} onChange={e => setFormData({ ...formData, cardNumber: e.target.value })} className="bg-zinc-800 border-zinc-700 text-zinc-100" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">有效期 (MM/YY)</Label>
                  <Input value={formData.expiryDate} onChange={e => setFormData({ ...formData, expiryDate: e.target.value })} placeholder="12/26" className="bg-zinc-800 border-zinc-700 text-zinc-100" />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">CCV</Label>
                  <Input value={formData.ccv} onChange={e => setFormData({ ...formData, ccv: e.target.value })} maxLength={4} className="bg-zinc-800 border-zinc-700 text-zinc-100" />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border border-zinc-700 rounded-md mt-2">
                <Label className="text-zinc-300 cursor-pointer" onClick={() => setFormData({ ...formData, isDeleted: !formData.isDeleted })}>
                  标记为已删除 (废弃)
                </Label>
                <Switch checked={formData.isDeleted}
                  onCheckedChange={(checked) => setFormData({ ...formData, isDeleted: checked })}
                  className="data-[state=checked]:bg-red-600" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-zinc-700 text-zinc-300">取消</Button>
              <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white">保存卡片</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };