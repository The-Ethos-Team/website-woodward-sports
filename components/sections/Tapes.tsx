import { TapesShell } from '@/components/client/TapesShell';

const TXT = 'UNFILTERED DETROIT SPORTS ///// MADE FOR THE FANS, MADE BY THE FANS ///// LIONS ///// PISTONS ///// TIGERS ///// RED WINGS ///// MICHIGAN ///// MSU ///// ';

/** Crossed tapes between two sections; `to` sets the lower half colour (paper by default). */
export function Tapes({ to }: { to?: 'paper' | 'ink' }) {
  return <TapesShell text={TXT} to={to} />;
}
