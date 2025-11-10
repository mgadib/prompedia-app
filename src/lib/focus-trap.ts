/**
 * Utility untuk focus trap dalam modal
 * Mencegah focus keluar dari modal dan mengembalikan focus ke elemen pertama/terakhir
 */

export function trapFocus(element: HTMLElement | null) {
  if (!element) return;

  const focusableElements = element.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  element.addEventListener('keydown', handleTabKey);

  // Focus first element
  firstElement?.focus();

  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
}

/**
 * Auto-focus pada elemen pertama yang focusable dalam container
 */
export function autoFocus(container: HTMLElement | null) {
  if (!container) return;

  const focusableElement = container.querySelector<HTMLElement>(
    'input:not([disabled]), textarea:not([disabled]), button:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  // Delay sedikit untuk memastikan element sudah rendered
  setTimeout(() => {
    focusableElement?.focus();
  }, 100);
}

