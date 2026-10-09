'use client';
import { useEffect, useRef } from 'react';
import { FlapsImpl } from '@/lib/ui/motion';

/** Split-flap countdown. React renders the span empty; FlapsImpl owns its children. */
export function Flaps({ value, animate = true, hidden }: { value: string; animate?: boolean; hidden?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const impl = useRef<FlapsImpl | null>(null);
  useEffect(() => {
    if (!impl.current) impl.current = new FlapsImpl(ref.current);
    impl.current.set(value, animate);
  }, [value, animate]);
  return <span className="flaps" ref={ref} hidden={hidden} aria-hidden="true" suppressHydrationWarning />;
}
