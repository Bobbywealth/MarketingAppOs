import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsConfig {
  onCreateTask?: () => void;
  onSearch?: () => void;
  onToggleFilters?: () => void;
  onToggleView?: () => void;
  onSelectAll?: () => void;
  onEscape?: () => void;
  enabled?: boolean;
}

/**
 * Custom hook for task keyboard shortcuts
 * 
 * Shortcuts:
 * - Cmd/Ctrl + N: Create new task
 * - Cmd/Ctrl + F: Focus search
 * - Cmd/Ctrl + Shift + F: Toggle filters
 * - Cmd/Ctrl + V: Cycle view modes
 * - Cmd/Ctrl + A: Select all tasks
 * - Escape: Close dialogs/clear selection
 */
export function useTaskKeyboardShortcuts({
  onCreateTask,
  onSearch,
  onToggleFilters,
  onToggleView,
  onSelectAll,
  onEscape,
  enabled = true,
}: KeyboardShortcutsConfig) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Ignore if user is typing in an input or textarea
    const target = event.target as HTMLElement;
    const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
    
    const isMetaKey = event.metaKey || event.ctrlKey;

    // Cmd/Ctrl + N: Create new task
    if (isMetaKey && event.key === 'n') {
      event.preventDefault();
      onCreateTask?.();
      return;
    }

    // Cmd/Ctrl + F: Focus search (only when not typing)
    if (isMetaKey && event.key === 'f' && !event.shiftKey && !isTyping) {
      event.preventDefault();
      onSearch?.();
      return;
    }

    // Cmd/Ctrl + Shift + F: Toggle filters
    if (isMetaKey && event.shiftKey && event.key === 'F') {
      event.preventDefault();
      onToggleFilters?.();
      return;
    }

    // Cmd/Ctrl + V: Cycle view modes (only when not typing)
    if (isMetaKey && event.key === 'v' && !isTyping) {
      event.preventDefault();
      onToggleView?.();
      return;
    }

    // Cmd/Ctrl + A: Select all (only when not typing)
    if (isMetaKey && event.key === 'a' && !isTyping) {
      event.preventDefault();
      onSelectAll?.();
      return;
    }

    // Escape: Close dialogs/clear selection
    if (event.key === 'Escape') {
      onEscape?.();
      return;
    }
  }, [enabled, onCreateTask, onSearch, onToggleFilters, onToggleView, onSelectAll, onEscape]);

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [enabled, handleKeyDown]);

  return {
    // Helper to display shortcut hints
    getShortcutHint: (action: string) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? '⌘' : 'Ctrl';
      
      const shortcuts: Record<string, string> = {
        createTask: `${modifier} + N`,
        search: `${modifier} + F`,
        toggleFilters: `${modifier} + Shift + F`,
        cycleView: `${modifier} + V`,
        selectAll: `${modifier} + A`,
        escape: 'Esc',
      };
      
      return shortcuts[action] || '';
    },
  };
}

export default useTaskKeyboardShortcuts;
