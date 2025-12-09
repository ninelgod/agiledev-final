
import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const fromNumber = process.env.TWILIO_PHONE_NUMBER

// Initialize client only if credentials exist to avoid crashes during build/dev if not configured
const client = (accountSid && authToken) ? twilio(accountSid, authToken) : null

export async function sendSMS(to: string, body: string) {
    if (!client) {
        console.warn("[SMS] Twilio credentials not configured. Message skipped:", { to, body })
        return { success: false, error: "Twilio credentials missing" }
    }

    if (!fromNumber) {
        console.warn("[SMS] Twilio Phone Number not configured. Message skipped:", { to, body })
        return { success: false, error: "Twilio Phone Number missing" }
    }

    try {
        const message = await client.messages.create({
            body: body,
            from: fromNumber,
            to: to,
        })
        console.log(`[SMS] Sent successfully to ${to}. SID: ${message.sid}`)
        return { success: true, sid: message.sid }
    } catch (error: any) {
        console.error("[SMS] Error sending message:", error)
        return { success: false, error: error.message }
    }
}
