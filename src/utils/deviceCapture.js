// 기기 감지 — userAgent + 터치 지원 둘 다 만족해야 모바일.
// PC chrome 일부 환경(좁은 창·DevTools·확장)에서 userAgent만으로 모바일 오감지되는 결함 회피.
export const isMobile = () => {
  if (typeof navigator === 'undefined') return false;
  const uaMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const hasTouch =
    (typeof window !== 'undefined' && 'ontouchstart' in window) ||
    (navigator.maxTouchPoints || 0) > 0;
  return uaMobile && hasTouch;
};

// file input 'capture' 속성 조건부 적용
// 모바일: capture='environment' (카메라 즉시 호출)
// PC: capture 미적용 (file picker 정상 표시)
export const captureAttr = () =>
  isMobile() ? { capture: 'environment' } : {};
