'use client';
import { useEffect, useState, type ReactNode } from 'react';

/** App Store first on iOS, YouTube Live first elsewhere (DOM order, so focus follows the visual order). */
export function AppButtons({ store, yt }: { store: ReactNode; yt: ReactNode }) {
  const [ios, setIos] = useState(true);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIos(/iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
  }, []);
  return <div className="app__btns">{ios ? <>{store}{yt}</> : <>{yt}{store}</>}</div>;
}
