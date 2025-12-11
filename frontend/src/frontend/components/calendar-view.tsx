"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card"
import { Button } from "@/frontend/components/ui/button"
import { Badge } from "@/frontend/components/ui/badge"
import { Alert, AlertDescription } from "@/frontend/components/ui/alert"
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/frontend/components/ui/dialog"
import { Input } from "@/frontend/components/ui/input"
import { Label } from "@/frontend/components/ui/label"
import { Textarea } from "@/frontend/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,

  AlertDialogTitle,
} from "@/frontend/components/ui/alert-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/frontend/components/ui/tooltip"
import { Invoice } from "@/frontend/types/invoice"

export interface Installment {
  id: number
  installmentNumber: number
  dueDate: string | Date
  isPaid: boolean
  status?: string
  amount: number
  loan?: {
    loanCode?: string
    bankName: string
    loanType: string
    monthlyPayment: number
    totalAmount: number
    numberOfInstallments?: number
  }
}

interface CalendarViewProps {
  installments: Installment[]
  invoices: Invoice[]
}

export function CalendarView({ installments, invoices }: CalendarViewProps) {
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

  const getItemsForDay = (day: number) => {
    const targetDate = new Date(selectedYear, selectedMonth, day)
    const normalizedTarget = new Date(selectedYear, selectedMonth, day).getTime()

    const dayInstallments = installments.filter(inst => {
      let d: Date
      if (inst.dueDate instanceof Date) {
        d = inst.dueDate
      } else {
        const dateStr = String(inst.dueDate).split('T')[0]
        const [y, m, day] = dateStr.split('-').map(Number)
        d = new Date(y, m - 1, day)
      }
      return (
        d.getDate() === day &&
        d.getMonth() === selectedMonth &&
        d.getFullYear() === selectedYear
      )
    })

    const dayInvoices = invoices.filter(inv => {
      let d: Date
      if (inv.dueDate instanceof Date) {
        d = inv.dueDate
      } else {
        const dateStr = String(inv.dueDate).split('T')[0]
        const [y, m, day] = dateStr.split('-').map(Number)
        d = new Date(y, m - 1, day)
      }
      return (
        d.getDate() === day &&
        d.getMonth() === selectedMonth &&
        d.getFullYear() === selectedYear
      )
    })

    return { installments: dayInstallments, invoices: dayInvoices }
  }

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
    setSelectedMonth(newDate.getMonth())
    setSelectedYear(newDate.getFullYear())
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
      const { installments: dayInstallments, invoices: dayInvoices } = getItemsForDay(day)
      const allItems = [...dayInstallments, ...dayInvoices]

      days.push(
        <div key={day} className={getDayClass(day)} onClick={() => handleDayClick(day)}>
          <div className="flex flex-col h-full">
            <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              {day}
            </div>
            <div className="flex-1 space-y-1 overflow-hidden">
              {/* Render Installments first */}
              {dayInstallments.slice(0, 2).map((inst) => {
                // ... existing installment logic ...
                const isPaid = inst.isPaid
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const isOverdue = !isPaid && new Date(inst.dueDate) < today

                let badgeClass = "text-xs px-1 py-0 truncate block border-transparent transition-colors shadow-sm text-white"
                let variant: "default" | "secondary" | "destructive" | "outline" = "default"

                if (isPaid) {
                  badgeClass += " bg-green-600 hover:bg-green-700"
                  variant = "secondary"
                } else if (isOverdue) {
                  badgeClass += " bg-red-600 hover:bg-red-700"
                  variant = "destructive"
                } else {
                  badgeClass += " bg-yellow-600 hover:bg-yellow-700"
                }

                return (
                  <TooltipProvider key={`inst-${inst.id}`}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant={variant} className={badgeClass}>
                          <span className="truncate">
                            {inst.loan?.bankName} - C{inst.installmentNumber}
                          </span>
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{inst.loan?.bankName} - Cuota {inst.installmentNumber}</p>
                        <p>Monto: S/ {Number(inst.amount).toFixed(2)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              })}

              {/* Render Invoices (if space) */}
              {dayInvoices.slice(0, Math.max(0, 2 - dayInstallments.length)).map((inv) => (
                <TooltipProvider key={`inv-${inv.id}`}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge className={`text-xs px-1 py-0 truncate block border-transparent shadow-sm text-white ${inv.documentType === 'FACTURA' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-orange-600 hover:bg-orange-700'}`}>
                        <span className="truncate">
                          {inv.issuerName} ({inv.documentType === 'FACTURA' ? 'Fact' : 'Rec'})
                        </span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{inv.issuerName}</p>
                      <p>{inv.documentType} - Total: S/ {Number(inv.totalAmount).toFixed(2)}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}

              {allItems.length > 2 && (
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
    const { installments: dayInstallments, invoices: dayInvoices } = getItemsForDay(day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const isToday =
      today.getDate() === day &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear()

    const cellDate = new Date(selectedYear, selectedMonth, day)
    cellDate.setHours(0, 0, 0, 0)

    // Calculate end of current week (assuming Saturday is end)
    const endOfWeek = new Date(today)
    endOfWeek.setDate(today.getDate() + (6 - today.getDay()))
    endOfWeek.setHours(23, 59, 59, 999)

    // Helper to determine status
    const hasUnpaid = dayInstallments.some(i => !i.isPaid)
    const hasInvoices = dayInvoices.length > 0
    // Only verify "overdue" if it's strictly in the past (before today)
    const isOverdue = hasUnpaid && cellDate < today
    // Pending in current week: Unpaid AND (Today <= Date <= EndOfWeek)
    const isPendingThisWeek = (hasUnpaid || hasInvoices) && cellDate >= today && cellDate <= endOfWeek

    // Base styling
    let baseClass = "h-20 w-full p-1 border rounded-lg transition-colors cursor-pointer flex flex-col"

    // Apply colors based on priority: Overdue (Red) > Pending This Week (Yellow) > Today (Blue) > Default (Gray)
    if (isOverdue) {
      // Red for overdue
      baseClass += " bg-red-50 dark:bg-red-900/40 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/60"
    } else if (isPendingThisWeek) {
      // Yellow for pending this week (including Today)
      baseClass += " bg-yellow-100 dark:bg-yellow-900/40 border-yellow-300 dark:border-yellow-800 hover:bg-yellow-200 dark:hover:bg-yellow-900/60"

      // Add extra visual cue if it is specifically Today + Pending
      if (isToday) {
        baseClass += " ring-2 ring-blue-400 dark:ring-blue-500" // subtle indicator it is still 'today' cursor
      }
    } else if (isToday) {
      // Normal Today (No debts or all paid) -> Blue
      baseClass += " bg-blue-100 dark:bg-blue-900/60 border-blue-300 dark:border-blue-700"
    } else {
      // Default
      baseClass += " border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
    }

    return baseClass
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Button variant="outline" size="icon" onClick={() => navigateMonth("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <h2 className="text-xl font-semibold capitalize">
            {currentDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
          </h2>

          <Button variant="outline" size="icon" onClick={() => navigateMonth("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
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
            {selectedDay && (() => {
              const { installments: insts, invoices: invs } = getItemsForDay(selectedDay)
              const all = [...insts, ...invs]
              if (all.length === 0) return <p className="text-center text-muted-foreground py-4">No hay eventos para este día</p>

              return (
                <>
                  {insts.map((inst) => (
                    <div key={`inst-${inst.id}`} className="flex items-center justify-between p-3 border rounded-lg mb-2">
                      {/* Existing installment render */}
                      <div>
                        <p className="font-medium">{inst.loan?.bankName}</p>
                        <p className="text-sm text-muted-foreground">Cuota #{inst.installmentNumber}</p>
                        <p className="text-sm font-bold">S/ {Number(inst.amount).toFixed(2)}</p>
                      </div>
                      <Badge variant={inst.isPaid ? 'secondary' : 'default'}>{inst.isPaid ? 'Pagado' : 'Pendiente'}</Badge>
                    </div>
                  ))}

                  {invs.map((inv) => (
                    <div key={`inv-${inv.id}`} className="flex items-center justify-between p-3 border rounded-lg mb-2 bg-gray-50 dark:bg-gray-800">
                      <div>
                        <p className="font-medium text-purple-700 dark:text-purple-400">{inv.issuerName}</p>
                        <p className="text-sm text-muted-foreground">{inv.documentType}</p>
                        <p className="text-sm font-bold">S/ {Number(inv.totalAmount).toFixed(2)}</p>
                      </div>
                      <Badge className="bg-purple-600">{inv.documentType}</Badge>
                    </div>
                  ))}
                </>
              )
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

