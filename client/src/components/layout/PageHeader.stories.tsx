import { Button } from "@/components/ui/button";
import { PageHeader, PageHeaderCompact } from "./PageHeader";

export function VibePageHeaderStory() {
  return (
    <PageHeader
      title="Marketing Overview"
      description="Track campaign and channel performance in one place."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Marketing" },
      ]}
      actions={<Button size="sm">Create campaign</Button>}
    />
  );
}

export function VibePageHeaderCompactStory() {
  return (
    <PageHeaderCompact
      title="Task Details"
      description="Focused task workspace"
      backButton={{ label: "Back", href: "/tasks" }}
      actions={<Button size="sm">Edit</Button>}
    />
  );
}
