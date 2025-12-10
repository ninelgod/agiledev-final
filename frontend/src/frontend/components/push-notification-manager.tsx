'use client'

import { useState, useEffect } from 'react'
import { Switch } from '@/frontend/components/ui/switch'
import { Label } from '@/frontend/components/ui/label'
import { toast } from 'sonner'

// Helper to convert keys because specific browsers require Uint8Array
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

export function PushNotificationManager({ userId }: { userId: number }) {
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [subscription, setSubscription] = useState<PushSubscription | null>(null)
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => {
                    setRegistration(reg)
                    reg.pushManager.getSubscription().then(sub => {
                        if (sub) {
                            setSubscription(sub)
                            setIsSubscribed(true)

                            // SYNC: Ensure backend knows about this subscription for CURRENT user
                            // This fixes the issue where browser has sub but DB doesn't (different user or lost sync)
                            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                            fetch(`${apiUrl}/api/notifications/subscribe`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    subscription: sub,
                                    userId: userId
                                })
                            }).catch(e => console.error("Sync sub error:", e))
                        }
                    })
                })
                .catch(err => {
                    console.error('Service Worker registration failed:', err)
                })
        }
    }, [userId]) // Depend on userId to resync if user changes

    const subscribeToPush = async () => {
        setIsLoading(true)

        if (Notification.permission === 'denied') {
            toast.error('Las notificaciones están bloqueadas. Habilítalas en la configuración de tu navegador.')
            setIsLoading(false)
            return
        }

        if (!registration) {
            toast.error('Error: Service Worker no registrado. Recarga la página.')
            setIsLoading(false)
            return
        }

        try {
            // Check permission first
            const permission = await Notification.requestPermission()
            if (permission !== 'granted') {
                toast.error('Permiso de notificaciones denegado.')
                setIsLoading(false)
                return
            }

            // FORCE hardcoded key to rule out Vercel Env Var issues
            let vapidKey = 'BET7cT1TmL_Nkv4fxkOKCx20J0Dl7R7mVh4nsKzL8qL92tlrlNA0Msiw96FmQGlFonsOzBY7p9S7QWNwxnvItYU'

            // Clean the key just in case (remove quotes, whitespace)
            vapidKey = vapidKey.replace(/['"\s]/g, '')

            console.log('[DEBUG] Vapid Key Length:', vapidKey.length)
            const convertedKey = urlBase64ToUint8Array(vapidKey)
            console.log('[DEBUG] Converted Key Length:', convertedKey.length)

            // CRITICAL FIX: Unsubscribe existing ghost subscriptions first
            const existingSub = await registration.pushManager.getSubscription()
            if (existingSub) {
                console.log('[DEBUG] Unsubscribing existing subscription/ghost...')
                await existingSub.unsubscribe()
            }

            console.log('[DEBUG] Subscribing with key...')
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedKey
            })
            console.log('[DEBUG] Subscription successful:', sub)

            setSubscription(sub)
            setIsSubscribed(true)

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            await fetch(`${apiUrl}/api/notifications/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscription: sub,
                    userId: userId
                })
            })

            toast.success('Notificaciones activadas correctamente')
        } catch (error: any) {
            console.error('Error subscribing to push:', error)
            toast.error(`Error al activar: ${error.message || 'Error desconocido'}`)
        } finally {
            setIsLoading(false)
        }
    }

    const unsubscribeFromPush = async () => {
        if (!subscription) return

        setIsLoading(true)
        try {
            await subscription.unsubscribe()
            setSubscription(null)
            setIsSubscribed(false)
            toast.info('Notificaciones desactivadas')
        } catch (error) {
            console.error('Error unsubscribing:', error)
            toast.error('Error al desactivar notificaciones')
        } finally {
            setIsLoading(false)
        }
    }

    const handleToggle = (checked: boolean) => {
        if (checked) {
            subscribeToPush()
        } else {
            unsubscribeFromPush()
        }
    }

    return (
        <div className="flex items-center space-x-2">
            <Switch
                id="push-notifications"
                checked={isSubscribed}
                onCheckedChange={handleToggle}
                disabled={isLoading}
            />
            <Label htmlFor="push-notifications" className={isLoading ? 'opacity-50' : ''}>
                {isLoading
                    ? 'Procesando...'
                    : (isSubscribed ? 'Notificaciones activadas' : 'Activar notificaciones')
                }
            </Label>

            {isSubscribed && (
                <button
                    onClick={async () => {
                        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                        toast.promise(
                            fetch(`${apiUrl}/api/notifications/test`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ userId }),
                            }).then(async r => {
                                if (!r.ok) {
                                    const text = await r.text()
                                    try {
                                        const json = JSON.parse(text)
                                        throw new Error(json.message || json.error || text)
                                    } catch (e: any) {
                                        throw new Error(text || e.message)
                                    }
                                }
                                return r.json()
                            }),
                            {
                                loading: 'Enviando prueba...',
                                success: '¡Enviada! Revisa tu barra de estado.',
                                error: (err) => `Error: ${err.message}`
                            }
                        )
                    }}
                    className="ml-4 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded border border-indigo-200 hover:bg-indigo-200"
                >
                    Enviar Notificación de Prueba
                </button>
            )}
        </div>
    )
}

