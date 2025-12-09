
"use client"

import { useState, useEffect } from "react"
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
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle } from "lucide-react"

interface User {
    id: number
    username: string
    email: string
    phoneNumber?: string | null
    notificationsEnabled: boolean
}

interface NotificationSettingsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    user: User | null
    onUpdateSuccess: (updatedUser: User) => void
}

export function NotificationSettingsDialog({ open, onOpenChange, user, onUpdateSuccess }: NotificationSettingsDialogProps) {
    const [phoneNumber, setPhoneNumber] = useState("")
    const [enabled, setEnabled] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    useEffect(() => {
        if (user) {
            setPhoneNumber(user.phoneNumber || "")
            setEnabled(user.notificationsEnabled || false)
        }
    }, [user])

    const handleSubmit = async () => {
        setIsLoading(true)
        setError("")
        setSuccess("")

        try {
            // NOTE: We need an endpoint to update user profile. 
            // Assuming for now I can create one or use existing if any.
            // I will implement a quick profile update endpoint or reuse logic.
            // Let's assume /api/auth/profile exists or create it.
            // Since it wasn't in the plan, I'll need to create it! 
            // I'll assume for this file creation it calls that endpoint.

            const response = await fetch("/api/auth/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: user?.id, phoneNumber, notificationsEnabled: enabled }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Error al actualizar perfil")
            }

            setSuccess("Preferencias actualizadas")
            setTimeout(() => {
                setSuccess("")
                onUpdateSuccess(data)
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
                    <DialogTitle>Configurar Notificaciones</DialogTitle>
                    <DialogDescription>
                        Recibe alertas por SMS cuando tus cuotas estén por vencer.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex items-center space-x-2">
                        <Switch id="notifications" checked={enabled} onCheckedChange={setEnabled} />
                        <Label htmlFor="notifications">Activar notificaciones</Label>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Número de Celular</Label>
                        <Input
                            id="phone"
                            placeholder="999 999 999"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            disabled={!enabled && !phoneNumber} // Allow editing if disabled? Maybe better to always allow
                        />
                        <p className="text-xs text-muted-foreground">
                            Ingresa tu número para recibir alertas SMS.
                        </p>
                    </div>
                </div>

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
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
