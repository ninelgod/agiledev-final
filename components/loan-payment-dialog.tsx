
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle } from "lucide-react"

interface Installment {
    id: number
    installmentNumber: number
    dueDate: string | Date
    amount: number
    isPaid: boolean
}

interface Loan {
    id: number
    bankName: string
    loanType: string
}

interface LoanPaymentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    loan: Loan | null
    installments: Installment[]
    onPaymentSuccess: () => void
}

export function LoanPaymentDialog({ open, onOpenChange, loan, installments, onPaymentSuccess }: LoanPaymentDialogProps) {
    const [selectedInstallment, setSelectedInstallment] = useState<string>("")
    const [paymentMethod, setPaymentMethod] = useState("Transferencia")
    const [notes, setNotes] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const pendingInstallments = installments.filter(i => !i.isPaid).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

    const handleSubmit = async () => {
        if (!selectedInstallment) {
            setError("Selecciona una cuota para pagar")
            return
        }

        setIsLoading(true)
        setError("")
        setSuccess("")

        try {
            const response = await fetch(`/api/installments/${selectedInstallment}/pay`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentMethod, notes }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Error al procesar el pago")
            }

            setSuccess("Pago registrado exitosamente")
            setTimeout(() => {
                setSuccess("")
                setSelectedInstallment("")
                setNotes("")
                onPaymentSuccess()
                onOpenChange(false)
            }, 1500)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Registrar Pago - {loan?.bankName}</DialogTitle>
                    <DialogDescription>
                        {pendingInstallments.length > 0
                            ? `Tienes ${pendingInstallments.length} cuotas pendientes.`
                            : "No hay cuotas pendientes para este préstamo."}
                    </DialogDescription>
                </DialogHeader>

                {pendingInstallments.length > 0 ? (
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="installment">Cuota a Pagar</Label>
                            <Select value={selectedInstallment} onValueChange={setSelectedInstallment}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona una cuota" />
                                </SelectTrigger>
                                <SelectContent>
                                    {pendingInstallments.map((inst) => (
                                        <SelectItem key={inst.id} value={inst.id.toString()}>
                                            Cuota {inst.installmentNumber} - S/ {Number(inst.amount).toFixed(2)} - Vence: {new Date(inst.dueDate).toLocaleDateString()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="method">Método de Pago</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona método" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Transferencia">Transferencia Bancaria</SelectItem>
                                    <SelectItem value="Efectivo">Efectivo</SelectItem>
                                    <SelectItem value="Yape/Plin">Yape / Plin</SelectItem>
                                    <SelectItem value="Tarjeta">Tarjeta de Crédito/Débito</SelectItem>
                                    <SelectItem value="Otro">Otro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notas (Opcional)</Label>
                            <Input
                                id="notes"
                                placeholder="Nro de operación, referencia, etc."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="py-6 text-center text-muted-foreground">
                        <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-2" />
                        <p>Este préstamo está completamente pagado.</p>
                    </div>
                )}

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert className="bg-green-50 text-green-900 border-green-200">
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>{success}</AlertDescription>
                    </Alert>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancelar
                    </Button>
                    {pendingInstallments.length > 0 && (
                        <Button onClick={handleSubmit} disabled={isLoading || !selectedInstallment}>
                            {isLoading ? "Procesando..." : "Registrar Pago"}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
