let locks = 0;

/**
 * Locks page scrolling and returns the matching unlock function. Counted, so
 * overlapping overlays (e.g. one dialog opening as another closes) can't
 * leave the page stuck or unlock it too early.
 */
export function lockScroll() {
  locks += 1;
  document.body.style.overflow = "hidden";

  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks -= 1;
    if (locks === 0) document.body.style.overflow = "";
  };
}
