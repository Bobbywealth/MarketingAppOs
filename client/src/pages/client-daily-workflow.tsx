import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, Workflow, Plus, BarChart3 } from "lucide-react";

type WorkflowStatus = "planned" | "in_progress" | "done";
type WorkflowChannel = "email" | "social" | "ads" | "website";

type WorkflowItem = {
  id: number;
  title: string;
  channel: WorkflowChannel;
  status: WorkflowStatus;
  completion: number;
  dueDate: string;
  createdAt: string;
};

const seedWorkflows: WorkflowItem[] = [
  {
    id: 1,
    title: "Morning KPI review",
    channel: "website",
    status: "done",
    completion: 100,
    dueDate: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: "Publish daily social update",
    channel: "social",
    status: "in_progress",
    completion: 65,
    dueDate: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    title: "Check ad spend pacing",
    channel: "ads",
    status: "planned",
    completion: 20,
    dueDate: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  },
];

const statusLabel: Record<WorkflowStatus, string> = {
  planned: "Planned",
  in_progress: "In Progress",
  done: "Done",
};

const statusVariant: Record<WorkflowStatus, "secondary" | "default" | "outline"> = {
  planned: "outline",
  in_progress: "secondary",
  done: "default",
};

export default function ClientDailyWorkflow() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>(seedWorkflows);
  const [title, setTitle] = useState("");
  const [channel, setChannel] = useState<WorkflowChannel>("email");
  const [status, setStatus] = useState<WorkflowStatus>("planned");
  const [completion, setCompletion] = useState("0");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));

  const completedToday = workflows.filter((item) => item.status === "done").length;

  const timelineData = useMemo(() => {
    const grouped = workflows.reduce<Record<string, { day: string; avgCompletion: number; count: number }>>(
      (acc, item) => {
        const dayKey = item.dueDate;
        if (!acc[dayKey]) {
          acc[dayKey] = { day: format(new Date(dayKey), "MMM d"), avgCompletion: 0, count: 0 };
        }

        acc[dayKey].count += 1;
        acc[dayKey].avgCompletion += item.completion;

        return acc;
      },
      {},
    );

    return Object.values(grouped).map((entry) => ({
      day: entry.day,
      avgCompletion: Math.round(entry.avgCompletion / entry.count),
      count: entry.count,
    }));
  }, [workflows]);

  const channelData = useMemo(() => {
    const stats = workflows.reduce<Record<WorkflowChannel, number>>(
      (acc, item) => {
        acc[item.channel] += 1;
        return acc;
      },
      { email: 0, social: 0, ads: 0, website: 0 },
    );

    return [
      { name: "Email", total: stats.email },
      { name: "Social", total: stats.social },
      { name: "Ads", total: stats.ads },
      { name: "Website", total: stats.website },
    ];
  }, [workflows]);

  const handleCreateWorkflow = () => {
    if (!title.trim()) return;

    const parsedCompletion = Number(completion);
    const safeCompletion = Number.isNaN(parsedCompletion)
      ? 0
      : Math.max(0, Math.min(100, parsedCompletion));

    setWorkflows((current) => [
      {
        id: Date.now(),
        title: title.trim(),
        channel,
        status,
        completion: safeCompletion,
        dueDate,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);

    setTitle("");
    setChannel("email");
    setStatus("planned");
    setCompletion("0");
  };

  return (
    <div className="min-h-full gradient-mesh">
      <div className="max-w-7xl mx-auto p-6 lg:p-8 xl:p-12 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gradient-purple">Client Daily Workflow</h1>
            <p className="text-lg text-muted-foreground">Plan today’s work and track progress with live charts.</p>
          </div>
          <Badge variant="secondary" className="w-fit text-sm py-1 px-3">
            <CalendarDays className="w-4 h-4 mr-2" />
            {format(new Date(), "EEEE, MMM d")}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create Workflow
              </CardTitle>
              <CardDescription>Add a daily task and include progress details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workflow-title">Task title</Label>
                <Input
                  id="workflow-title"
                  placeholder="Ex: Follow up on yesterday leads"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Channel</Label>
                <Select value={channel} onValueChange={(value) => setChannel(value as WorkflowChannel)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="ads">Ads</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as WorkflowStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="workflow-completion">Completion %</Label>
                  <Input
                    id="workflow-completion"
                    type="number"
                    min={0}
                    max={100}
                    value={completion}
                    onChange={(event) => setCompletion(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workflow-due">Due date</Label>
                  <Input
                    id="workflow-due"
                    type="date"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                  />
                </div>
              </div>

              <Button className="w-full" onClick={handleCreateWorkflow} disabled={!title.trim()}>
                <Workflow className="w-4 h-4 mr-2" />
                Add workflow item
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Daily Progress Trend
              </CardTitle>
              <CardDescription>Average completion score by due date.</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="avgCompletion" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2 border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Today’s Workflow List</CardTitle>
              <CardDescription>
                {completedToday} of {workflows.length} items completed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {workflows.map((item) => (
                <div key={item.id} className="p-4 rounded-lg border bg-card/40 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Due {format(new Date(item.dueDate), "MMM d, yyyy")} · {item.channel}
                      </p>
                    </div>
                    <Badge variant={statusVariant[item.status]}>{statusLabel[item.status]}</Badge>
                  </div>
                  <Progress value={item.completion} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Workload by Channel</CardTitle>
              <CardDescription>How today’s workflow is distributed.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
