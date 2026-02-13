import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface DatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "data-testid"?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
  "data-testid": testId,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value ? format(new Date(value), "MM/dd/yyyy") : "");

  // Parse date from value prop
  const selectedDate = value ? new Date(value) : undefined;

  // Sync input value when external value changes
  React.useEffect(() => {
    if (value) {
      setInputValue(format(new Date(value), "MM/dd/yyyy"));
    } else {
      setInputValue("");
    }
  }, [value]);

  // Handle manual input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setInputValue(rawValue);

    // Try to parse the date
    // Support formats: MM/DD/YYYY, MM-DD-YYYY, M/D/YYYY
    const parsed = parseDateInput(rawValue);
    if (parsed) {
      onChange?.(parsed.toISOString().split('T')[0]);
    }
  };

  // Handle calendar selection
  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const formatted = format(date, "yyyy-MM-dd");
      onChange?.(formatted);
      setInputValue(format(date, "MM/dd/yyyy"));
    }
    setIsOpen(false);
  };

  // Clear the date
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInputValue("");
    onChange?.("");
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className={cn("relative", className)}>
          <Input
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            disabled={disabled}
            className="pr-16"
            data-testid={testId}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setIsOpen(true);
              }
            }}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded hover:bg-muted text-muted-foreground"
                tabIndex={-1}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              tabIndex={-1}
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          initialFocus
        />
        {/* Quick date buttons */}
        <div className="flex items-center gap-1 p-2 border-t">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => {
              const today = new Date();
              handleSelect(today);
            }}
          >
            Today
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              handleSelect(tomorrow);
            }}
          >
            Tomorrow
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => {
              const nextWeek = new Date();
              nextWeek.setDate(nextWeek.getDate() + 7);
              handleSelect(nextWeek);
            }}
          >
            Next Week
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Helper function to parse various date formats
function parseDateInput(input: string): Date | null {
  if (!input) return null;
  
  // Remove any extra whitespace
  input = input.trim();
  
  // Try MM/DD/YYYY or MM-DD-YYYY
  const slashMatch = input.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (slashMatch) {
    const month = parseInt(slashMatch[1]) - 1;
    const day = parseInt(slashMatch[2]);
    let year = parseInt(slashMatch[3]);
    
    // Handle 2-digit years
    if (year < 100) {
      year += year < 50 ? 2000 : 1900;
    }
    
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  // Try natural language
  const lower = input.toLowerCase();
  if (lower === "today") return new Date();
  if (lower === "tomorrow") {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  }
  
  // Try native Date parsing as fallback
  const parsed = new Date(input);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  
  return null;
}

export default DatePicker;
