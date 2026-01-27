# Printing Setup Guide for MarketingOS

This guide covers how to implement printing functionality in your MarketingOS application, including both standard web printing and advanced auto-printing capabilities.

## 🖨️ What's Been Implemented

We've added comprehensive printing functionality to MarketingOS with the following components:

### Core Components
- **PrintService** (`/client/src/utils/printUtils.ts`) - Core printing utilities and PDF generation
- **PrintButton Components** (`/client/src/components/PrintButton.tsx`) - Reusable print buttons
- **Print Stylesheet** (`/client/src/styles/print.css`) - Professional print formatting

### Integration Examples
- **Invoice Dashboard** - Print financial reports and analytics
- **Analytics Dashboard** - Print performance reports with charts
- **Client Detail Pages** - Print comprehensive client reports

## 📋 Features

### 1. **Standard Browser Printing**
- Clean, professional print layouts
- Hide navigation, buttons, and interactive elements
- Optimized typography and spacing
- Grayscale color scheme for better printing

### 2. **PDF Generation**
- Professional invoice PDFs with company branding
- Client analytics reports with key metrics
- Visit reports with details and status
- Customizable templates for different document types

### 3. **Auto-Print Capability**
- Silent printing using `pdf.autoPrint()` 
- Automatic printer selection (browser dependent)
- Background PDF generation and printing
- User-friendly progress indicators

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install jspdf html2canvas
```

### 2. Import Print Utilities
```typescript
import { PrintButton, InvoicePrintButton } from "@/components/PrintButton";
import { usePrint } from "@/utils/printUtils";
```

### 3. Add Print Buttons to Your Pages

#### Simple Element Printing
```tsx
<PrintButton 
  elementId="dashboard-content"
  title="Dashboard Report"
  variant="outline"
  size="sm"
/>
```

#### Invoice Printing
```tsx
<InvoicePrintButton 
  invoice={invoiceData}
  variant="default"
/>
```

#### Analytics Report
```tsx
<AnalyticsPrintButton 
  elementId="analytics-dashboard"
  title="Monthly Analytics Report"
/>
```

### 4. Mark Content as Printable
```tsx
<div id="dashboard-content" className="print-container">
  {/* Your dashboard content */}
  <div className="no-print">
    <Button>This won't print</Button>
  </div>
</div>
```

## 🎨 Print Styling

### CSS Classes for Print Control

```css
/* Hide elements from print */
.no-print { display: none !important; }

/* Show only when printing */
.print-only { display: none; }
@media print {
  .print-only { display: block !important; }
}

/* Page breaks */
.page-break-before { page-break-before: always; }
.page-break-after { page-break-after: always; }
.avoid-break { page-break-inside: avoid; }
```

### Professional Invoice Template
```tsx
<div id="invoice-template" className="print-container">
  <div className="invoice-header">
    <h1>INVOICE</h1>
    <div className="no-print">
      <Button>Edit Invoice</Button>
    </div>
  </div>
  
  <div className="invoice-details">
    <div className="grid grid-cols-2">
      <div>
        <h3>Bill To:</h3>
        <p>{client.name}</p>
        <p>{client.address}</p>
      </div>
      <div>
        <p>Invoice #: {invoice.number}</p>
        <p>Date: {invoice.date}</p>
        <p>Due: {invoice.dueDate}</p>
      </div>
    </div>
  </div>
  
  <table className="invoice-items">
    <thead>
      <tr>
        <th>Description</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      {items.map(item => (
        <tr key={item.id}>
          <td>{item.description}</td>
          <td>${item.amount}</td>
        </tr>
      ))}
    </tbody>
  </table>
  
  <div className="invoice-total">
    Total: ${invoice.total}
  </div>
</div>
```

## 🔧 Advanced Features

### Custom PDF Generation
```typescript
import { usePrint } from "@/utils/printUtils";

const { printElement } = usePrint();

const handleCustomPrint = async () => {
  const customCSS = `
    .custom-header { 
      background: #f0f0f0; 
      padding: 20px; 
      text-align: center; 
    }
    .highlight { 
      background: yellow; 
      font-weight: bold; 
    }
  `;
  
  await printElement("my-content", customCSS);
};
```

### Auto-Print Setup
```typescript
const handleAutoPrint = async () => {
  // This will automatically trigger printer dialog
  await printInvoice(invoiceData, true); // true = autoPrint
};
```

## 🖨️ Auto-Printer Configuration

### Browser Requirements
- **Chrome/Edge**: Best support for auto-printing
- **Firefox**: Limited auto-print, requires user confirmation
- **Safari**: Requires user interaction for all printing

### Enable Auto-Print in Chrome
1. Go to `chrome://settings/content/pdfs`
2. Enable "Download PDF files instead of automatically opening them"
3. Or use Chrome flags: `chrome://flags/#print-preview-cros-app`

### Kiosk/Server Setup for Auto-Printing
```bash
# Chrome in kiosk mode with auto-print
google-chrome \
  --kiosk \
  --print-to-pdf \
  --print-to-pdf-no-header \
  --disable-background-timer-throttling \
  --disable-renderer-backgrounding \
  --disable-backgrounding-occluded-windows
```

## 📱 Mobile Considerations

### Mobile Print Support
```typescript
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

if (isMobile) {
  // Show share options instead of direct print
  if (navigator.share) {
    await navigator.share({
      title: 'Invoice Report',
      text: 'Your invoice is ready',
      url: pdfBlobUrl
    });
  }
}
```

## 🔐 Security Considerations

### Content Security Policy
```typescript
// Allow PDF generation domains
const cspDirectives = {
  'script-src': ["'self'", "'unsafe-inline'"],
  'object-src': ["'none'"],
  'frame-src': ["'self'", "blob:"]
};
```

### Data Sanitization
```typescript
import DOMPurify from 'dompurify';

const sanitizeContent = (content: string) => {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['div', 'p', 'h1', 'h2', 'h3', 'table', 'tr', 'td', 'th'],
    ALLOWED_ATTR: ['class', 'id']
  });
};
```

## 🚀 Deployment & Production

### Server-Side Printing (Optional)
For enterprise environments, you might want server-side PDF generation:

```typescript
// server/routes/print.ts
import puppeteer from 'puppeteer';

app.post('/api/print/pdf', async (req, res) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setContent(req.body.html);
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '1in', bottom: '1in', left: '1in', right: '1in' }
  });
  
  await browser.close();
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="report.pdf"');
  res.send(pdf);
});
```

### Print Queue Management
```typescript
// For high-volume printing environments
class PrintQueue {
  private queue: PrintJob[] = [];
  private processing = false;
  
  async addJob(job: PrintJob) {
    this.queue.push(job);
    if (!this.processing) {
      await this.processQueue();
    }
  }
  
  private async processQueue() {
    this.processing = true;
    while (this.queue.length > 0) {
      const job = this.queue.shift();
      await this.processPrintJob(job);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
    }
    this.processing = false;
  }
}
```

## 🛠️ Troubleshooting

### Common Issues

1. **Print Styles Not Applied**
   ```css
   /* Ensure print CSS is loaded */
   @media print {
     /* Your print styles must be in @media print blocks */
   }
   ```

2. **Auto-Print Not Working**
   - Check browser security settings
   - Ensure HTTPS (required for some auto-print features)
   - Test with `pdf.autoPrint()` directly

3. **PDF Generation Errors**
   ```typescript
   try {
     await printInvoice(data);
   } catch (error) {
     console.error('Print failed:', error);
     // Fallback to browser print
     window.print();
   }
   ```

4. **Mobile Printing Issues**
   ```typescript
   // Detect mobile and adjust print strategy
   const isMobile = window.innerWidth <= 768;
   if (isMobile) {
     // Use share API or simplified print
   }
   ```

## 📊 Analytics & Monitoring

Track printing usage:

```typescript
// Track print events
const trackPrint = (type: string, success: boolean) => {
  analytics.track('Print Action', {
    type,
    success,
    timestamp: Date.now(),
    userAgent: navigator.userAgent
  });
};
```

## 🎯 Use Cases in MarketingOS

1. **Client Reports** - Comprehensive client analytics and performance
2. **Invoice Generation** - Professional invoices with auto-print
3. **Visit Reports** - Creator visit summaries and documentation
4. **Analytics Dashboards** - Marketing performance reports
5. **Task Reports** - Project and task completion summaries
6. **Campaign Reports** - Marketing campaign performance analysis

## 📈 Next Steps

1. **Test the current implementation** - All pages with print buttons should work
2. **Customize PDF templates** - Modify `printUtils.ts` for your branding
3. **Add server-side printing** - For enterprise environments
4. **Implement print queues** - For high-volume scenarios
5. **Add print analytics** - Track usage and success rates

The printing functionality is now fully integrated and ready to use across your MarketingOS application! 🎉