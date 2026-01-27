import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PrintableData {
  title: string;
  content: any;
  type: 'invoice' | 'client-report' | 'analytics' | 'visit-report' | 'financial';
}

/**
 * Print utilities for MarketingOS
 */
export class PrintService {
  
  /**
   * Print an invoice with professional formatting
   */
  static async printInvoice(invoiceData: any, autoPrint = false) {
    const pdf = new jsPDF();
    
    // Header
    pdf.setFontSize(20);
    pdf.text('INVOICE', 20, 30);
    
    // Invoice details
    pdf.setFontSize(12);
    pdf.text(`Invoice #: ${invoiceData.invoiceNumber}`, 20, 50);
    pdf.text(`Date: ${new Date(invoiceData.issueDate).toLocaleDateString()}`, 20, 60);
    pdf.text(`Due: ${new Date(invoiceData.dueDate).toLocaleDateString()}`, 20, 70);
    
    // Client info
    pdf.text(`Bill To: ${invoiceData.clientName}`, 20, 90);
    if (invoiceData.clientAddress) {
      pdf.text(invoiceData.clientAddress, 20, 100);
    }
    
    // Items table
    let yPos = 130;
    pdf.text('Description', 20, yPos);
    pdf.text('Amount', 150, yPos);
    yPos += 10;
    
    invoiceData.items?.forEach((item: any) => {
      pdf.text(item.description, 20, yPos);
      pdf.text(`$${item.amount.toFixed(2)}`, 150, yPos);
      yPos += 10;
    });
    
    // Total
    yPos += 10;
    pdf.setFontSize(14);
    pdf.text(`Total: $${invoiceData.totalAmount}`, 150, yPos);
    
    if (autoPrint) {
      // Auto print the PDF
      pdf.autoPrint();
      window.open(pdf.output('bloburl'), '_blank');
    } else {
      // Regular download/view
      pdf.save(`invoice-${invoiceData.invoiceNumber}.pdf`);
    }
  }

  /**
   * Print client analytics report
   */
  static async printClientReport(clientId: string, clientData: any, analytics: any, autoPrint = false) {
    const pdf = new jsPDF();
    
    // Header
    pdf.setFontSize(20);
    pdf.text('CLIENT REPORT', 20, 30);
    
    // Client info
    pdf.setFontSize(14);
    pdf.text(`Client: ${clientData.name}`, 20, 50);
    pdf.text(`Company: ${clientData.company || 'N/A'}`, 20, 60);
    pdf.text(`Report Date: ${new Date().toLocaleDateString()}`, 20, 70);
    
    // Key metrics
    let yPos = 90;
    pdf.setFontSize(12);
    pdf.text('KEY METRICS', 20, yPos);
    yPos += 15;
    
    const metrics = [
      `Total Revenue: $${analytics.totalRevenue?.toLocaleString() || '0'}`,
      `Active Tasks: ${analytics.activeTasks || 0}`,
      `Social Followers: ${analytics.socialFollowers?.toLocaleString() || 'N/A'}`,
      `Active Campaigns: ${analytics.activeCampaigns || 0}`
    ];
    
    metrics.forEach(metric => {
      pdf.text(metric, 20, yPos);
      yPos += 10;
    });
    
    if (autoPrint) {
      pdf.autoPrint();
      window.open(pdf.output('bloburl'), '_blank');
    } else {
      pdf.save(`client-report-${clientData.name}-${new Date().toISOString().split('T')[0]}.pdf`);
    }
  }

  /**
   * Print analytics dashboard
   */
  static async printAnalytics(elementId: string, title: string, autoPrint = false) {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      
      // Header
      pdf.setFontSize(20);
      pdf.text(title.toUpperCase(), 20, 30);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 40);
      
      // Add chart/dashboard image
      const imgWidth = 170;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 20, 60, imgWidth, imgHeight);
      
      if (autoPrint) {
        pdf.autoPrint();
        window.open(pdf.output('bloburl'), '_blank');
      } else {
        pdf.save(`analytics-${new Date().toISOString().split('T')[0]}.pdf`);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Print visit report
   */
  static async printVisitReport(visit: any, autoPrint = false) {
    const pdf = new jsPDF();
    
    // Header
    pdf.setFontSize(20);
    pdf.text('VISIT REPORT', 20, 30);
    
    // Visit details
    pdf.setFontSize(12);
    pdf.text(`Client: ${visit.clientName}`, 20, 50);
    pdf.text(`Creator: ${visit.creatorName}`, 20, 60);
    pdf.text(`Date: ${new Date(visit.scheduledStart).toLocaleDateString()}`, 20, 70);
    pdf.text(`Status: ${visit.status}`, 20, 80);
    
    // Visit summary
    let yPos = 100;
    pdf.text('VISIT SUMMARY', 20, yPos);
    yPos += 15;
    
    if (visit.notes) {
      const notes = pdf.splitTextToSize(visit.notes, 170);
      pdf.text(notes, 20, yPos);
      yPos += notes.length * 5 + 10;
    }
    
    // Upload status
    pdf.text(`Upload Received: ${visit.uploadReceived ? 'Yes' : 'No'}`, 20, yPos);
    yPos += 10;
    pdf.text(`Approved: ${visit.approved ? 'Yes' : 'No'}`, 20, yPos);
    
    if (autoPrint) {
      pdf.autoPrint();
      window.open(pdf.output('bloburl'), '_blank');
    } else {
      pdf.save(`visit-report-${visit.id}.pdf`);
    }
  }

  /**
   * Print with custom styling for different components
   */
  static printWithStyles(elementId: string, customCSS?: string) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const printWindow = window.open('', '', 'height=600,width=800');
    const defaultCSS = `
      <style>
        body { font-family: system-ui, sans-serif; margin: 20px; }
        .no-print { display: none !important; }
        .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
        .grid { display: grid; gap: 16px; }
        .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
        .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
        .text-lg { font-size: 1.125rem; }
        .text-xl { font-size: 1.25rem; }
        .text-2xl { font-size: 1.5rem; }
        .font-bold { font-weight: bold; }
        .text-muted-foreground { color: #6b7280; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; border: 1px solid #e5e7eb; text-align: left; }
        th { background-color: #f9fafb; }
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
        }
      </style>
    `;

    printWindow?.document.write(`
      <html>
        <head>
          <title>Print</title>
          ${defaultCSS}
          ${customCSS ? `<style>${customCSS}</style>` : ''}
        </head>
        <body>${element.innerHTML}</body>
      </html>
    `);
    printWindow?.document.close();
    printWindow?.print();
    printWindow?.close();
  }
}

/**
 * React hook for printing functionality
 */
export const usePrint = () => {
  const printInvoice = (invoiceData: any, autoPrint = false) => {
    return PrintService.printInvoice(invoiceData, autoPrint);
  };

  const printClientReport = (clientId: string, clientData: any, analytics: any, autoPrint = false) => {
    return PrintService.printClientReport(clientId, clientData, analytics, autoPrint);
  };

  const printAnalytics = (elementId: string, title: string, autoPrint = false) => {
    return PrintService.printAnalytics(elementId, title, autoPrint);
  };

  const printElement = (elementId: string, customCSS?: string) => {
    return PrintService.printWithStyles(elementId, customCSS);
  };

  const printVisitReport = (visit: any, autoPrint = false) => {
    return PrintService.printVisitReport(visit, autoPrint);
  };

  return {
    printInvoice,
    printClientReport, 
    printAnalytics,
    printElement,
    printVisitReport
  };
};