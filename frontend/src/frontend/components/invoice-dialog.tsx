
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/frontend/components/ui/dialog"
import { Button } from "@/frontend/components/ui/button"
import { Input } from "@/frontend/components/ui/input"
import { Label } from "@/frontend/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/frontend/components/ui/table"
import { Plus, Trash2, Save } from "lucide-react"

interface InvoiceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    type: 'FACTURA' | 'RECIBO'
    onSuccess: () => void
    userId: number
}

interface Item {
    description: string
    quantity: number
    price: number
    amount: number
}

export function InvoiceDialog({ open, onOpenChange, type, onSuccess, userId }: InvoiceDialogProps) {
    // Common Fields
    const [issuerName, setIssuerName] = useState("") // "Nombre de Cliente" (Actually Recipient in UI, but model calls it issuer/recipient depending on perspective. Let's map Client to RecipientName)
    // Wait. "Nombre de cliente" implies the one RECEIVING the bill if we are the Issuer, OR the one ISSUING if we are receiving.
    // The uploaded image is a FACTURA from "COMERCIALIZADORA ABC" (Issuer) to "Victor Carrillo" (Client).
    // So "Nombre de Cliente" = RecipientName.
    // "Nr. Documento" = InvoiceNumber (or IssuerDocument? No, usually Invoice Number).

    // Let's stick to the User Request: "ingresar Nr.documento, nombre de cliente, dirección..."

    const [recipientName, setRecipientName] = useState("") // Cliente
    const [recipientAddress, setRecipientAddress] = useState("") // Dirección
    const [invoiceNumber, setInvoiceNumber] = useState("") // Nr. Documento
    const [dueDate, setDueDate] = useState("") // Vencimiento

    // Factura Specific
    const [paymentMethod, setPaymentMethod] = useState("Contado")

    // Recibo Specific
    const [period, setPeriod] = useState("")
    // New fields for Recibo as requested
    const [reciboMonth, setReciboMonth] = useState("")
    const [reciboInstallment, setReciboInstallment] = useState("")
    const [reciboAmount, setReciboAmount] = useState(0)

    // Items
    const [items, setItems] = useState<Item[]>([])
    const [newItem, setNewItem] = useState<Item>({ description: "", quantity: 1, price: 0, amount: 0 })

    // Calculations
    const [subtotal, setSubtotal] = useState(0)
    const [tax, setTax] = useState(0)
    const [total, setTotal] = useState(0)

    // Reset form when opening
    useEffect(() => {
        if (open) {
            setItems([])
            setRecipientName("")
            setRecipientAddress("")
            setInvoiceNumber("")
            setDueDate("")
            setPaymentMethod("Contado")
            setPeriod("")
            setReciboMonth("")
            setReciboInstallment("")
            setReciboAmount(0)
            setNewItem({ description: "", quantity: 1, price: 0, amount: 0 })
        }
    }, [open, type])

    // Recalculate totals
    useEffect(() => {
        if (type === 'FACTURA') {
            const sum = items.reduce((acc, item) => acc + item.amount, 0)
            setSubtotal(sum)
            const igv = sum * 0.18
            setTax(igv)
            setTotal(sum + igv)
        } else {
            // For Recibo, if user uses the simple amount input, that's the total.
            // But we also support the item list if they want.
            // Let's prioritize the simple amount if > 0, otherwise items sum.
            if (reciboAmount > 0) {
                setTax(0)
                setTotal(reciboAmount)
                setSubtotal(reciboAmount)
            } else {
                const sum = items.reduce((acc, item) => acc + item.amount, 0)
                setTax(0)
                setTotal(sum)
                setSubtotal(sum)
            }
        }
    }, [items, type, reciboAmount])

    const handleAddItem = () => {
        if (!newItem.description) return
        const amount = type === 'FACTURA'
            ? newItem.quantity * newItem.price
            : newItem.price // For Recibo, price is just the amount

        // Actually for Recibo user said "suma de todos los productos...". So list of items.

        setItems([...items, { ...newItem, amount }])
        setNewItem({ description: "", quantity: 1, price: 0, amount: 0 })
    }

    const handleSave = async () => {
        try {
            // Construct payload based on type
            let finalItems = items
            let finalPeriod = period
            let finalTotal = total

            if (type === 'RECIBO') {
                // For Recibo, we use the specific fields if provided
                if (reciboMonth || reciboInstallment) {
                    finalPeriod = `Mes: ${reciboMonth} - Cuotas: ${reciboInstallment}`
                }

                // If using the simple amount input, override items
                if (reciboAmount > 0) {
                    finalItems = [{ description: "Pago Mensual", quantity: 1, price: reciboAmount, amount: reciboAmount }]
                    finalTotal = reciboAmount
                }
            }

            const payload = {
                userId,
                documentType: type,
                issuerName: "EMPRESA LOCAL",
                recipientName,
                recipientAddress,
                invoiceNumber,
                dueDate,
                paymentMethod: type === 'FACTURA' ? paymentMethod : undefined,
                period: type === 'RECIBO' ? finalPeriod : undefined,
                items: finalItems,
                subtotal: type === 'FACTURA' ? subtotal : finalTotal,
                tax: type === 'FACTURA' ? tax : 0,
                totalAmount: finalTotal,
                issuerName: "Sistema AgileDev",
                issueDate: new Date().toISOString()
            }

            console.log("Saving Invoice:", payload)

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/invoices`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!res.ok) {
                const err = await res.json()
                alert("Error: " + err.error)
                return
            }

            onSuccess()
            onOpenChange(false)
        } catch (e) {
            console.error(e)
            alert("Error saving invoice")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{type === 'FACTURA' ? 'Nueva Factura' : 'Nuevo Recibo'}</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 py-4">
                    {/* Common Fields */}
                    <div className="space-y-2">
                        <Label>Nombre de Cliente</Label>
                        <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Ej. Juan Perez" />
                    </div>
                    <div className="space-y-2">
                        <Label>Dirección</Label>
                        <Input value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} placeholder="Ej. Calle 123" />
                    </div>

                    {type === 'FACTURA' && (
                        <div className="space-y-2">
                            <Label>Nr. Documento</Label>
                            <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="F001-00000" />
                        </div>
                    )}

                    {type === 'RECIBO' && (
                        <>
                            <div className="space-y-2">
                                <Label>Mes</Label>
                                <Select value={reciboMonth} onValueChange={setReciboMonth}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona Mes" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => (
                                            <SelectItem key={m} value={m}>{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Cuotas</Label>
                                <Input value={reciboInstallment} onChange={(e) => setReciboInstallment(e.target.value)} placeholder="Ej. 1 de 12" />
                            </div>
                        </>
                    )}

                    <div className="space-y-2">
                        <Label>Vencimiento</Label>
                        <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                    </div>

                    {type === 'FACTURA' && (
                        <div className="space-y-2">
                            <Label>Forma de Pago</Label>
                            <Input value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} placeholder="Contado / Crédito" />
                        </div>
                    )}
                </div>

                {type === 'RECIBO' && (
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 mb-4">
                        <Label className="text-orange-900 font-semibold mb-2 block">Monto a Pagar Mensual</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500 font-bold">S/</span>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                className="pl-8 text-lg font-bold"
                                value={reciboAmount || ''}
                                onChange={(e) => setReciboAmount(Number(e.target.value))}
                                placeholder="0.00"
                            />
                        </div>
                        <p className="text-sm text-orange-600 mt-2">
                            Este monto aparecerá en el recibo anual.
                        </p>
                    </div>
                )}

                {/* Items Section - Only for FACTURA or if Recibo amount is 0/empty */}
                {type === 'FACTURA' && (
                    <div className="border rounded-md p-4 bg-muted/20">
                        <h4 className="font-medium mb-2">Detalle de Productos</h4>

                        <div className="flex gap-2 mb-2 items-end">
                            <div className="flex-1">
                                <Label>Descripción</Label>
                                <Input
                                    value={newItem.description}
                                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                    placeholder="Producto..."
                                />
                            </div>
                            <div className="w-20">
                                <Label>Cant.</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={newItem.quantity}
                                    onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                                />
                            </div>
                            <div className="w-24">
                                <Label>Precio</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={newItem.price}
                                    onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                                />
                            </div>
                            <Button onClick={handleAddItem} disabled={!newItem.description} size="icon">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Desc</TableHead>
                                    <TableHead className="w-16">Cant</TableHead>
                                    <TableHead className="w-24 text-right">Importe</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell className="text-right">S/ {item.amount.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm" onClick={() => setItems(items.filter((_, idx) => idx !== i))}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* Totals */}
                <div className="flex justify-end p-4">
                    <div className="w-48 space-y-1">
                        {type === 'FACTURA' && (
                            <>
                                <div className="flex justify-between text-sm">
                                    <span>Subtotal:</span>
                                    <span>S/ {subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>IGV (18%):</span>
                                    <span>S/ {tax.toFixed(2)}</span>
                                </div>
                            </>
                        )}
                        <div className="flex justify-between font-bold text-lg border-t pt-2">
                            <span>Total:</span>
                            <span>S/ {total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                        <Save className="mr-2 h-4 w-4" /> Guardar Documento
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
