export interface OrderItem {
    id: string;
    product_id: number;
    snap_product_name: string;
    snap_product_sku?: string;
    snap_product_price: string;
    quantity: number;
    total_line_price: string;
}

export interface Order {
    id: string;
    invoice_number: string;
    customer: {
        id: string;
        name: string;
        email: string;
        phone?: string;
    };
    total_amount: string;
    payment_status: 'unpaid' | 'paid' | 'failed' | 'refunded';
    order_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'returned';
    created_at: string;
    paid_at?: string;
    items?: OrderItem[];
}