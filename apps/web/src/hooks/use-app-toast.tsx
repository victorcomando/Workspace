import { useCallback, useState, type ReactElement } from 'react';
import {
  CToast,
  CToastBody,
  CToastHeader,
  CToaster,
} from '@coreui/react';

type ToastColor = 'success' | 'danger' | 'warning' | 'info';

type ToastOptions = {
  title?: string;
  color?: ToastColor;
  delay?: number;
};

export const useAppToast = () => {
  const [toast, setToast] = useState<ReactElement | undefined>(undefined);

  const showToast = useCallback((message: string, options?: ToastOptions) => {
    const title = options?.title ?? 'Workspace';
    const color = options?.color ?? 'info';
    const defaultDelayByColor: Record<ToastColor, number> = {
      success: 2500,
      info: 2500,
      warning: 3000,
      danger: 3500,
    };
    const delay = options?.delay ?? defaultDelayByColor[color];

    setToast(
      <CToast autohide delay={delay} color={color}>
        <CToastHeader closeButton>
          <strong className="me-auto">{title}</strong>
        </CToastHeader>
        <CToastBody>{message}</CToastBody>
      </CToast>,
    );
  }, []);

  return {
    showToast,
    toaster: <CToaster push={toast as never} placement="top-end" />,
  };
};
