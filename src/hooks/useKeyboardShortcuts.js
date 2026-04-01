import { useEffect } from 'react';

export function useKeyboardShortcuts({ undo, redo, saveSlot, generateRandomPalette, setTab, tabs }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
        return;
      }

      if (ctrl && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        redo();
        return;
      }

      if (ctrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveSlot();
        return;
      }

      if (ctrl && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        generateRandomPalette();
        return;
      }

      // Number shortcuts — only when focus is not on an input
      const active = document.activeElement;
      const inInput =
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.contentEditable === 'true');

      if (!inInput && tabs) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx >= 0 && idx < tabs.length) {
          setTab(tabs[idx].key);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, saveSlot, generateRandomPalette, setTab, tabs]);
}
