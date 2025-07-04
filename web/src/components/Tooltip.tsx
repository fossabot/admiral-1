import { memo, ReactElement, useCallback, useState } from 'react';
import TooltipMUI, { TooltipProps as MuiTooltipProps } from '@mui/material/Tooltip';

interface TooltipProps extends Omit<MuiTooltipProps, 'title' | 'open' | 'onOpen' | 'onClose'> {
  hide?: boolean;
  children: ReactElement;
  title: NonNullable<MuiTooltipProps['title']>;
  controlled?: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  };
}

const Tooltip = ({ children, hide = false, controlled, ...props }: TooltipProps): ReactElement => {
  const [internalOpen, setInternalOpen] = useState<boolean>(false);

  const open = controlled?.open ?? internalOpen;

  const handleOpen = useCallback(() => {
    if (controlled) {
      controlled.onOpenChange(true);
    } else {
      setInternalOpen(true);
    }
  }, [controlled]);

  const handleClose = useCallback(() => {
    if (controlled) {
      controlled.onOpenChange(false);
    } else {
      setInternalOpen(false);
    }
  }, [controlled]);

  if (hide) {
    return children;
  }

  return (
    <TooltipMUI open={open} onOpen={handleOpen} onClose={handleClose} {...props}>
      {children}
    </TooltipMUI>
  );
};

export default memo(Tooltip);
