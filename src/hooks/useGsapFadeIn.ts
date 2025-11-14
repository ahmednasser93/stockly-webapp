import { useLayoutEffect } from "react";
import gsap from "gsap";

export function useGsapFadeIn(
  ref: React.RefObject<HTMLElement | null>,
  options?: gsap.TweenVars
) {
  useLayoutEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        {
          opacity: 0,
          y: 24,
          scale: 0.98,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "power3.out",
          ...options,
        }
      );
    }, ref);

    return () => ctx.revert();
  }, [ref, options]);
}
