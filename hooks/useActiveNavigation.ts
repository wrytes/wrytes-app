import { useRouter } from 'next/router';

export function useActiveNavigation() {
  const router = useRouter();
  
  const isActive = (path: string) => {
    if (path === '/dashboard' || path === '/deribit-agent') {
      return router.pathname === path;
    }
    return router.pathname.startsWith(path);
  };
  
  return { isActive };
} 