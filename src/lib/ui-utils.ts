// UI工具函数
export class UIUtils {
  // 显示加载状态
  static showLoading(element: HTMLElement, message = '加载中...') {
    element.innerHTML = `
      <div class="flex items-center justify-center py-8">
        <div class="loading-spinner mx-auto mb-4"></div>
        <p class="text-gray-600">${message}</p>
      </div>
    `;
  }

  // 显示错误状态
  static showError(element: HTMLElement, message: string, onRetry?: () => void) {
    element.innerHTML = `
      <div class="text-center py-8">
        <svg class="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h3 class="text-lg font-medium text-gray-900 mb-2">出现错误</h3>
        <p class="text-gray-600 mb-4">${message}</p>
        ${onRetry ? `
          <button onclick="${onRetry.name}()" class="btn btn-primary">
            重试
          </button>
        ` : ''}
      </div>
    `;
  }

  // 显示空状态
  static showEmpty(element: HTMLElement, message: string, actionText?: string, actionUrl?: string) {
    element.innerHTML = `
      <div class="text-center py-12">
        <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 class="text-lg font-medium text-gray-900 mb-2">暂无数据</h3>
        <p class="text-gray-600 mb-4">${message}</p>
        ${actionText && actionUrl ? `
          <a href="${actionUrl}" class="btn btn-solar">
            ${actionText}
          </a>
        ` : ''}
      </div>
    `;
  }

  // 显示成功提示
  static showSuccess(message: string, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-success-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // 显示动画
    setTimeout(() => {
      toast.classList.remove('translate-x-full');
    }, 100);
    
    // 自动隐藏
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, duration);
  }

  // 显示错误提示
  static showErrorToast(message: string, duration = 5000) {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-danger-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // 显示动画
    setTimeout(() => {
      toast.classList.remove('translate-x-full');
    }, 100);
    
    // 自动隐藏
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, duration);
  }

  // 显示确认对话框
  static showConfirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
      modal.innerHTML = `
        <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">确认操作</h3>
          <p class="text-gray-600 mb-6">${message}</p>
          <div class="flex space-x-3 justify-end">
            <button id="confirm-cancel" class="btn btn-secondary">取消</button>
            <button id="confirm-ok" class="btn btn-danger">确认</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      const cancelBtn = modal.querySelector('#confirm-cancel');
      const okBtn = modal.querySelector('#confirm-ok');
      
      cancelBtn?.addEventListener('click', () => {
        document.body.removeChild(modal);
        resolve(false);
      });
      
      okBtn?.addEventListener('click', () => {
        document.body.removeChild(modal);
        resolve(true);
      });
      
      // 点击背景关闭
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
          resolve(false);
        }
      });
    });
  }

  // 格式化文件大小
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 格式化时间
  static formatTime(date: Date | string): string {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}天前`;
    } else if (hours > 0) {
      return `${hours}小时前`;
    } else if (minutes > 0) {
      return `${minutes}分钟前`;
    } else {
      return '刚刚';
    }
  }

  // 格式化日期
  static formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // 复制到剪贴板
  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('复制失败:', error);
      return false;
    }
  }

  // 下载文件
  static downloadFile(data: string, filename: string, type = 'text/plain') {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // 防抖函数
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // 节流函数
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // 获取置信度颜色
  static getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return 'text-success-600';
    if (confidence >= 0.6) return 'text-warning-600';
    return 'text-danger-600';
  }

  // 获取置信度文本
  static getConfidenceText(confidence: number): string {
    if (confidence >= 0.8) return '高';
    if (confidence >= 0.6) return '中';
    return '低';
  }

  // 获取标签样式类
  static getTagClass(label: string): string {
    switch (label) {
      case '正常光伏板': return 'tag-normal';
      case '树叶遮挡': return 'tag-leaf';
      case '灰尘覆盖': return 'tag-dust';
      case '云彩阴影': return 'tag-cloud';
      default: return 'tag-other';
    }
  }
}
