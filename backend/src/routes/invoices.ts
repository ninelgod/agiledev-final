
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// CREATE Invoice
router.post('/', async (req, res) => {
    try {
        const {
            userId,
            issuerName,
            issuerDocument,
            recipientName,
            recipientAddress,
            invoiceNumber,
            issueDate,
            dueDate,
            currency,
            totalAmount,
            items,
            notes,
            documentType,
            paymentMethod,
            period,
            subtotal,
            tax
        } = req.body;

        // Basic validation
        if (!userId || !issuerName || !totalAmount) {
            return res.status(400).json({ error: "Missing required fields: userId, issuerName, totalAmount" });
        }

        const newInvoice = await prisma.invoice.create({
            data: {
                userId: Number(userId),
                issuerName,
                issuerDocument,
                recipientName,
                recipientAddress,
                invoiceNumber: invoiceNumber || "S/N",
                issueDate: issueDate ? new Date(issueDate) : null,
                dueDate: dueDate ? new Date(dueDate) : null,
                currency: currency || "PEN",
                totalAmount: totalAmount,
                items: items || [],
                notes,
                status: "PENDING",
                documentType: documentType || "FACTURA",
                paymentMethod,
                period,
                subtotal,
                tax
            }
        });

        res.status(201).json(newInvoice);
    } catch (error) {
        console.error("Error creating invoice:", error);
        res.status(500).json({ error: "Internal server error creating invoice." });
    }
});

// GET Invoices by User
router.get('/', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ error: "userId query parameter is required" });
        }

        const invoices = await prisma.invoice.findMany({
            where: { userId: Number(userId) },
            orderBy: { issueDate: 'desc' }
        });

        res.json({ invoices });
    } catch (error) {
        console.error("Error fetching invoices:", error);
        res.status(500).json({ error: "Internal server error fetching invoices" });
    }
});

// DELETE Invoice
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.invoice.delete({
            where: { id: Number(id) }
        });
        res.json({ success: true, message: "Invoice deleted" });
    } catch (error) {
        console.error("Error deleting invoice:", error);
        res.status(500).json({ error: "Error deleting invoice" });
    }
});

export default router;
