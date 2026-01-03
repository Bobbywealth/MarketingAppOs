import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Search, Building2, Megaphone, Users, FileText, DollarSign, Ticket } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

interface SearchResults {
  clients: Array<{ id: string; name: string; company?: string; email?: string }>;
  campaigns: Array<{ id: string; name: string; description?: string }>;
  leads: Array<{ id: string; name: string; email?: string; company?: string }>;
  contentPosts: Array<{ id: string; title: string; channel?: string }>;
  invoices: Array<{ id: string; invoiceNumber: string; amount: number }>;
  tickets: Array<{ id: string; subject: string; priority?: string }>;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

  const { data: results } = useQuery<SearchResults>({
    queryKey: ["/api/search", searchQuery],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Search failed");
      }
      return res.json();
    },
    enabled: searchQuery.length >= 2,
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // App-wide keyboard shortcut hook can dispatch this event
  useEffect(() => {
    const openSearch = () => setOpen(true);
    window.addEventListener("mta:open-global-search", openSearch as EventListener);
    return () => window.removeEventListener("mta:open-global-search", openSearch as EventListener);
  }, []);

  const handleSelect = useCallback((path: string) => {
    setOpen(false);
    setSearchQuery("");
    setLocation(path);
  }, [setLocation]);

  const hasResults = results && (
    results.clients.length > 0 ||
    results.campaigns.length > 0 ||
    results.leads.length > 0 ||
    results.contentPosts.length > 0 ||
    results.invoices.length > 0 ||
    results.tickets.length > 0
  );

  return (
    <>
      <Button
        variant="outline"
        className="relative w-10 h-10 p-0 md:w-40 lg:w-64 md:px-4 md:py-2 md:justify-start text-sm text-muted-foreground rounded-xl border-2 hover:bg-primary/10 hover:border-primary transition-all"
        onClick={() => setOpen(true)}
        aria-label="Open global search"
        data-testid="button-global-search"
      >
        <Search className="h-5 w-5 md:h-4 md:w-4 md:mr-2" />
        <span className="hidden md:inline-flex">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search clients, campaigns, leads, content, invoices, tickets..." 
          value={searchQuery}
          onValueChange={setSearchQuery}
          data-testid="input-search-query"
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {results?.clients && results.clients.length > 0 && (
            <CommandGroup heading="Clients">
              {results.clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={`client-${client.id}`}
                  onSelect={() => handleSelect(`/clients`)}
                  data-testid={`search-result-client-${client.id}`}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{client.name}</span>
                    {client.company && (
                      <span className="text-xs text-muted-foreground">{client.company}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results?.campaigns && results.campaigns.length > 0 && (
            <CommandGroup heading="Campaigns">
              {results.campaigns.map((campaign) => (
                <CommandItem
                  key={campaign.id}
                  value={`campaign-${campaign.id}`}
                  onSelect={() => handleSelect(`/campaigns`)}
                  data-testid={`search-result-campaign-${campaign.id}`}
                >
                  <Megaphone className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{campaign.name}</span>
                    {campaign.description && (
                      <span className="text-xs text-muted-foreground line-clamp-1">{campaign.description}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results?.leads && results.leads.length > 0 && (
            <CommandGroup heading="Leads">
              {results.leads.map((lead) => (
                <CommandItem
                  key={lead.id}
                  value={`lead-${lead.id}`}
                  onSelect={() => handleSelect(`/pipeline`)}
                  data-testid={`search-result-lead-${lead.id}`}
                >
                  <Users className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{lead.name}</span>
                    {lead.company && (
                      <span className="text-xs text-muted-foreground">{lead.company}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results?.contentPosts && results.contentPosts.length > 0 && (
            <CommandGroup heading="Content">
              {results.contentPosts.map((post) => (
                <CommandItem
                  key={post.id}
                  value={`content-${post.id}`}
                  onSelect={() => handleSelect(`/content`)}
                  data-testid={`search-result-content-${post.id}`}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{post.title}</span>
                    {post.channel && (
                      <span className="text-xs text-muted-foreground capitalize">{post.channel}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results?.invoices && results.invoices.length > 0 && (
            <CommandGroup heading="Invoices">
              {results.invoices.map((invoice) => (
                <CommandItem
                  key={invoice.id}
                  value={`invoice-${invoice.id}`}
                  onSelect={() => handleSelect(`/invoices`)}
                  data-testid={`search-result-invoice-${invoice.id}`}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{invoice.invoiceNumber}</span>
                    <span className="text-xs text-muted-foreground">${invoice.amount.toLocaleString()}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results?.tickets && results.tickets.length > 0 && (
            <CommandGroup heading="Tickets">
              {results.tickets.map((ticket) => (
                <CommandItem
                  key={ticket.id}
                  value={`ticket-${ticket.id}`}
                  onSelect={() => handleSelect(`/tickets`)}
                  data-testid={`search-result-ticket-${ticket.id}`}
                >
                  <Ticket className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{ticket.subject}</span>
                    {ticket.priority && (
                      <span className="text-xs text-muted-foreground capitalize">{ticket.priority}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
