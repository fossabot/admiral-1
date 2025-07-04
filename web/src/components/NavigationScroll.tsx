import { type ReactNode, type ReactElement, useLayoutEffect } from 'react';

interface NavigationScrollProps {
  children: ReactNode;
  scrollBehavior?: ScrollBehavior;
}

const NavigationScroll = ({ children, scrollBehavior = 'smooth' }: NavigationScrollProps): ReactElement => {
  useLayoutEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: scrollBehavior,
      });
    }
  }, [scrollBehavior]);

  return <>{children}</>;
};

export default NavigationScroll;
