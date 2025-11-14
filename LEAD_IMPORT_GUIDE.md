# 📋 Lead Import Guide

## CSV Format

Your CSV file should have headers in the first row. The system is **smart** and will detect common header names!

### Supported Fields

| Field | Accepted Header Names | Required | Example |
|-------|----------------------|----------|---------|
| **Company** | `Company`, `Organization` | ✅ Yes | `Acme Corp` |
| **Name** | `Name`, `Contact`, `Contact Name` | ❌ No | `John Doe` |
| **Email** | `Email`, `E-mail`, `Email Address` | ❌ No | `john@example.com` |
| **Phone** | `Phone`, `Mobile`, `Tel`, `Telephone` | ❌ No | `+1-555-0100` |
| **Website** | `Website`, `URL`, `Site` | ❌ No | `https://acme.com` |
| **Industry** | `Industry`, `Vertical`, `Sector` | ❌ No | `Technology` |
| **Tags** | `Tags`, `Categories`, `Labels` | ❌ No | `marketing, saas` |
| **Notes** | `Notes`, `Description`, `Comments` | ❌ No | `Met at conference` |
| **Value** | `Value`, `Amount`, `Deal Size` | ❌ No | `5000` |

### Industry Options

- `Technology` 💻
- `Healthcare` 🏥
- `Finance` 💰
- `Retail` 🛍️
- `Education` 📚
- `Construction` 🏗️
- `Real Estate` 🏘️
- `Food & Beverage` 🍔
- `Manufacturing` 🏭
- `Professional Services` 💼
- `Other`

### Tags Format

- Separate multiple tags with **commas**
- Example: `"marketing, saas, b2b"`
- Tags are automatically added to the lead

---

## 📄 Template File

Use `lead-import-template.csv` as a starting point:

```csv
Name,Email,Phone,Company,Website,Industry,Tags,Notes,Value
John Doe,john@example.com,+1-555-0100,Acme Corp,https://acme.com,Technology,"marketing, saas",Interested in premium package,5000
Jane Smith,jane@techstart.io,555-0101,TechStart Inc,techstart.io,Technology,"startup, b2b",Met at conference,10000
```

---

## ✅ Import Tips

1. **Company is Required** - Every lead must have a company name
2. **Name is Optional** - If you only have company info, that's fine!
3. **Flexible Headers** - Headers are case-insensitive and support variations
4. **Auto-Deduplication** - Duplicate emails are automatically skipped
5. **Smart Parsing** - The system recognizes common variations like "E-mail" or "Mobile"

---

## 🚀 How to Import

1. Go to **Leads** page
2. Click **Import Leads** button
3. Upload your CSV file
4. Review the parsed leads
5. Click **Import All** to add them to your pipeline

---

## 📊 After Import

All imported leads will:
- Start in **Prospect** stage
- Be scored as **Warm**
- Have source set to **Import**
- Be ready for follow-up!

---

## 🆘 Troubleshooting

**Q: Import failed with "Company name is required"**  
A: Make sure every row has a company name filled in

**Q: Some leads are missing after import**  
A: Duplicate emails are automatically skipped. Check if the lead already exists.

**Q: Tags not showing up**  
A: Make sure tags are comma-separated and wrapped in quotes if they contain commas

**Q: Industry not set**  
A: Use one of the predefined industry values from the list above

