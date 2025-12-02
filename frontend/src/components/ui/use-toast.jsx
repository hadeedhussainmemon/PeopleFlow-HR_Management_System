import { useToastContext } from './Toast';

export const useToast = () => {
  const { toast } = useToastContext();
  return { toast };
};

export default useToast;
