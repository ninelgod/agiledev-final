
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/frontend/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/frontend/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/frontend/components/ui/dialog"
import { Input } from "@/frontend/components/ui/input"
import { Label } from "@/frontend/components/ui/label"
import { Switch } from "@/frontend/components/ui/switch"
import { Alert, AlertDescription } from "@/frontend/components/ui/alert"
import { CheckCircle2, AlertCircle } from "lucide-react"
import { PushNotificationManager } from "@/frontend/components/push-notification-manager"

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

const COUNTRY_CODES = [
    { code: "+51", country: "Perú 🇵🇪" },
    { code: "+1", country: "USA 🇺🇸" },
    { code: "+52", country: "México 🇲🇽" },
    { code: "+57", country: "Colombia 🇨🇴" },
    { code: "+56", country: "Chile 🇨🇱" },
    { code: "+54", country: "Argentina 🇦🇷" },
    { code: "+34", country: "España 🇪🇸" },
]

export function NotificationSettingsDialog({ open, onOpenChange, user, onUpdateSuccess }: NotificationSettingsDialogProps) {
    const [phoneNumber, setPhoneNumber] = useState("")
    const [countryCode, setCountryCode] = useState("+51")
    const [enabled, setEnabled] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    useEffect(() => {
        if (user) {
            setEnabled(user.notificationsEnabled || false)

            if (user.phoneNumber) {
                // Intentar detectar el código de país
                const foundCode = COUNTRY_CODES.find(c => user.phoneNumber?.startsWith(c.code))
                if (foundCode) {
                    setCountryCode(foundCode.code)
                    setPhoneNumber(user.phoneNumber.replace(foundCode.code, ""))
                } else {
                    // Si no coincide, dejarlo como está o asumir por defecto (aquí dejamos el raw si no tiene match)
                    setPhoneNumber(user.phoneNumber)
                }
            } else {
                setPhoneNumber("")
                setCountryCode("+51")
            }
        }
    }, [user])

    const handleSubmit = async () => {
        setIsLoading(true)
        setError("")
        setSuccess("")

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/auth/profile`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: user?.id,
                    // phoneNumber removed
                }),
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
                        Recibe alertas en tu dispositivo cuando tus cuotas estén por vencer.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-4">
                        <div className="border p-4 rounded-md bg-muted/20">
                            <h4 className="text-sm font-medium mb-2">Notificaciones Push</h4>
                            <p className="text-xs text-muted-foreground mb-4">
                                Activa las notificaciones en este dispositivo para recibir alertas de pago.
                                No es necesario número de teléfono.
                            </p>
                            {user && <PushNotificationManager userId={user.id} />}
                        </div>
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

