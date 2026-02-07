import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toLocaleDateStringEST } from "@/lib/dateUtils";

type RecurringSeries = {
  seriesId: string;
  title: string;
  recurringPattern: string;
  recurringInterval: number;
  recurringEndDate: string | null;
  scheduleFrom: string;
  totalInstances: number;
  openInstances: number;
  completedInstances: number;
  lastInstanceDateKey: string;
  nextInstanceDateKey: string | null;
  latestTask: {
    id: string;
    status: string;
    dueDate: string | null;
    assignedToId: number | null;
    clientId: string | null;
    spaceId: string | null;
  } | null;
};

const dateKeyToDisplay = (dateKey: string | null) => {
  if (!dateKey) return "—";
  return toLocaleDateStringEST(`${dateKey}T00:00:00`);
};

const cadenceLabel = (pattern: string, interval: number) => {
  if (!pattern) return "—";
  const prefix = interval > 1 ? `Every ${interval} ` : "Every ";
  return `${prefix}${pattern}`;
};

export default function RecurringTasksPage() {
  const [search, setSearch] = useState("");

  const { data: series = [], isLoading } = useQuery<RecurringSeries[]>({
    queryKey: ["/api/tasks/recurring-series"],
  });

  const filteredSeries = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return series;
    return series.filter((item) => item.title.toLowerCase().includes(normalized));
  }, [search, series]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Recurring Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Track all recurring task series in one place and see what is coming up next.
          </p>
        </div>
        <div className="max-w-md">
          <Input
            placeholder="Search recurring tasks..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </header>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={`recurring-skeleton-${index}`}>
              <CardContent className="p-5">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="mt-3 h-4 w-56" />
                <Skeleton className="mt-4 h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredSeries.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No recurring tasks found yet. Create a recurring task to see it listed here.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredSeries.map((item) => (
            <Card key={item.seriesId}>
              <CardContent className="p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{item.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {cadenceLabel(item.recurringPattern, item.recurringInterval)}
                    </p>
                  </div>
                  <Badge variant={item.openInstances > 0 ? "default" : "secondary"}>
                    {item.openInstances} open
                  </Badge>
                </div>

                <div className="grid gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Last instance</span>
                    <span className="font-medium text-foreground">
                      {dateKeyToDisplay(item.lastInstanceDateKey)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Next instance</span>
                    <span className="font-medium text-foreground">
                      {dateKeyToDisplay(item.nextInstanceDateKey)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Completed</span>
                    <span className="font-medium text-foreground">
                      {item.completedInstances}/{item.totalInstances}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Series ends</span>
                    <span className="font-medium text-foreground">
                      {item.recurringEndDate ? toLocaleDateStringEST(item.recurringEndDate) : "No end date"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
