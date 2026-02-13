import { memo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { z } from 'zod';

// Recurring task schema subset
const recurringSchema = z.object({
  isRecurring: z.boolean().optional(),
  recurringPattern: z.enum(["daily", "weekly", "monthly", "yearly"]).optional(),
  recurringInterval: z.number().optional(),
  recurringEndDate: z.string().optional(),
  scheduleFrom: z.enum(["due_date", "completion_date"]).optional(),
});

type RecurringFormData = z.infer<typeof recurringSchema>;

interface TaskRecurringConfigProps {
  form: UseFormReturn<any>;
  showScheduleFrom?: boolean;
}

export const TaskRecurringConfig = memo(function TaskRecurringConfig({
  form,
  showScheduleFrom = true,
}: TaskRecurringConfigProps) {
  return (
    <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
      <FormField
        control={form.control}
        name="isRecurring"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <input
                type="checkbox"
                checked={field.value || false}
                onChange={(e) => field.onChange(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 mt-1"
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="cursor-pointer">
                🔄 Make this a recurring task
              </FormLabel>
              <p className="text-xs text-muted-foreground">
                Automatically create a new task when this one is completed
              </p>
            </div>
          </FormItem>
        )}
      />

      {form.watch("isRecurring") && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="recurringPattern"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repeat Pattern</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select pattern" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recurringInterval"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Every</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      placeholder="1"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Repeat every X {form.watch("recurringPattern") || "period"}(s)
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {showScheduleFrom && (
            <FormField
              control={form.control}
              name="scheduleFrom"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Schedule Next Task From</FormLabel>
                  <FormControl>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="due_date"
                          checked={field.value === "due_date" || !field.value}
                          onChange={() => field.onChange("due_date")}
                          className="h-4 w-4"
                        />
                        <div>
                          <div className="font-medium text-sm">📅 Due Date</div>
                          <div className="text-xs text-muted-foreground">Next task uses same schedule (e.g., every Monday)</div>
                        </div>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="completion_date"
                          checked={field.value === "completion_date"}
                          onChange={() => field.onChange("completion_date")}
                          className="h-4 w-4"
                        />
                        <div>
                          <div className="font-medium text-sm">✅ Completion Date</div>
                          <div className="text-xs text-muted-foreground">Next task starts from when you complete this one</div>
                        </div>
                      </label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="recurringEndDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date (Optional)</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Leave empty to repeat indefinitely
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </div>
  );
});

export default TaskRecurringConfig;
