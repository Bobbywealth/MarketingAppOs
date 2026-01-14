import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  RotateCcw, 
  Bot, 
  Cpu, 
  FileText, 
  MessageSquare, 
  Mail, 
  Share2, 
  Target, 
  Info
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const CHANNELS = [
  { id: "email", label: "Email", icon: Mail },
  { id: "sms", label: "SMS/Text", icon: MessageSquare },
  { id: "social", label: "Social Media", icon: Share2 },
  { id: "blog", label: "Blog Post", icon: FileText },
  { id: "ad", label: "Ad Copy", icon: Target },
];

export default function AIContentGenerator() {
  const { toast } = useToast();
  const [provider, setProvider] = useState<"openai" | "gemini">("openai");
  const [channel, setChannel] = useState("email");
  const [prompt, setPrompt] = useState("");
  const [audience, setAudience] = useState("");
  const [context, setContext] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [copied, setCopied] = useState(false);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/ai/generate-content", data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setGeneratedContent(data.content);
        toast({
          title: "Content Generated",
          description: `Successfully generated content using ${provider === 'openai' ? 'OpenAI' : 'Google Gemini'}.`,
        });
      } else {
        toast({
          title: "Generation Failed",
          description: data.error || "Something went wrong",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to connect to the AI service",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({
        title: "Missing Prompt",
        description: "Please enter what you want to generate.",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate({
      prompt,
      channel,
      audience,
      context,
      provider,
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard.",
    });
  };

  const resetForm = () => {
    setPrompt("");
    setAudience("");
    setContext("");
    setGeneratedContent("");
  };

  return (
    <div className="container mx-auto py-8 max-w-5xl space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            AI Content Generator
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate high-converting marketing content using top-tier AI models.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border">
          <Button 
            variant={provider === "openai" ? "default" : "ghost"} 
            size="sm" 
            className="gap-2"
            onClick={() => setProvider("openai")}
          >
            <Bot className="h-4 w-4" />
            OpenAI
          </Button>
          <Button 
            variant={provider === "gemini" ? "default" : "ghost"} 
            size="sm" 
            className="gap-2"
            onClick={() => setProvider("gemini")}
          >
            <Cpu className="h-4 w-4" />
            Gemini
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Define what you want to create</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Content Channel</Label>
                <div className="grid grid-cols-3 gap-2">
                  {CHANNELS.map((item) => (
                    <Button
                      key={item.id}
                      variant={channel === item.id ? "default" : "outline"}
                      className="h-auto py-3 flex-col gap-1 text-xs"
                      onClick={() => setChannel(item.id)}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt">What should I write about?</Label>
                <Textarea
                  id="prompt"
                  placeholder="e.g. A follow-up email for a lead who just watched our demo video..."
                  className="min-h-[120px]"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience (Optional)</Label>
                <Input
                  id="audience"
                  placeholder="e.g. Small business owners in healthcare"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="context">Additional Context (Optional)</Label>
                <Textarea
                  id="context"
                  placeholder="e.g. Include a 20% discount code: SAVE20. Mention our new features."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button 
                className="flex-1 gap-2" 
                onClick={handleGenerate}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <RotateCcw className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Generate Content
                  </>
                )}
              </Button>
              <Button variant="outline" size="icon" onClick={resetForm}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>

          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4 flex gap-3">
            <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              <strong>Pro Tip:</strong> Be specific about your brand's voice and the specific outcome you want. 
              The more context you provide, the better the AI can tailor the content to your needs.
            </p>
          </div>
        </div>

        {/* Output Section */}
        <div className="lg:col-span-7">
          <Card className="h-full flex flex-col min-h-[500px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle>Generated Result</CardTitle>
                <CardDescription>Your AI-crafted content will appear here</CardDescription>
              </div>
              {generatedContent && (
                <div className="flex gap-2">
                  <Badge variant="outline" className="capitalize">
                    {provider}
                  </Badge>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={copyToClipboard}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="flex-1 pt-6 overflow-auto">
              {!generatedContent && !mutation.isPending && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg opacity-50">
                  <Bot className="h-12 w-12 mb-4" />
                  <h3 className="text-lg font-medium">Ready to create?</h3>
                  <p className="text-sm text-muted-foreground max-w-[250px]">
                    Fill in the details on the left and click generate to see the magic happen.
                  </p>
                </div>
              )}

              {mutation.isPending && (
                <div className="h-full flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                    <Sparkles className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <p className="text-sm font-medium animate-pulse text-muted-foreground">
                    Consulting with {provider === 'openai' ? 'GPT-4o' : 'Gemini 1.5'}...
                  </p>
                </div>
              )}

              {generatedContent && (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {generatedContent}
                  </ReactMarkdown>
                </div>
              )}
            </CardContent>
            {generatedContent && (
              <CardFooter className="border-t pt-4 bg-muted/30">
                <p className="text-[10px] text-muted-foreground italic">
                  Note: AI-generated content may require human editing for accuracy and brand consistency.
                </p>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
