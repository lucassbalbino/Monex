import * as React from "react"
import { format, parse, isValid } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

/**
 * DatePicker customizado com identidade Monex.
 *
 * Props:
 * - value: string no formato "YYYY-MM-DD" (compatível com inputs existentes)
 * - onChange: (dateString: string) => void
 * - placeholder: string (default: "Selecione uma data")
 * - disabled: boolean
 * - className: string
 * - id: string
 */
function DatePicker({ value, onChange, placeholder = "Selecione uma data", disabled = false, className, id, ...props }) {
  const [open, setOpen] = React.useState(false)

  // Converte string "YYYY-MM-DD" → Date
  const selectedDate = React.useMemo(() => {
    if (!value) return undefined
    const parsed = parse(value, "yyyy-MM-dd", new Date())
    return isValid(parsed) ? parsed : undefined
  }, [value])

  // Quando o usuário seleciona uma data no Calendar
  const handleSelect = (date) => {
    if (date) {
      const formatted = format(date, "yyyy-MM-dd")
      onChange?.(formatted)
    } else {
      onChange?.("")
    }
    setOpen(false)
  }

  // Formata a data para exibição em pt-BR
  const displayValue = selectedDate
    ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-10",
            "rounded-xl border border-[#14B8A6]/30 bg-[#0F172A] px-3 py-2",
            "text-sm text-white ring-offset-[#0F172A]",
            "hover:bg-[#1E293B] hover:text-white hover:border-[#14B8A6]/50",
            "focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:ring-offset-2",
            "transition-all duration-200",
            !selectedDate && "text-gray-500",
            className
          )}
          {...props}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-[#14B8A6] shrink-0" />
          <span className="truncate">
            {displayValue || placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          initialFocus
          locale={ptBR}
        />
      </PopoverContent>
    </Popover>
  )
}

DatePicker.displayName = "DatePicker"

export { DatePicker }
