import { useState } from "react";
import { ViewModeDropdown, ViewModeSwitcher, type ViewMode } from "./ViewModeSwitcher";

export function VibeViewModeSwitcherStory() {
  const [mode, setMode] = useState<ViewMode>("list");

  return <ViewModeSwitcher value={mode} onChange={setMode} showAnalytics />;
}

export function VibeViewModeDropdownStory() {
  const [mode, setMode] = useState<ViewMode>("board");

  return <ViewModeDropdown value={mode} onChange={setMode} showAnalytics={false} />;
}
