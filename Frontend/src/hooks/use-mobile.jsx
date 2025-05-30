import * as React from "react"
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setMobile } from '@/store/slices/uiSlice';

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const dispatch = useAppDispatch();
  const isMobile = useAppSelector(state => state.ui.isMobile);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      dispatch(setMobile(window.innerWidth < MOBILE_BREAKPOINT));
    }
    mql.addEventListener("change", onChange)
    dispatch(setMobile(window.innerWidth < MOBILE_BREAKPOINT));
    return () => mql.removeEventListener("change", onChange);
  }, [dispatch])

  return isMobile;
}
