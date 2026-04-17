import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faInfoCircle, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

export interface ToastProps {
  message: string;
  toastId: string;
  icon?: React.ReactNode;
  showCloseButton?: boolean;
  className?: string;
}

export default function Toast({ message, toastId, icon, showCloseButton = true, className }: ToastProps) {
  return (
    <div className={cn('flex items-center gap-4 w-full', className)}>
      {icon && <div className="flex-shrink-0">{icon}</div>}
      <div className="flex-1 text-sm font-medium text-text-primary">{message}</div>

      {showCloseButton && (
        <button
          onClick={() => toast.dismiss(toastId)}
          className="flex-shrink-0 w-6 h-6 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors duration-200 group"
          aria-label="Close notification"
        >
          <FontAwesomeIcon
            icon={faXmark}
            className="w-3 h-3 text-text-muted group-hover:text-text-secondary transition-colors duration-200"
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
    return toast(
      (t) => <Toast message={message} toastId={t.id} />,
      {
        duration: options?.duration || 5000,
        id,
        icon: <FontAwesomeIcon icon={faInfoCircle} className="w-4 h-4 text-info" />,
      },
    );
  },

  warning: (message: string, options?: { duration?: number; id?: string }) => {
    const id = options?.id || `warning-${Date.now()}`;
    return toast(
      (t) => <Toast message={message} toastId={t.id} />,
      {
        duration: options?.duration || 5000,
        id,
        icon: <FontAwesomeIcon icon={faTriangleExclamation} className="w-4 h-4 text-warning" />,
      },
    );
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
