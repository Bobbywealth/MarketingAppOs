import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Printer, FileText, Download, Settings } from "lucide-react";
import { usePrint } from "@/utils/printUtils";
import { useToast } from "@/hooks/use-toast";

interface PrintButtonProps {
  // Basic props
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  
  // Content to print
  elementId?: string; // ID of element to print
  data?: any; // Data for PDF generation
  
  // Print types
  type?: "invoice" | "client-report" | "analytics" | "visit-report" | "element";
  title?: string;
  
  // Auto print option
  showAutoPrint?: boolean;
  
  // Custom styles for print
  customCSS?: string;
  
  // Callbacks
  onPrintStart?: () => void;
  onPrintComplete?: () => void;
}

export function PrintButton({
  variant = "outline",
  size = "sm",
  elementId,
  data,
  type = "element",
  title = "Print",
  showAutoPrint = true,
  customCSS,
  onPrintStart,
  onPrintComplete
}: PrintButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { 
    printInvoice, 
    printClientReport, 
    printAnalytics, 
    printElement, 
    printVisitReport 
  } = usePrint();

  const handlePrint = async (autoPrint = false) => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      onPrintStart?.();

      switch (type) {
        case "invoice":
          if (data) {
            await printInvoice(data, autoPrint);
            toast({ title: autoPrint ? "🖨️ Auto printing..." : "📄 Invoice generated" });
          }
          break;
          
        case "client-report":
          if (data?.client && data?.analytics) {
            await printClientReport(data.clientId, data.client, data.analytics, autoPrint);
            toast({ title: autoPrint ? "🖨️ Auto printing report..." : "📊 Report generated" });
          }
          break;
          
        case "analytics":
          if (elementId) {
            await printAnalytics(elementId, title, autoPrint);
            toast({ title: autoPrint ? "🖨️ Auto printing analytics..." : "📈 Analytics exported" });
          }
          break;
          
        case "visit-report":
          if (data) {
            await printVisitReport(data, autoPrint);
            toast({ title: autoPrint ? "🖨️ Auto printing visit..." : "📋 Visit report generated" });
          }
          break;
          
        case "element":
        default:
          if (elementId) {
            printElement(elementId, customCSS);
            toast({ title: autoPrint ? "🖨️ Auto printing..." : "🖨️ Print dialog opened" });
          } else {
            // Fallback to browser print
            window.print();
          }
          break;
      }

      onPrintComplete?.();
    } catch (error) {
      console.error('Print error:', error);
      toast({ 
        title: "Print failed", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Simple print button
  if (!showAutoPrint) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => handlePrint(false)}
        disabled={isLoading}
        className="gap-2"
      >
        <Printer className="w-4 h-4" />
        {isLoading ? "Printing..." : "Print"}
      </Button>
    );
  }

  // Dropdown with print options
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={isLoading} className="gap-2">
          <Printer className="w-4 h-4" />
          {isLoading ? "Printing..." : "Print"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handlePrint(false)}>
          <FileText className="w-4 h-4 mr-2" />
          Generate PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handlePrint(true)}>
          <Printer className="w-4 h-4 mr-2" />
          Auto Print
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.print()}>
          <Settings className="w-4 h-4 mr-2" />
          Browser Print
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Specialized print buttons for common use cases
 */

export function InvoicePrintButton({ 
  invoice, 
  variant = "outline", 
  size = "sm" 
}: { 
  invoice: any; 
  variant?: PrintButtonProps['variant']; 
  size?: PrintButtonProps['size']; 
}) {
  return (
    <PrintButton
      type="invoice"
      data={invoice}
      variant={variant}
      size={size}
      title={`Invoice ${invoice?.invoiceNumber || ''}`}
    />
  );
}

export function ClientReportPrintButton({ 
  clientId, 
  client, 
  analytics, 
  variant = "outline", 
  size = "sm" 
}: { 
  clientId: string;
  client: any; 
  analytics: any;
  variant?: PrintButtonProps['variant']; 
  size?: PrintButtonProps['size']; 
}) {
  return (
    <PrintButton
      type="client-report"
      data={{ clientId, client, analytics }}
      variant={variant}
      size={size}
      title={`${client?.name} Report`}
    />
  );
}

export function AnalyticsPrintButton({ 
  elementId, 
  title, 
  variant = "outline", 
  size = "sm" 
}: { 
  elementId: string;
  title: string;
  variant?: PrintButtonProps['variant']; 
  size?: PrintButtonProps['size']; 
}) {
  return (
    <PrintButton
      type="analytics"
      elementId={elementId}
      title={title}
      variant={variant}
      size={size}
    />
  );
}

export function VisitReportPrintButton({ 
  visit, 
  variant = "outline", 
  size = "sm" 
}: { 
  visit: any;
  variant?: PrintButtonProps['variant']; 
  size?: PrintButtonProps['size']; 
}) {
  return (
    <PrintButton
      type="visit-report"
      data={visit}
      variant={variant}
      size={size}
      title={`Visit Report - ${visit?.clientName || 'Unknown'}`}
    />
  );
}