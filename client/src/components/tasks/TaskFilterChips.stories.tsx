import { TaskFilterChips } from "./TaskFilterChips";

const noop = () => {};

export function VibeTaskFilterChipsStory() {
  return (
    <TaskFilterChips
      filterStatus="in_progress"
      filterPriority="high"
      searchQuery="homepage redesign"
      filterClientId="client-1"
      filterAssigneeId="42"
      filterDueDateRange="this_week"
      selectedSpaceId="space-1"
      showCompleted
      clients={[{ id: "client-1", name: "Acme Inc." } as any]}
      users={[{ id: 42, firstName: "Taylor", username: "taylor" } as any]}
      onClearStatus={noop}
      onClearPriority={noop}
      onClearSearch={noop}
      onClearClient={noop}
      onClearAssignee={noop}
      onClearDueDate={noop}
      onClearSpace={noop}
      onToggleCompleted={noop}
      onClearAll={noop}
    />
  );
}
