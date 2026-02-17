
import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 bg-[#1E293B] rounded-xl text-white", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center text-white",
        caption_label: "text-sm font-semibold text-white",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent border-[#14B8A6]/30 text-gray-400 p-0 hover:bg-[#14B8A6]/20 hover:text-[#14B8A6] hover:opacity-100 rounded-lg transition-colors"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-gray-400 rounded-lg w-9 font-medium text-[0.75rem] uppercase",
        row: "flex w-full mt-1",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-lg [&:has([aria-selected].day-outside)]:bg-[#14B8A6]/10 [&:has([aria-selected])]:bg-[#14B8A6]/10 first:[&:has([aria-selected])]:rounded-l-lg last:[&:has([aria-selected])]:rounded-r-lg focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal text-gray-300 hover:bg-[#334155] hover:text-white rounded-lg transition-colors aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-[#14B8A6] text-white hover:bg-[#0D9488] hover:text-white focus:bg-[#14B8A6] focus:text-white rounded-lg font-semibold shadow-lg shadow-[#14B8A6]/20",
        day_today: "bg-[#334155] text-[#14B8A6] font-bold rounded-lg ring-1 ring-[#14B8A6]/40",
        day_outside:
          "day-outside text-gray-600 opacity-40 aria-selected:bg-[#14B8A6]/10 aria-selected:text-gray-500 aria-selected:opacity-30",
        day_disabled: "text-gray-600 opacity-30",
        day_range_middle:
          "aria-selected:bg-[#14B8A6]/10 aria-selected:text-white",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
