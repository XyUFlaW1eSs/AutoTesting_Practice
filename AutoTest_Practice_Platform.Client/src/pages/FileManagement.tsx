import { useEffect, useState, useRef } from 'react';
import { fileService } from '../api/fileService';
import type { FileAssetResponse } from '../api/types';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

export const FileManagement = () => {
  const [files, setFiles] = useState<FileAssetResponse[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    try {
      const data = await fileService.getFiles();
      setFiles(data || []);
    } catch (error) {
      toast.error('获取文件列表失败');
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = async () => {
    const selectedFile = fileInputRef.current?.files?.[0];
    if (!selectedFile) {
      toast.warning('请先选择一个文件');
      return;
    }

    try {
      setIsUploading(true);
      await fileService.uploadFile(selectedFile);
      toast.success('文件上传成功');
      
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchFiles();
    } catch (error) {
      toast.error('文件上传失败');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fileService.deleteFile(id);
      toast.success('文件已删除');
      fetchFiles();
    } catch (error) {
      toast.error('删除失败');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-50">文件管理</h2>
        <p className="text-zinc-400 mt-2">自动化测试靶点：处理 multipart/form-data 提交与 Blob 二进制下载。</p>
      </div>

      {/* 上传区域 */}
      <div className="flex items-center gap-4 p-4 border border-zinc-800 rounded-md bg-zinc-900">
        <Input 
          type="file" 
          ref={fileInputRef} 
          disabled={isUploading}
          className="max-w-sm cursor-pointer bg-zinc-800 border-zinc-700 text-zinc-300 focus-visible:ring-zinc-500"
          data-testid="input-file-upload" 
        />
        {/* 修复：明确指定背景为亮色，文字为深色，提升对比度 */}
        <Button 
          onClick={handleUpload} 
          disabled={isUploading}
          className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
          data-testid="btn-upload"
        >
          {isUploading ? '上传中...' : '开始上传'}
        </Button>
      </div>

      {/* 文件列表区域 */}
      <div className="border border-zinc-800 rounded-md bg-zinc-900 p-4">
        <Table data-testid="file-table">
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">文件名</TableHead>
              <TableHead className="text-zinc-400">大小 (Bytes)</TableHead>
              <TableHead className="text-zinc-400">类型</TableHead>
              <TableHead className="text-right text-zinc-400">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.length === 0 ? (
              <TableRow className="border-zinc-800">
                <TableCell colSpan={4} className="h-24 text-center text-zinc-500">
                  暂无文件
                </TableCell>
              </TableRow>
            ) : (
              files.map((file, index) => (
                <TableRow key={file.id} className="border-zinc-800 hover:bg-zinc-800/50" data-testid={`file-row-${index}`}>
                  <TableCell className="font-medium text-zinc-300">{file.originalFileName}</TableCell>
                  <TableCell className="text-zinc-400">{file.size}</TableCell>
                  <TableCell className="text-zinc-400">{file.contentType}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {/* 修复：Outline 按钮指定文字颜色为浅灰，Hover 时变白 */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
                      onClick={() => fileService.downloadFile(file.id!, file.originalFileName!)}
                      data-testid={`btn-download-${index}`}
                    >
                      下载
                    </Button>
                    {/* 修复：Destructive 按钮强制文字为白色 */}
                    <Button 
                      variant="destructive" 
                      size="sm"
                      className="text-white bg-red-600 hover:bg-red-700"
                      onClick={() => handleDelete(file.id!)}
                      data-testid={`btn-delete-${index}`}
                    >
                      删除
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};