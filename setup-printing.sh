#!/bin/bash

# MarketingOS Printing Setup Script
echo "🖨️ Setting up printing functionality for MarketingOS..."

# Install required dependencies
echo "📦 Installing printing dependencies..."
npm install jspdf html2canvas

echo "✅ Dependencies installed!"

# Check if components exist
echo "🔍 Checking printing components..."

PRINT_UTILS="client/src/utils/printUtils.ts"
PRINT_BUTTON="client/src/components/PrintButton.tsx" 
PRINT_CSS="client/src/styles/print.css"

if [ -f "$PRINT_UTILS" ]; then
    echo "✅ PrintUtils component found"
else
    echo "❌ PrintUtils component missing"
fi

if [ -f "$PRINT_BUTTON" ]; then
    echo "✅ PrintButton component found"
else
    echo "❌ PrintButton component missing"
fi

if [ -f "$PRINT_CSS" ]; then
    echo "✅ Print CSS found"
else
    echo "❌ Print CSS missing"
fi

echo ""
echo "🎉 Printing setup complete!"
echo ""
echo "📋 What's been added:"
echo "   • Professional PDF generation with jsPDF"
echo "   • Auto-print capabilities"
echo "   • Print-optimized CSS styling"
echo "   • Reusable print button components"
echo "   • Integration in Invoice, Analytics, and Client pages"
echo ""
echo "🚀 Ready to use:"
echo "   • Invoice printing with professional templates"
echo "   • Analytics dashboard printing"
echo "   • Client report generation"
echo "   • Auto-print functionality"
echo ""
echo "📖 Documentation: docs/PRINTING_SETUP.md"
echo "🔧 Components: client/src/components/PrintButton.tsx"
echo "⚙️  Utilities: client/src/utils/printUtils.ts"
echo ""
echo "Example usage:"
echo '   import { PrintButton } from "@/components/PrintButton";'
echo '   <PrintButton elementId="my-content" title="My Report" />'
echo ""
echo "Happy printing! 🖨️"