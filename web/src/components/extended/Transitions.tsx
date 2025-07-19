import { forwardRef, ReactNode } from 'react';
import { Collapse, Fade, Box, Grow, Slide, Zoom, SxProps, Theme } from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';

type TransitionType = 'grow' | 'collapse' | 'fade' | 'slide' | 'zoom';
type TransitionPosition = 'top-left' | 'top-right' | 'top' | 'bottom-left' | 'bottom-right' | 'bottom';
type TransitionDirection = 'up' | 'right' | 'left' | 'down';

interface TransitionsProps extends Omit<TransitionProps, 'children'> {
  children?: ReactNode;
  position?: TransitionPosition;
  sx?: SxProps<Theme>;
  type?: TransitionType;
  direction?: TransitionDirection;
}

const Transitions = forwardRef<HTMLDivElement, TransitionsProps>(
  ({ children, position = 'top-left', sx, type = 'grow', direction = 'up', ...others }, ref) => {
    const getPositionSX = (pos: TransitionPosition) => {
      switch (pos) {
        case 'top-right':
          return { transformOrigin: 'top right' };
        case 'top':
          return { transformOrigin: 'top' };
        case 'bottom-left':
          return { transformOrigin: 'bottom left' };
        case 'bottom-right':
          return { transformOrigin: 'bottom right' };
        case 'bottom':
          return { transformOrigin: 'bottom' };
        case 'top-left':
        default:
          return { transformOrigin: '0 0 0' };
      }
    };

    const positionSX = getPositionSX(position);
    const combinedSx = { ...positionSX, ...sx };

    let content = null;
    switch (type) {
      case 'grow':
        content = (
          <Grow {...others}>
            <Box sx={combinedSx}>{children}</Box>
          </Grow>
        );
        break;
      case 'collapse':
        content = (
          <Collapse {...others} sx={combinedSx}>
            {children}
          </Collapse>
        );
        break;
      case 'fade':
        content = (
          <Fade
            {...others}
            timeout={{
              appear: 500,
              enter: 600,
              exit: 400,
            }}
          >
            <Box sx={combinedSx}>{children}</Box>
          </Fade>
        );
        break;
      case 'slide':
        content = (
          <Slide
            {...others}
            timeout={{
              appear: 0,
              enter: 400,
              exit: 200,
            }}
            direction={direction}
          >
            <Box sx={combinedSx}>{children}</Box>
          </Slide>
        );
        break;
      case 'zoom':
        content = (
          <Zoom {...others}>
            <Box sx={combinedSx}>{children}</Box>
          </Zoom>
        );
        break;
      default:
        content = <Box sx={combinedSx}>{children}</Box>;
    }

    return <Box ref={ref}>{content}</Box>;
  },
);

Transitions.displayName = 'Transitions';

export default Transitions;
