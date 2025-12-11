
export interface InvoiceItem {
    description: string;
    quantity: number;
    price: number;
    amount: number;
}

export interface Invoice {
    id: number;
    userId: number;
    issuerName: string;
    issuerDocument?: string;
    recipientName?: string;
    recipientAddress?: string;
    invoiceNumber: string;
    issueDate?: string; // ISO Date String
    dueDate?: string;   // ISO Date String
    currency: string;
    totalAmount: number;
    notes?: string;
    items?: InvoiceItem[];
    status: string;

    // New Fields
    documentType: 'FACTURA' | 'RECIBO';
    paymentMethod?: string;
    period?: string;
    subtotal?: number;
    tax?: number;

    createdAt: string;
}
