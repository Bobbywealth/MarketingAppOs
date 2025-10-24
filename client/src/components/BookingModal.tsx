import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Calendar as CalendarIcon, Clock, CheckCircle2 } from "lucide-react";
import { format, addDays, setHours, setMinutes } from "date-fns";

interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const timeSlots = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM"
];

export function BookingModal({ open, onOpenChange }: BookingModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1); // 1: date/time, 2: details, 3: success
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
  });

  const bookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/bookings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-events"] });
      setStep(3);
      toast({
        title: "🎉 Booking Confirmed!",
        description: "We'll send you a confirmation email shortly.",
      });
    },
    onError: () => {
      toast({
        title: "Booking Failed",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please select a date and time.",
        variant: "destructive",
      });
      return;
    }

    // Parse time and create full datetime
    const [time, period] = selectedTime.split(" ");
    const [hours, minutes] = time.split(":");
    let hour = parseInt(hours);
    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;

    const bookingDateTime = setMinutes(setHours(selectedDate, hour), parseInt(minutes));

    bookingMutation.mutate({
      ...formData,
      date: selectedDate.toISOString(),
      time: selectedTime,
      datetime: bookingDateTime.toISOString(),
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after animation
    setTimeout(() => {
      setStep(1);
      setSelectedDate(undefined);
      setSelectedTime(undefined);
      setFormData({ name: "", email: "", phone: "", company: "", message: "" });
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {step === 3 ? "Booking Confirmed!" : "Book a Strategy Call"}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Select a date and time that works for you"}
            {step === 2 && "Tell us a bit about yourself and your goals"}
            {step === 3 && "We'll be in touch soon to confirm the details"}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Date & Time Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <CalendarIcon className="w-4 h-4" />
                <span>Select a Date</span>
              </Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < addDays(new Date(), 1) || date > addDays(new Date(), 90)}
                className="rounded-md border"
              />
            </div>

            {selectedDate && (
              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4" />
                  <span>Select a Time (EST)</span>
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((time) => (
                    <Button
                      key={time}
                      type="button"
                      variant={selectedTime === time ? "default" : "outline"}
                      className="text-sm"
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedDate || !selectedTime}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Contact Details */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm font-semibold text-blue-900">
                📅 {selectedDate && format(selectedDate, "MMMM d, yyyy")} at {selectedTime} EST
              </p>
            </div>

            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
                required
              />
            </div>

            <div>
              <Label htmlFor="company">Company / Business Name</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Acme Inc."
              />
            </div>

            <div>
              <Label htmlFor="message">What would you like to discuss? *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Tell us about your business, goals, and what you're looking to achieve..."
                rows={4}
                required
              />
            </div>

            <div className="flex justify-between gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                type="submit"
                disabled={bookingMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                {bookingMutation.isPending ? "Booking..." : "Confirm Booking"}
              </Button>
            </div>
          </form>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="text-center py-8">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Your Call is Booked!</h3>
              <p className="text-muted-foreground mb-4">
                We've sent a confirmation email to <strong>{formData.email}</strong>
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
                <p className="text-sm font-semibold text-green-900 mb-2">📅 Call Details:</p>
                <ul className="text-sm text-green-800 space-y-1">
                  <li><strong>Date:</strong> {selectedDate && format(selectedDate, "MMMM d, yyyy")}</li>
                  <li><strong>Time:</strong> {selectedTime} EST</li>
                  <li><strong>Duration:</strong> 30 minutes</li>
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                We'll call you at <strong>{formData.phone}</strong> at the scheduled time.
              </p>
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

