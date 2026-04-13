import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

export interface ToastProps {
  message: string;
  toastId: string;
  showCloseButton?: boolean;
  className?: string;
}

export default function Toast({ message, toastId, showCloseButton = true, className }: ToastProps) {
  return (
    <div className={cn('flex items-center gap-4 w-full', className)}>
      <div className="flex-1 text-sm font-medium text-gray-900 dark:text-white">{message}</div>

      {showCloseButton && (
        <button
          onClick={() => toast.dismiss(toastId)}
          className="flex-shrink-0 w-6 h-6 rounded-full bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center transition-colors duration-200 group"
          aria-label="Close notification"
        >
          <FontAwesomeIcon
            icon={faXmark}
            className="w-3 h-3 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-200"
          />
        </button>
      )}
    </div>
  );
}

export const showToast = {
  success: (message: string, options?: { duration?: number; id?: string }) => {
    const id = options?.id || `success-${Date.now()}`;
    return toast.success((t) => <Toast message={message} toastId={t.id} />, {
      duration: options?.duration || 4000,
      id,
    });
  },

  error: (message: string, options?: { duration?: number; id?: string }) => {
    const id = options?.id || `error-${Date.now()}`;
    return toast.error((t) => <Toast message={message} toastId={t.id} />, {
      duration: options?.duration || 6000,
      id,
    });
  },

  info: (message: string, options?: { duration?: number; id?: string }) => {
    const id = options?.id || `info-${Date.now()}`;
    return toast((t) => <Toast message={message} toastId={t.id} />, {
      duration: options?.duration || 5000,
      id,
    });
  },

  warning: (message: string, options?: { duration?: number; id?: string }) => {
    const id = options?.id || `warning-${Date.now()}`;
    return toast((t) => <Toast message={message} toastId={t.id} />, {
      duration: options?.duration || 5000,
      id,
      style: { background: '#fef3c7', color: '#92400e' },
    });
  },

  custom: (message: string, options?: { duration?: number; id?: string; showCloseButton?: boolean; className?: string }) => {
    const id = options?.id || `custom-${Date.now()}`;
    return toast(
      (t) => (
        <Toast
          message={message}
          toastId={t.id}
          showCloseButton={options?.showCloseButton}
          className={options?.className}
        />
      ),
      { duration: options?.duration || 5000, id },
    );
  },
};
