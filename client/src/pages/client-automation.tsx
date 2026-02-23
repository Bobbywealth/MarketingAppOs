import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Workflow, 
  Plus, 
  Play, 
  Pause, 
  Save, 
  Trash2, 
  Copy, 
  MoreHorizontal,
  Clock,
  Mail,
  MessageSquare,
  Calendar,
  Zap,
  Webhook,
  Database,
  FileText,
  Bell,
  CheckCircle,
  XCircle,
  ChevronRight,
  Settings,
  GripVertical,
  Activity,
  Target,
  Users,
  ShoppingCart,
  CreditCard,
  RefreshCw,
  ArrowRight,
  MousePointer
} from "lucide-react";

// Node types
type NodeType = "trigger" | "action" | "condition" | "filter";

interface WorkflowNode {
  id: string;
  type: NodeType;
  name: string;
  icon: React.ReactNode;
  category: string;
  color: string;
  config: Record<string, any>;
  position: { x: number; y: number };
}

interface WorkflowConnection {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive" | "draft";
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  createdAt: string;
  updatedAt: string;
  lastRun?: string;
  triggerCount: number;
}

// Available node templates
const nodeTemplates: Omit<WorkflowNode, "id" | "position">[] = [
  // Triggers
  { type: "trigger", name: "Schedule", icon: <Clock className="w-4 h-4" />, category: "Triggers", color: "bg-blue-500", config: { schedule: "daily", time: "09:00" } },
  { type: "trigger", name: "Email Received", icon: <Mail className="w-4 h-4" />, category: "Triggers", color: "bg-blue-500", config: { filter: "" } },
  { type: "trigger", name: "Form Submit", icon: <FileText className="w-4 h-4" />, category: "Triggers", color: "bg-blue-500", config: { formId: "" } },
  { type: "trigger", name: "Webhook", icon: <Webhook className="w-4 h-4" />, category: "Triggers", color: "bg-blue-500", config: { webhookUrl: "" } },
  { type: "trigger", name: "New Lead", icon: <Target className="w-4 h-4" />, category: "Triggers", color: "bg-blue-500", config: { source: "" } },
  
  // Actions
  { type: "action", name: "Send Email", icon: <Mail className="w-4 h-4" />, category: "Actions", color: "bg-green-500", config: { to: "", subject: "", body: "" } },
  { type: "action", name: "Send SMS", icon: <MessageSquare className="w-4 h-4" />, category: "Actions", color: "bg-green-500", config: { to: "", message: "" } },
  { type: "action", name: "Create Task", icon: <CheckCircle className="w-4 h-4" />, category: "Actions", color: "bg-green-500", config: { title: "", assignee: "" } },
  { type: "action", name: "Add to List", icon: <Users className="w-4 h-4" />, category: "Actions", color: "bg-green-500", config: { listId: "" } },
  { type: "action", name: "Update Record", icon: <Database className="w-4 h-4" />, category: "Actions", color: "bg-green-500", config: { table: "", fields: {} } },
  { type: "action", name: "Send Notification", icon: <Bell className="w-4 h-4" />, category: "Actions", color: "bg-green-500", config: { title: "", message: "" } },
  { type: "action", name: "Webhook Call", icon: <Zap className="w-4 h-4" />, category: "Actions", color: "bg-green-500", config: { url: "", method: "POST" } },
  
  // Conditions
  { type: "condition", name: "If/Else", icon: <Activity className="w-4 h-4" />, category: "Logic", color: "bg-yellow-500", config: { field: "", operator: "equals", value: "" } },
  { type: "condition", name: "Filter", icon: <RefreshCw className="w-4 h-4" />, category: "Logic", color: "bg-yellow-500", config: { conditions: [] } },
  { type: "condition", name: "Wait", icon: <Clock className="w-4 h-4" />, category: "Logic", color: "bg-yellow-500", config: { duration: 1, unit: "hours" } },
];

// Sample workflows
const sampleWorkflows: Workflow[] = [
  {
    id: "1",
    name: "New Lead Follow-up",
    description: "Automatically send welcome email and create task when new lead is added",
    status: "active",
    nodes: [
      { id: "n1", type: "trigger", name: "New Lead", icon: <Target className="w-4 h-4" />, category: "Triggers", color: "bg-blue-500", config: {}, position: { x: 100, y: 200 } },
      { id: "n2", type: "action", name: "Send Email", icon: <Mail className="w-4 h-4" />, category: "Actions", color: "bg-green-500", config: {}, position: { x: 350, y: 150 } },
      { id: "n3", type: "action", name: "Create Task", icon: <CheckCircle className="w-4 h-4" />, category: "Actions", color: "bg-green-500", config: {}, position: { x: 350, y: 300 } },
    ],
    connections: [
      { id: "c1", sourceId: "n1", targetId: "n2" },
      { id: "c2", sourceId: "n1", targetId: "n3" },
    ],
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-20T14:30:00Z",
    lastRun: "2024-01-22T09:15:00Z",
    triggerCount: 145,
  },
  {
    id: "2",
    name: "Invoice Reminder",
    description: "Send payment reminder 7 days before due date and follow up after",
    status: "active",
    nodes: [
      { id: "n1", type: "trigger", name: "Schedule", icon: <Clock className="w-4 h-4" />, category: "Triggers", color: "bg-blue-500", config: {}, position: { x: 100, y: 200 } },
      { id: "n2", type: "condition", name: "If/Else", icon: <Activity className="w-4 h-4" />, category: "Logic", color: "bg-yellow-500", config: {}, position: { x: 350, y: 200 } },
      { id: "n3", type: "action", name: "Send Email", icon: <Mail className="w-4 h-4" />, category: "Actions", color: "bg-green-500", config: {}, position: { x: 600, y: 100 } },
    ],
    connections: [
      { id: "c1", sourceId: "n1", targetId: "n2" },
      { id: "c2", sourceId: "n2", targetId: "n3" },
    ],
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-18T11:00:00Z",
    lastRun: "2024-01-22T08:00:00Z",
    triggerCount: 89,
  },
  {
    id: "3",
    name: "Welcome Sequence",
    description: "Onboard new clients with automated email sequence",
    status: "draft",
    nodes: [
      { id: "n1", type: "trigger", name: "Form Submit", icon: <FileText className="w-4 h-4" />, category: "Triggers", color: "bg-blue-500", config: {}, position: { x: 100, y: 200 } },
    ],
    connections: [],
    createdAt: "2024-01-20T15:00:00Z",
    updatedAt: "2024-01-20T15:00:00Z",
    triggerCount: 0,
  },
];

export default function ClientAutomation() {
  const [workflows, setWorkflows] = useState<Workflow[]>(sampleWorkflows);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(workflows[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [showNodePanel, setShowNodePanel] = useState(true);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [draggedNode, setDraggedNode] = useState<Omit<WorkflowNode, "id" | "position"> | null>(null);
  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");

  const handleSelectWorkflow = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setWorkflowName(workflow.name);
    setWorkflowDescription(workflow.description);
    setIsEditing(false);
    setSelectedNode(null);
  };

  const handleCreateWorkflow = () => {
    const newWorkflow: Workflow = {
      id: Date.now().toString(),
      name: "New Workflow",
      description: "",
      status: "draft",
      nodes: [],
      connections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      triggerCount: 0,
    };
    setWorkflows([...workflows, newWorkflow]);
    setSelectedWorkflow(newWorkflow);
    setWorkflowName(newWorkflow.name);
    setWorkflowDescription("");
    setIsEditing(true);
  };

  const handleSaveWorkflow = () => {
    if (!selectedWorkflow) return;
    
    const updatedWorkflow = {
      ...selectedWorkflow,
      name: workflowName,
      description: workflowDescription,
      updatedAt: new Date().toISOString(),
    };
    
    setWorkflows(workflows.map(w => w.id === updatedWorkflow.id ? updatedWorkflow : w));
    setSelectedWorkflow(updatedWorkflow);
    setIsEditing(false);
  };

  const handleDeleteWorkflow = (id: string) => {
    setWorkflows(workflows.filter(w => w.id !== id));
    if (selectedWorkflow?.id === id) {
      setSelectedWorkflow(null);
    }
  };

  const handleToggleStatus = (workflow: Workflow) => {
    const newStatus = workflow.status === "active" ? "inactive" : "active";
    const updated = { ...workflow, status: newStatus, updatedAt: new Date().toISOString() };
    setWorkflows(workflows.map(w => w.id === workflow.id ? updated : w));
    if (selectedWorkflow?.id === workflow.id) {
      setSelectedWorkflow(updated);
    }
  };

  const handleDragStart = (template: Omit<WorkflowNode, "id" | "position">) => {
    setDraggedNode(template);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedNode || !selectedWorkflow || !isEditing) return;
    
    const canvas = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - canvas.left - 50;
    const y = e.clientY - canvas.top - 25;
    
    const newNode: WorkflowNode = {
      ...draggedNode,
      id: `node-${Date.now()}`,
      position: { x: Math.max(0, x), y: Math.max(0, y) },
    };
    
    const updatedWorkflow = {
      ...selectedWorkflow,
      nodes: [...selectedWorkflow.nodes, newNode],
      updatedAt: new Date().toISOString(),
    };
    
    setWorkflows(workflows.map(w => w.id === selectedWorkflow.id ? updatedWorkflow : w));
    setSelectedWorkflow(updatedWorkflow);
    setDraggedNode(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleNodeClick = (node: WorkflowNode) => {
    setSelectedNode(node);
  };

  const handleDeleteNode = (nodeId: string) => {
    if (!selectedWorkflow) return;
    
    const updatedWorkflow = {
      ...selectedWorkflow,
      nodes: selectedWorkflow.nodes.filter(n => n.id !== nodeId),
      connections: selectedWorkflow.connections.filter(c => c.sourceId !== nodeId && c.targetId !== nodeId),
      updatedAt: new Date().toISOString(),
    };
    
    setWorkflows(workflows.map(w => w.id === selectedWorkflow.id ? updatedWorkflow : w));
    setSelectedWorkflow(updatedWorkflow);
    setSelectedNode(null);
  };

  const handleConnectNodes = (sourceId: string, targetId: string) => {
    if (!selectedWorkflow) return;
    
    const newConnection: WorkflowConnection = {
      id: `conn-${Date.now()}`,
      sourceId,
      targetId,
    };
    
    const updatedWorkflow = {
      ...selectedWorkflow,
      connections: [...selectedWorkflow.connections, newConnection],
      updatedAt: new Date().toISOString(),
    };
    
    setWorkflows(workflows.map(w => w.id === selectedWorkflow.id ? updatedWorkflow : w));
    setSelectedWorkflow(updatedWorkflow);
  };

  const groupedNodes = useMemo(() => {
    const groups: Record<string, typeof nodeTemplates> = {};
    nodeTemplates.forEach(template => {
      if (!groups[template.category]) {
        groups[template.category] = [];
      }
      groups[template.category].push(template);
    });
    return groups;
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "inactive": return "bg-gray-400";
      case "draft": return "bg-yellow-500";
      default: return "bg-gray-400";
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left Sidebar - Workflow List */}
      <div className="w-80 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Workflow className="w-5 h-5" />
              Automations
            </h2>
            <Button size="sm" onClick={handleCreateWorkflow}>
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
          </div>
          <Input placeholder="Search workflows..." className="h-9" />
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {workflows.map(workflow => (
              <div
                key={workflow.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedWorkflow?.id === workflow.id 
                    ? "bg-primary/10 border border-primary/30" 
                    : "hover:bg-muted"
                }`}
                onClick={() => handleSelectWorkflow(workflow)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{workflow.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{workflow.description || "No description"}</p>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`${getStatusColor(workflow.status)} text-white text-xs`}
                  >
                    {workflow.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {workflow.triggerCount} runs
                  </span>
                  {workflow.lastRun && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(workflow.lastRun).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedWorkflow ? (
          <>
            {/* Header */}
            <div className="p-4 border-b bg-card flex items-center justify-between">
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      value={workflowName}
                      onChange={(e) => setWorkflowName(e.target.value)}
                      placeholder="Workflow name"
                      className="font-semibold text-lg"
                    />
                    <Input
                      value={workflowDescription}
                      onChange={(e) => setWorkflowDescription(e.target.value)}
                      placeholder="Description"
                      className="text-sm"
                    />
                  </div>
                ) : (
                  <div>
                    <h1 className="text-xl font-semibold">{selectedWorkflow.name}</h1>
                    <p className="text-sm text-muted-foreground">{selectedWorkflow.description}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveWorkflow}>
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleToggleStatus(selectedWorkflow)}
                    >
                      {selectedWorkflow.status === "active" ? (
                        <>
                          <Pause className="w-4 h-4 mr-1" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Settings className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-500 hover:text-red-600"
                      onClick={() => handleDeleteWorkflow(selectedWorkflow.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Workflow Builder */}
            <div className="flex-1 flex overflow-hidden">
              {/* Node Panel */}
              {isEditing && (
                <div className="w-64 border-r bg-card overflow-y-auto">
                  <div className="p-3 border-b">
                    <h3 className="font-semibold text-sm">Nodes</h3>
                  </div>
                  <div className="p-2 space-y-3">
                    {Object.entries(groupedNodes).map(([category, templates]) => (
                      <div key={category}>
                        <p className="text-xs font-medium text-muted-foreground px-2 mb-2">{category}</p>
                        <div className="space-y-1">
                          {templates.map((template, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 p-2 rounded-md bg-muted hover:bg-muted/80 cursor-grab transition-colors"
                              draggable
                              onDragStart={() => handleDragStart(template)}
                            >
                              <div className={`w-6 h-6 rounded-md ${template.color} flex items-center justify-center text-white`}>
                                {template.icon}
                              </div>
                              <span className="text-sm">{template.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Canvas */}
              <div 
                className={`flex-1 relative ${isEditing ? 'bg-slate-50' : 'bg-muted/30'}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                {isEditing ? (
                  <div className="absolute inset-0 overflow-auto">
                    {/* Grid Background */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                    </svg>
                    
                    {/* Connections */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      {selectedWorkflow.connections.map(conn => {
                        const source = selectedWorkflow.nodes.find(n => n.id === conn.sourceId);
                        const target = selectedWorkflow.nodes.find(n => n.id === conn.targetId);
                        if (!source || !target) return null;
                        
                        const x1 = source.position.x + 50;
                        const y1 = source.position.y + 25;
                        const x2 = target.position.x + 50;
                        const y2 = target.position.y + 25;
                        
                        return (
                          <g key={conn.id}>
                            <path
                              d={`M ${x1} ${y1} C ${x1 + 50} ${y1}, ${x2 - 50} ${y2}, ${x2} ${y2}`}
                              stroke="#64748b"
                              strokeWidth="2"
                              fill="none"
                              markerEnd="url(#arrowhead)"
                            />
                          </g>
                        );
                      })}
                      <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                          <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                        </marker>
                      </defs>
                    </svg>

                    {/* Nodes */}
                    {selectedWorkflow.nodes.map(node => (
                      <div
                        key={node.id}
                        className={`absolute w-[100px] cursor-pointer transition-transform hover:scale-105 ${
                          selectedNode?.id === node.id ? 'ring-2 ring-primary' : ''
                        }`}
                        style={{ 
                          left: node.position.x, 
                          top: node.position.y,
                        }}
                        onClick={() => handleNodeClick(node)}
                      >
                        <div className={`${node.color} rounded-t-lg px-2 py-1 text-white text-xs font-medium flex items-center gap-1`}>
                          {node.icon}
                          {node.type}
                        </div>
                        <div className="bg-white rounded-b-lg shadow-md border border-t-0 p-2 text-center">
                          <p className="text-sm font-medium truncate">{node.name}</p>
                        </div>
                        {/* Connection Points */}
                        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full border-2 border-white cursor-crosshair hover:bg-primary/80" 
                          onClick={(e) => {
                            e.stopPropagation();
                            // Start connection drag
                          }}
                        />
                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary rounded-full cursor-crosshair hover:bg-primary/20" 
                          onClick={(e) => {
                            e.stopPropagation();
                            // Accept connection
                          }}
                        />
                      </div>
                    ))}

                    {/* Drop Hint */}
                    {selectedWorkflow.nodes.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <MousePointer className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="font-medium">Drag nodes here to build your workflow</p>
                          <p className="text-sm">Start with a trigger from the left panel</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // View Mode - Visual Flow Display
                  <div className="p-8 overflow-auto h-full">
                    <div className="max-w-3xl mx-auto">
                      {/* Flow Visualization */}
                      <div className="flex items-center justify-center gap-4 flex-wrap">
                        {selectedWorkflow.nodes.map((node, idx) => (
                          <div key={node.id} className="flex items-center">
                            <div className="flex flex-col items-center">
                              <div className={`${node.color} w-16 h-16 rounded-xl flex items-center justify-center text-white shadow-lg`}>
                                {node.icon}
                              </div>
                              <p className="mt-2 text-sm font-medium">{node.name}</p>
                              <Badge variant="outline" className="mt-1 text-xs">{node.category}</Badge>
                            </div>
                            {idx < selectedWorkflow.nodes.length - 1 && (
                              <ArrowRight className="w-6 h-6 mx-2 text-muted-foreground" />
                            )}
                          </div>
                        ))}
                        {selectedWorkflow.nodes.length === 0 && (
                          <div className="text-center py-12">
                            <Workflow className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <p className="text-muted-foreground">No nodes configured</p>
                            <Button variant="outline" className="mt-4" onClick={() => setIsEditing(true)}>
                              Start Building
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Stats Cards */}
                      <div className="grid grid-cols-3 gap-4 mt-8">
                        <Card>
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <Zap className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-2xl font-bold">{selectedWorkflow.triggerCount}</p>
                                <p className="text-xs text-muted-foreground">Total Runs</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <p className="text-2xl font-bold">
                                  {selectedWorkflow.nodes.filter(n => n.type === "action").length}
                                </p>
                                <p className="text-xs text-muted-foreground">Actions</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                                <Activity className="w-5 h-5 text-yellow-600" />
                              </div>
                              <div>
                                <p className="text-2xl font-bold">
                                  {selectedWorkflow.nodes.filter(n => n.type === "condition").length}
                                </p>
                                <p className="text-xs text-muted-foreground">Conditions</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Properties Panel */}
              {selectedNode && isEditing && (
                <div className="w-72 border-l bg-card">
                  <div className="p-3 border-b flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Node Properties</h3>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedNode(null)}>
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                  <ScrollArea className="h-[calc(100vh-12rem)]">
                    <div className="p-4 space-y-4">
                      <div>
                        <Label className="text-xs">Node Name</Label>
                        <Input value={selectedNode.name} className="mt-1" readOnly />
                      </div>
                      <div>
                        <Label className="text-xs">Type</Label>
                        <Badge variant="outline" className="mt-1 block w-fit">{selectedNode.type}</Badge>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <Label className="text-xs">Configuration</Label>
                        <div className="mt-2 space-y-2">
                          {Object.entries(selectedNode.config).length > 0 ? (
                            Object.entries(selectedNode.config).map(([key, value]) => (
                              <div key={key}>
                                <Label className="text-xs capitalize">{key}</Label>
                                <Input 
                                  value={value as string} 
                                  className="mt-1" 
                                  placeholder={`Enter ${key}...`}
                                />
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground">No configuration needed</p>
                          )}
                        </div>
                      </div>

                      <Separator />

                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleDeleteNode(selectedNode.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete Node
                      </Button>
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Workflow className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Workflow Selected</h3>
              <p className="text-muted-foreground mb-4">Select a workflow from the list or create a new one</p>
              <Button onClick={handleCreateWorkflow}>
                <Plus className="w-4 h-4 mr-1" />
                Create Workflow
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
