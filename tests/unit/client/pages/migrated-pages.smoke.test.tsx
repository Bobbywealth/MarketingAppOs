import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn(() => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }));
const mockSetLocation = vi.fn();

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>("@tanstack/react-query");
  return {
    ...actual,
    useQuery: (...args: any[]) => mockUseQuery(...args),
    useMutation: (...args: any[]) => mockUseMutation(...args),
  };
});

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { id: 7, clientId: "client-1", firstName: "Demo", username: "demo user" },
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock("@/lib/queryClient", () => ({
  apiRequest: vi.fn(async () => ({ json: async () => ({}) })),
  queryClient: {
    invalidateQueries: vi.fn(),
  },
}));

vi.mock("wouter", async () => {
  const actual = await vi.importActual<typeof import("wouter")>("wouter");
  return {
    ...actual,
    useLocation: () => ["/client/second-me", mockSetLocation],
  };
});

vi.mock("recharts", () => {
  const MockWrap = ({ children }: any) => <div data-testid="recharts-mock">{children}</div>;
  const MockLeaf = () => null;

  return {
    ResponsiveContainer: MockWrap,
    LineChart: MockWrap,
    Line: MockLeaf,
    XAxis: MockLeaf,
    YAxis: MockLeaf,
    CartesianGrid: MockLeaf,
    Tooltip: MockLeaf,
    BarChart: MockWrap,
    Bar: MockLeaf,
  };
});

describe("migrated pages smoke render", () => {
  it("renders ClientDailyWorkflow with real-ish data props", async () => {
    mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
      if (queryKey[0] === "/api/tasks") {
        return {
          data: [
            {
              id: "task-1",
              title: "Publish campaign metrics",
              description: "Review weekly numbers",
              status: "todo",
              priority: "normal",
              dueDate: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              completedAt: null,
              clientId: "client-1",
              checklist: [{ id: "item-1", text: "Collect analytics", completed: false }],
              taskProgress: 0,
              isRecurring: true,
              recurringPattern: "daily",
              recurringInterval: 1,
            },
          ],
          isLoading: false,
        };
      }

      return { data: [], isLoading: false };
    });

    const { default: ClientDailyWorkflow } = await import("@/pages/client-daily-workflow");
    render(<ClientDailyWorkflow />);

    expect(screen.getByText("Client Daily Workflow")).toBeInTheDocument();
    expect(screen.getByText("Add workflow item")).toBeInTheDocument();
  });

  it("renders ClientSecondMeDashboard with API data mounted", async () => {
    mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
      if (queryKey[0] === "/api/second-me/character") {
        return {
          data: {
            id: "char-1",
            characterName: "Ava",
            vibe: "creative",
            mission: "Build engaging content",
            storyWords: "Bold. Friendly.",
            topics: ["marketing"],
            personalityType: "mentor",
            targetAudience: "Founders",
            contentStyle: "educational",
            bio: "Your AI content partner",
            photos: ["https://example.com/avatar.png"],
            weeklySubscriptionActive: true,
            createdAt: new Date().toISOString(),
          },
          isLoading: false,
        };
      }

      if (queryKey[0] === "/api/second-me/content") {
        return {
          data: [
            {
              id: "content-1",
              title: "Weekly social reel",
              type: "video",
              url: "https://example.com/video.mp4",
              createdAt: new Date().toISOString(),
            },
          ],
          isLoading: false,
        };
      }

      return { data: [], isLoading: false };
    });

    const { default: ClientSecondMeDashboard } = await import("@/pages/client-second-me-dashboard");
    render(<ClientSecondMeDashboard />);

    expect(screen.getByText(/AI-powered digital twin creating content for you/i)).toBeInTheDocument();
    expect(screen.getByText("Weekly social reel")).toBeInTheDocument();
  });
});
