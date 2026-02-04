"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import styles from './page.module.css';
import { notifyError, notifySuccess } from '@/utils/toastHelper';
import { 
    Loader2, ArrowLeft, Save, ShoppingCart, 
    User, Search, Plus, Trash2, MapPin, 
    CreditCard, Package, X, Check, ChevronLeft, ChevronRight, ImageIcon
} from 'lucide-react';

interface Category {
    id: number;
    name: string;
    parent?: {
        name: string;
    };
}

interface ProductVariant {
    id: number;
    product_id: number;
    name: string;
    price: string;
    stock: number;
    sku: string;
}

interface Product {
    id: number;
    name: string;
    sku: string;
    price: string;
    stock: number;
    similarities?: string;
    product_type: 'simple' | 'variable';
    category?: Category;
    images?: { id: number; url: string }[];
    variants?: ProductVariant[];
}

interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    addresses?: Address[];
}

interface Address {
    id: string;
    label: string;
    full_address: string;
    recipient_name: string;
}

interface CartItem {
    product_id: number;
    variant_id?: number;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    image_url?: string;
}

const ITEMS_PER_PAGE = 5;

export default function AddOrderPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(true);

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
    const [selectedAddressId, setSelectedAddressId] = useState<string>('');
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
    const [shippingCost, setShippingCost] = useState<string>('15');

    const [productSearch, setProductSearch] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');
    const [prodPage, setProdPage] = useState(1);
    const [custPage, setCustPage] = useState(1);

    const [showVariantModal, setShowVariantModal] = useState(false);
    const [currentVariableProduct, setCurrentVariableProduct] = useState<Product | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [custRes, prodRes] = await Promise.all([
                    api.get('/customers', { params: { limit: 100 } }),
                    api.get('/products', { params: { limit: 100, include_variants: true } }) 
                ]);
                
                setCustomers(custRes.data.data || []);
                setProducts(prodRes.data.data || []);
            } catch (error) {
                notifyError("Failed to load master data");
            } finally {
                setIsDataLoading(false);
            }
        };
        fetchData();
    }, []);

    const selectedCustomer = useMemo(() => 
        customers.find(c => c.id === selectedCustomerId), 
    [selectedCustomerId, customers]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const term = productSearch.toLowerCase();
            return (
                p.name.toLowerCase().includes(term) ||
                (p.sku && p.sku.toLowerCase().includes(term)) ||
                (p.similarities && p.similarities.toLowerCase().includes(term))
            );
        });
    }, [products, productSearch]);

    const filteredCustomers = useMemo(() => {
        return customers.filter(c => {
            const term = customerSearch.toLowerCase();
            return (
                c.name.toLowerCase().includes(term) ||
                c.email.toLowerCase().includes(term)
            );
        });
    }, [customers, customerSearch]);

    const paginatedProducts = useMemo(() => {
        const start = (prodPage - 1) * ITEMS_PER_PAGE;
        return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredProducts, prodPage]);

    const paginatedCustomers = useMemo(() => {
        const start = (custPage - 1) * ITEMS_PER_PAGE;
        return filteredCustomers.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredCustomers, custPage]);

    const totalProdPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    const totalCustPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);

    const handleProductClick = (product: Product) => {
        if (product.product_type === 'variable') {
            setCurrentVariableProduct(product);
            setShowVariantModal(true);
        } else {
            addCartItem({
                product_id: product.id,
                name: product.name,
                sku: product.sku,
                price: parseFloat(product.price),
                quantity: 1,
                image_url: product.images?.[0]?.url
            });
        }
    };

    const handleSelectVariant = (variant: ProductVariant) => {
        if (!currentVariableProduct) return;
        
        addCartItem({
            product_id: currentVariableProduct.id,
            variant_id: variant.id,
            name: `${currentVariableProduct.name} - ${variant.name}`,
            sku: variant.sku || currentVariableProduct.sku,
            price: parseFloat(variant.price),
            quantity: 1,
            image_url: currentVariableProduct.images?.[0]?.url
        });

        setShowVariantModal(false);
        setCurrentVariableProduct(null);
    };

    const addCartItem = (newItem: CartItem) => {
        setCartItems(prev => {
            const exists = prev.find(item => 
                item.product_id === newItem.product_id && 
                item.variant_id === newItem.variant_id
            );

            if (exists) {
                return prev.map(item => 
                    (item.product_id === newItem.product_id && item.variant_id === newItem.variant_id)
                    ? { ...item, quantity: item.quantity + 1 } 
                    : item
                );
            }
            return [...prev, newItem];
        });
        notifySuccess("Added to cart");
    };

    const handleRemoveItem = (index: number) => {
        setCartItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleQuantityChange = (index: number, val: string) => {
        if (!val) return;
        const qty = parseInt(val);
        if (isNaN(qty) || qty < 1) return;
        setCartItems(prev => prev.map((item, i) => 
            i === index ? { ...item, quantity: qty } : item
        ));
    };

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const grandTotal = subtotal + (parseFloat(shippingCost) || 0);

    const formatCurrency = (val: number) => 
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedCustomerId) return notifyError("Please select a customer");
        if (!selectedAddressId) return notifyError("Please select a shipping address");
        if (cartItems.length === 0) return notifyError("Cart is empty");

        setIsLoading(true);

        const payload = {
            customer_id: selectedCustomerId,
            address_id: selectedAddressId,
            payment_method: paymentMethod,
            shipping_cost: parseFloat(shippingCost) || 0,
            items: cartItems.map(item => ({
                product_id: item.product_id,
                variant_id: item.variant_id,
                quantity: item.quantity
            }))
        };

        try {
            await api.post('/orders', payload);
            notifySuccess('Order created successfully');
            router.push('/dashboard/orders');
        } catch (error: any) {
            notifyError(error.response?.data?.message || 'Failed to create order');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => setProdPage(1), [productSearch]);
    useEffect(() => setCustPage(1), [customerSearch]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Create New Order</h1>
                    <p className={styles.subtitle}>Select products and customer to create a manual order.</p>
                </div>
                <Link href="/dashboard/orders" className={styles.backLink}>
                    <ArrowLeft size={16} /> Back to List
                </Link>
            </div>

            <form onSubmit={handleSubmit} className={styles.mainGrid}>
                <div className={styles.leftColumn}>
                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}><Package size={18} /> Product Catalogue</h3>
                        
                        <div className={styles.searchBoxWrapper}>
                            <Search size={16} className={styles.searchIcon} />
                            <input 
                                type="text" 
                                className={styles.searchInput} 
                                placeholder="Search by Name, SKU, or Similarities..." 
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                            />
                        </div>

                        <div className={styles.catalogueGrid}>
                            {paginatedProducts.map(p => (
                                <div key={p.id} className={styles.productCard} onClick={() => handleProductClick(p)}>
                                    <div className={styles.productImage}>
                                        {p.images && p.images[0] ? (
                                            <img src={p.images[0].url} alt={p.name} />
                                        ) : (
                                            <div className={styles.noImage}><ImageIcon size={24} /></div>
                                        )}
                                        {p.product_type === 'variable' && <span className={styles.badgeVariable}>Variable</span>}
                                    </div>
                                    <div className={styles.productInfo}>
                                        <h4 className={styles.prodTitle}>{p.name}</h4>
                                        <div className={styles.prodCats}>
                                            <span>{p.category?.parent?.name || 'Main'}</span>
                                            <span className={styles.chevron}>›</span>
                                            <span>{p.category?.name || 'Uncategorized'}</span>
                                        </div>
                                        <div className={styles.prodPriceRow}>
                                            <span className={styles.prodPrice}>
                                                {p.product_type === 'variable' ? 'From ' : ''}
                                                {formatCurrency(parseFloat(p.price))}
                                            </span>
                                            <button type="button" className={styles.addBtn}><Plus size={14} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {paginatedProducts.length === 0 && <p className={styles.emptyText}>No products found.</p>}
                        </div>

                        {totalProdPages > 1 && (
                            <div className={styles.pagination}>
                                <button type="button" onClick={() => setProdPage(p => Math.max(1, p-1))} disabled={prodPage === 1}>
                                    <ChevronLeft size={16} />
                                </button>
                                <span>Page {prodPage} of {totalProdPages}</span>
                                <button type="button" onClick={() => setProdPage(p => Math.min(totalProdPages, p+1))} disabled={prodPage === totalProdPages}>
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}><ShoppingCart size={18} /> Order Items ({cartItems.length})</h3>
                        {cartItems.length === 0 ? (
                            <div className={styles.emptyCart}>
                                <ShoppingCart size={48} strokeWidth={1} />
                                <p>Cart is empty. Select products from the catalogue.</p>
                            </div>
                        ) : (
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th style={{textAlign: 'right'}}>Price</th>
                                            <th style={{textAlign: 'center'}}>Qty</th>
                                            <th style={{textAlign: 'right'}}>Total</th>
                                            <th style={{width: '40px'}}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cartItems.map((item, index) => (
                                            <tr key={`${item.product_id}-${item.variant_id || 'simple'}`}>
                                                <td>
                                                    <div className={styles.cartItemMeta}>
                                                        {item.image_url && <img src={item.image_url} alt="img" className={styles.cartImg} />}
                                                        <div>
                                                            <div className={styles.cartItemName}>{item.name}</div>
                                                            <div className={styles.cartItemSku}>{item.sku}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{textAlign: 'right'}}>{formatCurrency(item.price)}</td>
                                                <td style={{textAlign: 'center'}}>
                                                    <input 
                                                        type="number" 
                                                        className={styles.qtyInput} 
                                                        value={item.quantity} 
                                                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                                                        min={1}
                                                    />
                                                </td>
                                                <td style={{textAlign: 'right', fontWeight: 600}}>
                                                    {formatCurrency(item.price * item.quantity)}
                                                </td>
                                                <td>
                                                    <button type="button" className={styles.deleteBtn} onClick={() => handleRemoveItem(index)}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.rightColumn}>
                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}><User size={18} /> Customer Selection</h3>
                        
                        <div className={styles.searchBoxWrapper}>
                            <Search size={16} className={styles.searchIcon} />
                            <input 
                                type="text" 
                                className={styles.searchInput} 
                                placeholder="Search Name or Email..." 
                                value={customerSearch}
                                onChange={(e) => setCustomerSearch(e.target.value)}
                            />
                        </div>

                        {selectedCustomer ? (
                            <div className={styles.selectedCustomerCard}>
                                <div className={styles.selectedCustHeader}>
                                    <span className={styles.selectedLabel}>Selected Customer</span>
                                    <button type="button" onClick={() => { setSelectedCustomerId(''); setSelectedAddressId(''); }} className={styles.changeBtn}>Change</button>
                                </div>
                                <div className={styles.custDetails}>
                                    <strong>{selectedCustomer.name}</strong>
                                    <p>{selectedCustomer.email}</p>
                                    <p>{selectedCustomer.phone || 'No phone'}</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className={styles.customerList}>
                                    {paginatedCustomers.map(c => (
                                        <div key={c.id} className={styles.customerItem} onClick={() => setSelectedCustomerId(c.id)}>
                                            <div className={styles.customerAvatar}>
                                                {c.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className={styles.customerInfo}>
                                                <div className={styles.custName}>{c.name}</div>
                                                <div className={styles.custEmail}>{c.email}</div>
                                            </div>
                                            <Plus size={16} className={styles.addIcon} />
                                        </div>
                                    ))}
                                    {paginatedCustomers.length === 0 && <p className={styles.emptyText}>No customers found.</p>}
                                </div>

                                {totalCustPages > 1 && (
                                    <div className={styles.pagination}>
                                        <button type="button" onClick={() => setCustPage(p => Math.max(1, p-1))} disabled={custPage === 1}>
                                            <ChevronLeft size={16} />
                                        </button>
                                        <span>{custPage} / {totalCustPages}</span>
                                        <button type="button" onClick={() => setCustPage(p => Math.min(totalCustPages, p+1))} disabled={custPage === totalCustPages}>
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}><MapPin size={18} /> Shipping Details</h3>
                        
                        {!selectedCustomerId ? (
                            <p className={styles.placeholderText}>Please select a customer first.</p>
                        ) : (
                            <>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Shipping Address</label>
                                    <select 
                                        className={styles.select}
                                        value={selectedAddressId}
                                        onChange={(e) => setSelectedAddressId(e.target.value)}
                                    >
                                        <option value="">-- Choose Address --</option>
                                        {selectedCustomer?.addresses?.map(addr => (
                                            <option key={addr.id} value={addr.id}>
                                                {addr.label} - {addr.recipient_name}
                                            </option>
                                        ))}
                                    </select>
                                    {selectedCustomer?.addresses?.length === 0 && (
                                        <p className={styles.errorText}>This customer has no address.</p>
                                    )}
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Shipping Cost (USD)</label>
                                    <input 
                                        type="number" 
                                        className={styles.noArrowInput} 
                                        value={shippingCost}
                                        onChange={(e) => setShippingCost(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}><CreditCard size={18} /> Summary</h3>
                        
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Payment Method</label>
                            <select 
                                className={styles.select} 
                                value={paymentMethod} 
                                onChange={(e) => setPaymentMethod(e.target.value)}
                            >
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="credit_card">Credit Card</option>
                                <option value="cod">Cash On Delivery (COD)</option>
                            </select>
                        </div>

                        <div className={styles.summaryBox}>
                            <div className={styles.summaryRow}>
                                <span>Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className={styles.summaryRow}>
                                <span>Shipping</span>
                                <span>{formatCurrency(parseFloat(shippingCost) || 0)}</span>
                            </div>
                            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                                <span>Grand Total</span>
                                <span>{formatCurrency(grandTotal)}</span>
                            </div>
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            <span>Create Order</span>
                        </button>
                    </div>
                </div>
            </form>

            {showVariantModal && currentVariableProduct && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h3>Select Variant: {currentVariableProduct.name}</h3>
                            <button type="button" onClick={() => setShowVariantModal(false)} className={styles.closeBtn}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className={styles.variantList}>
                            {currentVariableProduct.variants && currentVariableProduct.variants.length > 0 ? (
                                currentVariableProduct.variants.map(variant => (
                                    <div 
                                        key={variant.id} 
                                        className={`${styles.variantItem} ${variant.stock === 0 ? styles.outOfStock : ''}`}
                                        onClick={() => variant.stock > 0 && handleSelectVariant(variant)}
                                    >
                                        <div className={styles.variantInfo}>
                                            <span className={styles.variantName}>{variant.name}</span>
                                            <span className={styles.variantSku}>{variant.sku}</span>
                                        </div>
                                        <div className={styles.variantMeta}>
                                            <span className={styles.variantPrice}>{formatCurrency(parseFloat(variant.price))}</span>
                                            <span className={styles.variantStock}>Stock: {variant.stock}</span>
                                            {variant.stock > 0 && <Check size={16} className={styles.checkIcon} />}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className={styles.noVariants}>No variants available.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}