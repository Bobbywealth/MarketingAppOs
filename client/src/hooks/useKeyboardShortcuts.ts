import { useEffect } from "react";

type ShortcutConfig = {
  enabled: boolean;
  onGoToSearch?: () => void;
  onGoToTasks?: () => void;
  onGoToMessages?: () => void;
};

export function useKeyboardShortcuts(config: ShortcutConfig) {
  useEffect(() => {
    if (!config.enabled) return;

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTypingTarget =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          (target as any).isContentEditable);
      if (isTypingTarget) return;

      const key = e.key.toLowerCase();
      const meta = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl+K -> global search
      if (meta && key === "k") {
        e.preventDefault();
        config.onGoToSearch?.();
        return;
      }

      // g then t/m quick nav (like GitHub); very light implementation
      if (key === "g") {
        const start = Date.now();
        const follow = (e2: KeyboardEvent) => {
          const k2 = e2.key.toLowerCase();
          const within = Date.now() - start < 900;
          if (!within) {
            window.removeEventListener("keydown", follow);
            return;
          }
          if (k2 === "t") {
            e2.preventDefault();
            config.onGoToTasks?.();
            window.removeEventListener("keydown", follow);
          }
          if (k2 === "m") {
            e2.preventDefault();
            config.onGoToMessages?.();
            window.removeEventListener("keydown", follow);
          }
        };
        window.addEventListener("keydown", follow);
        window.setTimeout(() => window.removeEventListener("keydown", follow), 950);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [config]);
}


