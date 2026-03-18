import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  VibeCenterStory,
  VibeFlexColStory,
  VibeFlexRowStory,
  VibePageContainerStory,
  VibeSectionStory,
} from "@/components/layout/page-layout.stories";
import {
  VibePageHeaderCompactStory,
  VibePageHeaderStory,
} from "@/components/layout/PageHeader.stories";
import { TaskFilterChips } from "@/components/tasks/TaskFilterChips";
import { VibeTaskFilterChipsStory } from "@/components/tasks/TaskFilterChips.stories";
import { ViewModeSwitcher } from "@/components/tasks/ViewModeSwitcher";
import { VibeViewModeDropdownStory, VibeViewModeSwitcherStory } from "@/components/tasks/ViewModeSwitcher.stories";

function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event("resize"));
}

describe("Vibe primitives story snapshots", () => {
  it("captures snapshots for each Vibe* primitive story", () => {
    const stories = [
      { name: "VibePageContainerStory", Component: VibePageContainerStory },
      { name: "VibeSectionStory", Component: VibeSectionStory },
      { name: "VibeFlexRowStory", Component: VibeFlexRowStory },
      { name: "VibeFlexColStory", Component: VibeFlexColStory },
      { name: "VibeCenterStory", Component: VibeCenterStory },
      { name: "VibePageHeaderStory", Component: VibePageHeaderStory },
      { name: "VibePageHeaderCompactStory", Component: VibePageHeaderCompactStory },
      { name: "VibeTaskFilterChipsStory", Component: VibeTaskFilterChipsStory },
      { name: "VibeViewModeSwitcherStory", Component: VibeViewModeSwitcherStory },
      { name: "VibeViewModeDropdownStory", Component: VibeViewModeDropdownStory },
    ];

    for (const story of stories) {
      const { container, unmount } = render(<story.Component />);
      expect(container.firstElementChild).toMatchSnapshot(story.name);
      unmount();
    }
  });

  it("renders snapshots in dark mode without crashing", () => {
    document.documentElement.classList.add("dark");
    const { container } = render(<VibePageHeaderStory />);

    expect(container.firstElementChild).toMatchSnapshot("VibePageHeaderStory-dark");

    document.documentElement.classList.remove("dark");
  });

  it("renders switcher and chips with mobile viewport dimensions", () => {
    setViewportWidth(390);

    render(
      <>
        <VibeTaskFilterChipsStory />
        <VibeViewModeSwitcherStory />
      </>
    );

    expect(screen.getByText("Active Filters:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /list/i })).toBeInTheDocument();
  });
});

describe("interaction states", () => {
  it("invokes filter chip callbacks and clear all", async () => {
    const user = userEvent.setup();

    const onClearStatus = vi.fn();
    const onClearPriority = vi.fn();
    const onClearSearch = vi.fn();
    const onClearClient = vi.fn();
    const onClearAssignee = vi.fn();
    const onClearDueDate = vi.fn();
    const onClearSpace = vi.fn();
    const onToggleCompleted = vi.fn();
    const onClearAll = vi.fn();

    render(
      <TaskFilterChips
        filterStatus="todo"
        filterPriority="high"
        searchQuery="launch"
        filterClientId="client-1"
        filterAssigneeId="1"
        filterDueDateRange="today"
        selectedSpaceId="space-1"
        showCompleted
        clients={[{ id: "client-1", name: "Acme" } as any]}
        users={[{ id: 1, firstName: "Alex", username: "alex" } as any]}
        onClearStatus={onClearStatus}
        onClearPriority={onClearPriority}
        onClearSearch={onClearSearch}
        onClearClient={onClearClient}
        onClearAssignee={onClearAssignee}
        onClearDueDate={onClearDueDate}
        onClearSpace={onClearSpace}
        onToggleCompleted={onToggleCompleted}
        onClearAll={onClearAll}
      />
    );

    await user.click(screen.getByRole("button", { name: /remove to do filter/i }));
    await user.click(screen.getByRole("button", { name: /remove high priority filter/i }));
    await user.click(screen.getByRole("button", { name: /remove \"launch\" filter/i }));
    await user.click(screen.getByRole("button", { name: /remove acme filter/i }));
    await user.click(screen.getByRole("button", { name: /remove alex filter/i }));
    await user.click(screen.getByRole("button", { name: /remove due today filter/i }));
    await user.click(screen.getByRole("button", { name: /remove space filter active filter/i }));
    await user.click(screen.getByRole("button", { name: /remove showing completed filter/i }));
    await user.click(screen.getByRole("button", { name: /clear all/i }));

    expect(onClearStatus).toHaveBeenCalledTimes(1);
    expect(onClearPriority).toHaveBeenCalledTimes(1);
    expect(onClearSearch).toHaveBeenCalledTimes(1);
    expect(onClearClient).toHaveBeenCalledTimes(1);
    expect(onClearAssignee).toHaveBeenCalledTimes(1);
    expect(onClearDueDate).toHaveBeenCalledTimes(1);
    expect(onClearSpace).toHaveBeenCalledTimes(1);
    expect(onToggleCompleted).toHaveBeenCalledTimes(1);
    expect(onClearAll).toHaveBeenCalledTimes(1);
  });

  it("switches view toggle active state", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<ViewModeSwitcher value="list" onChange={onChange} />);

    const boardButton = screen.getByRole("button", { name: /board/i });
    await user.click(boardButton);

    expect(onChange).toHaveBeenCalledWith("board");
    expect(boardButton).toHaveClass("text-muted-foreground");
  });
});
