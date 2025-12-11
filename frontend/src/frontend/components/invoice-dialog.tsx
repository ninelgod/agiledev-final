
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select" // Assuming these exist
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
            setNewItem({ description: "", quantity: 1, price: 0, amount: 0 })
        }
    }, [open, type])

    // Recalculate totals
    useEffect(() => {
        const sum = items.reduce((acc, item) => acc + item.amount, 0)
        setSubtotal(sum)

        if (type === 'FACTURA') {
            const igv = sum * 0.18
            setTax(igv)
            setTotal(sum + igv)
        } else {
            setTax(0)
            setTotal(sum)
        }
    }, [items, type])

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
            const payload = {
                userId,
                documentType: type,
                issuerName: "EMPRESA LOCAL", // Or fixed, or input? User didn't specify input for Issuer Name, only "Nombre de Cliente". I will assume "EMPRESA LOCAL" or similar as the Issuer (Us).
                // Actually, schema requirement says issuerName is required. I'll default it to "Mi Empresa" or allow input if needed.
                // Let's assume the user IS the issuer. 
                recipientName,
                recipientAddress,
                invoiceNumber,
                dueDate,
                paymentMethod: type === 'FACTURA' ? paymentMethod : undefined,
                period: type === 'RECIBO' ? period : undefined,
                items,
                subtotal,
                tax,
                totalAmount: total,

                // Required by schema but not in UI request?
                issuerName: "Sistema AgileDev", // Placeholder
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
                        <div className="space-y-2">
                            <Label>Periodo</Label>
                            <Input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="Ej. Mayo 2024" />
                        </div>
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

                {/* Items Section */}
                <div className="border rounded-md p-4 bg-muted/20">
                    <h4 className="font-medium mb-2">Detalle de {type === 'FACTURA' ? 'Productos' : 'Cobranza'}</h4>

                    <div className="flex gap-2 mb-2 items-end">
                        <div className="flex-1">
                            <Label>Descripción</Label>
                            <Input
                                value={newItem.description}
                                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                placeholder={type === 'FACTURA' ? "Producto..." : "Concepto..."}
                            />
                        </div>
                        {type === 'FACTURA' && (
                            <div className="w-20">
                                <Label>Cant.</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={newItem.quantity}
                                    onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                                />
                            </div>
                        )}
                        <div className="w-24">
                            <Label>{type === 'FACTURA' ? 'Precio' : 'Monto'}</Label>
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
                                {type === 'FACTURA' && <TableHead className="w-16">Cant</TableHead>}
                                <TableHead className="w-24 text-right">Importe</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item, i) => (
                                <TableRow key={i}>
                                    <TableCell>{item.description}</TableCell>
                                    {type === 'FACTURA' && <TableCell>{item.quantity}</TableCell>}
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
