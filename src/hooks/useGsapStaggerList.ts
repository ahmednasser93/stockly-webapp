import { useLayoutEffect } from "react";
import gsap from "gsap";

export function useGsapStaggerList(
  ref: React.RefObject<HTMLElement | null>,
  options?: { delay?: number }
) {
  useLayoutEffect(() => {
    if (!ref.current) return;
    const children = Array.from(
      ref.current.querySelectorAll<HTMLElement>("[data-animate-item]")
    );
    if (!children.length) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        children,
        {
          opacity: 0,
          y: 20,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          stagger: 0.08,
          delay: options?.delay ?? 0,
        }
      );
    }, ref);

    return () => ctx.revert();
  }, [ref, options?.delay]);
}
