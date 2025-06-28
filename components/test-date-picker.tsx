"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export function TestDatePicker() {
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [open, setOpen] = useState(false)

  return (
    <div className="p-4 border rounded-md">
      <h2 className="text-lg font-bold mb-4">Test Date Picker</h2>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
            onClick={() => setOpen(true)}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Select date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(selectedDate) => {
              setDate(selectedDate)
              setOpen(false)
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <div className="mt-4">Selected date: {date ? format(date, "PPP") : "None"}</div>
    </div>
  )
}
