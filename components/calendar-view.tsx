"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Installment {
  id: number
  dueDate: string | Date
  isPaid: boolean
  status?: string
  amount: number
  loan?: {
    bankName: string
    loanType: string
    monthlyPayment: number
    totalAmount: number
  }
}

interface CalendarViewProps {
  installments: Installment[]
}

export function CalendarView({ installments }: CalendarViewProps) {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [dayDetailsOpen, setDayDetailsOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth())
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())

  // Helper to normalize date comparison (ignore time)
  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    )
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getInstallmentsForDay = (day: number) => {
    const targetDate = new Date(selectedYear, selectedMonth, day)

    return installments.filter(inst => {
      const instDate = new Date(inst.dueDate)
      // Fix timezone/offset issues by comparing local dates components
      // Using helper isSameDay
      // Note: inst.dueDate from API might be UTC string.
      // Assuming naive date for simplicity or proper parsing?
      // "2023-01-15T00:00:00.000Z" -> new Date() handles it.
      // But we need to match "Day X of Month Y".
      // Let's use isSameDay logic dealing with timezone offsets carefully?
      // Actually, if we just want "Day" match, let's trust the components.

      // Handle "off by one" due to timezone? 
      // safer: instDate.getUTCDate() vs day? 
      // DashboardContent uses local date formatting.
      // Let's try simple match first.

      // Simple offset adjustment just in case
      const adjustedInstDate = new Date(instDate.getTime() + instDate.getTimezoneOffset() * 60000)

      return (
        adjustedInstDate.getDate() === day &&
        adjustedInstDate.getMonth() === selectedMonth &&
        adjustedInstDate.getFullYear() === selectedYear
      )
    })
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const handleDayClick = (day: number) => {
    setSelectedDay(day)
    setDayDetailsOpen(true)
  }

  const handleMonthChange = (month: string) => {
    const monthIndex = parseInt(month)
    setSelectedMonth(monthIndex)
    setCurrentDate(new Date(selectedYear, monthIndex, 1))
  }

  const handleYearChange = (year: string) => {
    const yearValue = parseInt(year)
    setSelectedYear(yearValue)
    setCurrentDate(new Date(yearValue, selectedMonth, 1))
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []

    // Días vacíos al inicio
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-20 w-full p-1">
          <div className="h-full w-full rounded-lg bg-gray-50 dark:bg-gray-900"></div>
        </div>
      )
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const dayInstallments = getInstallmentsForDay(day)

      days.push(
        <div key={day} className={getDayClass(day)} onClick={() => handleDayClick(day)}>
          <div className="flex flex-col h-full">
            <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              {day}
            </div>
            <div className="flex-1 space-y-1 overflow-hidden">
              {dayInstallments.slice(0, 2).map((inst, index) => (
                <Badge
                  key={inst.id}
                  variant={inst.status === 'Pagado' ? 'secondary' : inst.status === 'Vencido' ? 'destructive' : 'default'}
                  className="text-xs px-1 py-0 truncate block"
                >
                  {inst.loan?.bankName || 'Préstamo'}
                </Badge>
              ))}
              {dayInstallments.length > 2 && (
                <MoreHorizontal className="h-3 w-3 text-gray-500" />
              )}
            </div>
          </div>
        </div>
      )
    }

    return days
  }

  const getDayClass = (day: number) => {
    const dayInstallments = getInstallmentsForDay(day)
    const today = new Date()
    const isToday =
      today.getDate() === day &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear()

    let baseClass = "h-20 w-full p-1 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"

    if (isToday) {
      baseClass += " bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700"
    } else if (dayInstallments.some(i => !i.isPaid)) {
      // As requested: Yellow for unpaid (pending)
      // Check if any is 'Overdue' (Vencido) to prefer Red?
      if (dayInstallments.some(i => i.status === 'Vencido')) {
        baseClass += " bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
      } else {
        baseClass += " bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
      }
    }

    return baseClass
  }



  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            Calendario de Pagos
          </CardTitle>
          <div className="flex gap-2">
            <Select value={selectedMonth.toString()} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
                ].map((month, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
              <SelectTrigger className="w-22">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {renderCalendar()}
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 rounded"></div>
            <span>Hoy</span>
          </div>
        </div>
      </CardContent>

      <Dialog open={dayDetailsOpen} onOpenChange={setDayDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Detalles del día {selectedDay} de {currentDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
            </DialogTitle>
            <DialogDescription>
              Cuotas programadas para este día
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDay && getInstallmentsForDay(selectedDay).map((inst) => (
              <div key={inst.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{inst.loan?.bankName || 'Unknown Bank'}</p>
                  <p className="text-sm text-muted-foreground">{inst.loan?.loanType || 'Type'}</p>
                  <p className="text-sm text-muted-foreground">Cuota mensual: S/ {Number(inst.loan?.monthlyPayment)?.toFixed(2) || '0.00'}</p>
                  <p className="text-sm text-muted-foreground">Total: S/ {Number(inst.loan?.totalAmount)?.toFixed(2) || '0.00'}</p>
                </div>
                <Badge variant={inst.status === 'Pagado' ? 'secondary' : inst.status === 'Vencido' ? 'destructive' : 'default'}>
                  {inst.status}
                </Badge>
              </div>
            ))}
            {selectedDay && getInstallmentsForDay(selectedDay).length > 0 && (
              <div className="flex justify-end pt-4 border-t">
                <div className="text-right">
                  <p className="text-lg font-semibold">
                    Total de pago: S/ {getInstallmentsForDay(selectedDay).reduce((sum, inst) => sum + (Number(inst.loan?.monthlyPayment) || 0), 0).toFixed(2)}
                  </p>
                </div>
              </div>
            )}
            {selectedDay && getInstallmentsForDay(selectedDay).length === 0 && (
              <p className="text-center text-muted-foreground py-4">No hay cuotas programadas para este día</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
