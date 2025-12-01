import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router';
import AddClientModal from '../../components/common/AddClientModal';
import InvoicePDFPreview, { InvoicePDFPreviewRef } from '../../components/common/InvoicePDFPreview';
import DatePicker from '../../components/form/date-picker';
import { apiUrl } from '../../config/api';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { Identifier } from 'dnd-core';

interface Client {
  id: string;
  clientNumber: number;
  name: string;
  type: 'COMPANY' | 'PRIVATE';
  vatNumber?: string;
  address?: string;
  countryCode: string;
  phone?: string;
  email?: string;
  homepage?: string;
}

interface InvoiceItem {
  id: string;
  productName: string;
  description: string;
  quantity: number;
  unitName: string;
  unitNetPrice: number;
  unitGrossPrice: number;
  taxRate: number;
  discount: number; // Discount percentage (0-100)
  netAmount: number;
  grossAmount: number;
}

const ITEM_TYPE = 'INVOICE_ITEM';

interface DraggableInvoiceItemProps {
  item: InvoiceItem;
  index: number;
  updateItem: (index: number, field: keyof InvoiceItem, value: string | number) => void;
  removeItem: (index: number) => void;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  formatCurrency: (amount: number) => string;
  showProductDiscount: boolean;
}

const unitOptions = ['Stunde(n)', 'Tag(e)', 'Stück', 'Pauschal', 'km', 'Monat(e)', 'Jahr(e)'];
const taxRateOptions = [0, 10, 13, 20];

function DraggableInvoiceItem({
  item,
  index,
  updateItem,
  removeItem,
  moveItem,
  formatCurrency,
  showProductDiscount,
}: DraggableInvoiceItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLButtonElement>(null);

  const [{ handlerId }, drop] = useDrop<
    { id: string; index: number },
    void,
    { handlerId: Identifier | null }
  >({
    accept: ITEM_TYPE,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(dragItem: { index: number }, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = dragItem.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = (clientOffset as { x: number; y: number }).y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      moveItem(dragIndex, hoverIndex);
      dragItem.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: () => {
      return { id: item.id, index };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0.4 : 1;
  drop(ref);
  drag(dragRef);

  return (
    <div
      ref={ref}
      data-handler-id={handlerId}
      style={{ opacity, userSelect: 'none', padding: '4px 0', margin: 0 }}
    >
      {/* Main row with all fields inline */}
      <div className="flex flex-col gap-3">
        {/* First row: All fields in one line - no wrapping */}
        <div className="flex gap-2 items-end">
          {/* Product Name with Drag Handle - 50% minus gap compensation */}
          <div className="flex-1" style={{ maxWidth: 'calc(50% - 1rem)', minWidth: '0' }}>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
              Produkt
            </label>
            <div className="flex gap-0">
              <button
                ref={dragRef}
                type="button"
                className="flex-shrink-0 px-2 py-2 border border-r-0 border-gray-300 dark:border-gray-700 rounded-l-lg bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-move"
                style={{ backgroundColor: 'rgb(250, 250, 250)' }}
              >
                <svg className="w-4 h-4 text-gray-500" viewBox="64 64 896 896" fill="currentColor">
                  <path d="M909.3 506.3L781.7 405.6a7.23 7.23 0 00-11.7 5.7V476H548V254h64.8c6 0 9.4-7 5.7-11.7L517.7 114.7a7.14 7.14 0 00-11.3 0L405.6 242.3a7.23 7.23 0 005.7 11.7H476v222H254v-64.8c0-6-7-9.4-11.7-5.7L114.7 506.3a7.14 7.14 0 000 11.3l127.5 100.8c4.7 3.7 11.7.4 11.7-5.7V548h222v222h-64.8c-6 0-9.4 7-5.7 11.7l100.8 127.5c2.9 3.7 8.5 3.7 11.3 0l100.8-127.5c3.7-4.7.4-11.7-5.7-11.7H548V548h222v64.8c0 6 7 9.4 11.7 5.7l127.5-100.8a7.3 7.3 0 00.1-11.4z"></path>
                </svg>
              </button>
              <input
                type="text"
                value={item.productName}
                onChange={(e) => updateItem(index, 'productName', e.target.value)}
                placeholder="Produkt"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition overflow-hidden text-ellipsis"
                style={{ minWidth: '0' }}
              />
            </div>
          </div>

          {/* Quantity */}
          <div className="flex-shrink-0 w-[100px]">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
              Menge
            </label>
            <input
              type="number"
              value={item.quantity}
              onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
              placeholder="1"
              min="0.01"
              step="0.01"
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition text-center"
            />
          </div>

          {/* Unit */}
          <div className="flex-shrink-0 w-[140px]">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
              Einheit
            </label>
            <select
              value={item.unitName}
              onChange={(e) => updateItem(index, 'unitName', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition"
            >
              {unitOptions.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>

          {/* Price (netto) */}
          <div className="flex-shrink-0 w-[140px]">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
              Preis (netto)
            </label>
            <input
              type="number"
              value={item.unitNetPrice}
              onChange={(e) => updateItem(index, 'unitNetPrice', Number(e.target.value))}
              placeholder="0,00 €"
              min="0"
              step="0.01"
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition"
            />
          </div>

          {/* Tax Rate */}
          <div className="flex-shrink-0 w-[100px]">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
              USt.
            </label>
            <select
              value={item.taxRate}
              onChange={(e) => updateItem(index, 'taxRate', Number(e.target.value))}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition"
            >
              {taxRateOptions.map((rate) => (
                <option key={rate} value={rate}>
                  {rate} %
                </option>
              ))}
            </select>
          </div>

          {/* Discount - Conditionally rendered */}
          {showProductDiscount && (
            <div className="flex-shrink-0 w-[100px]">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                Rabatt
              </label>
              <input
                type="number"
                value={item.discount}
                onChange={(e) => updateItem(index, 'discount', Number(e.target.value))}
                placeholder="0"
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition text-center"
              />
            </div>
          )}

          {/* Net Amount */}
          <div className="flex-shrink-0 w-[140px]">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
              Betrag (netto)
            </label>
            <input
              type="text"
              value={formatCurrency(item.netAmount)}
              disabled
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 outline-none"
            />
          </div>

          {/* Delete button */}
          <div className="flex-shrink-0">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">&nbsp;</label>
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="h-[38px] px-3 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center"
            >
              <svg className="w-4 h-4" viewBox="64 64 896 896" fill="currentColor">
                <path d="M360 184h-8c4.4 0 8-3.6 8-8v8h304v-8c0 4.4 3.6 8 8 8h-8v72h72v-80c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v80h72v-72zm504 72H160c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h60.4l24.7 523c1.6 34.1 29.8 61 63.9 61h454c34.2 0 62.3-26.8 63.9-61l24.7-523H888c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zM731.3 840H292.7l-24.2-512h487l-24.2 512z"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Second row: Description - 50% width */}
        <div className="w-full lg:w-1/2 lg:pr-1">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
            Beschreibung
          </label>
          <textarea
            value={item.description}
            onChange={(e) => updateItem(index, 'description', e.target.value)}
            placeholder="Beschreibung"
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition resize-y"
          />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700 mt-3"></div>
    </div>
  );
}

export default function CreateInvoice() {
  const { token, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pdfRef = useRef<InvoicePDFPreviewRef>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/invoices');
    }
  }, [isAdmin, navigate]);

  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);

  // Check if we're coming back from the review page with saved data
  const savedData = location.state as any;

  // Always use current date for invoice date
  const currentDate = new Date().toISOString().split('T')[0];

  // Form state - initialize from saved data if available
  const [selectedClient, setSelectedClient] = useState(savedData?.clientId || '');
  const [invoiceNumber, setInvoiceNumber] = useState(savedData?.invoiceNumber || '');
  const [invoiceDate, setInvoiceDate] = useState(currentDate);
  const [dueDate, setDueDate] = useState(savedData?.dueDate || '');
  const [paymentTerms, setPaymentTerms] = useState(14);
  const [servicePeriodStart, setServicePeriodStart] = useState(savedData?.servicePeriodStart || '');
  const [servicePeriodEnd, setServicePeriodEnd] = useState(savedData?.servicePeriodEnd || '');
  const [isReverseCharge, setIsReverseCharge] = useState(savedData?.isReverseCharge || false);
  const [notes, setNotes] = useState(savedData?.notes || '');
  const [items, setItems] = useState<InvoiceItem[]>(savedData?.items || []);
  const [globalDiscount, setGlobalDiscount] = useState(savedData?.globalDiscount || 0);
  const [showProductDiscount, setShowProductDiscount] = useState(false);
  const [showGlobalDiscount, setShowGlobalDiscount] = useState(savedData?.globalDiscount > 0 || false);
  const [conditions, setConditions] = useState(savedData?.conditions || `Bitte überweisen Sie den Betrag zeitnah auf folgendes Konto:
Seth-Moses Ellermann
IBAN: DE37100110012623755446
BIC: NTSBDEB1XXX

Ich danke für Ihr Vertrauen. 
Es würde mich freuen auch in Zukunft wieder für Sie tätig zu sein.
Seth-Moses Ellermann`);

  useEffect(() => {
    // Always set current date on component mount
    setInvoiceDate(currentDate);
    fetchClients();
    // Only fetch next invoice number if we don't have saved data
    if (!savedData?.invoiceNumber) {
      fetchNextInvoiceNumber();
    }
  }, []);

  // Calculate due date based on payment terms
  useEffect(() => {
    if (invoiceDate && paymentTerms) {
      const date = new Date(invoiceDate);
      date.setDate(date.getDate() + paymentTerms);
      setDueDate(date.toISOString().split('T')[0]);
    }
  }, [invoiceDate, paymentTerms]);

  // Automatically set Reverse Charge based on client country
  useEffect(() => {
    if (selectedClient) {
      const client = clients.find(c => c.id === selectedClient);
      if (client) {
        // Reverse Charge applies if client is NOT from Austria
        const isReverseChargeApplicable = client.countryCode !== 'AT' && client.countryCode !== 'Österreich';
        setIsReverseCharge(isReverseChargeApplicable);
      }
    }
  }, [selectedClient, clients]);

  const fetchNextInvoiceNumber = async () => {
    try {
  const response = await fetch(apiUrl('/invoices/next-number'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInvoiceNumber(data.nextInvoiceNumber);
      }
    } catch (err) {
      console.error('Failed to fetch next invoice number:', err);
      // Fallback to default format
      const year = new Date().getFullYear();
      setInvoiceNumber(`INV-${year}-0001`);
    }
  };

  const fetchClients = async () => {
    try {
  const response = await fetch(apiUrl('/clients'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  };

  const handleClientAdded = (newClient: Client | { client: Client; temporaryPassword?: string }) => {
    // Handle both old format (just Client) and new format (with temporaryPassword)
    const client = 'client' in newClient ? newClient.client : newClient;
    setClients([...clients, client]);
    setSelectedClient(client.id);
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      productName: '',
      description: '',
      quantity: 1,
      unitName: 'Stunde(n)',
      unitNetPrice: 0,
      unitGrossPrice: 0,
      taxRate: 20,
      discount: 0,
      netAmount: 0,
      grossAmount: 0,
    };
    setItems([...items, newItem]);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate amounts when quantity, unitNetPrice, taxRate, or discount changes
    if (field === 'quantity' || field === 'unitNetPrice' || field === 'taxRate' || field === 'discount') {
      const item = newItems[index];
      const discountMultiplier = 1 - (item.discount / 100);
      item.netAmount = item.quantity * item.unitNetPrice * discountMultiplier;
      item.unitGrossPrice = item.unitNetPrice * (1 + item.taxRate / 100);
      item.grossAmount = item.netAmount * (1 + item.taxRate / 100);
    }
    
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const moveItem = useCallback((dragIndex: number, hoverIndex: number) => {
    setItems((prevItems) => {
      const newItems = [...prevItems];
      const [removed] = newItems.splice(dragIndex, 1);
      newItems.splice(hoverIndex, 0, removed);
      return newItems;
    });
  }, []);

  const calculateSubtotal = () => {
    const itemsTotal = items.reduce((sum, item) => sum + item.netAmount, 0);
    const discountMultiplier = 1 - (globalDiscount / 100);
    return itemsTotal * discountMultiplier;
  };

  const calculateTax = () => {
    if (isReverseCharge) return 0;
    return calculateSubtotal() * 0.20; // 20% Austrian VAT
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const calculateSubtotalBeforeDiscount = () => {
    return items.reduce((sum, item) => sum + item.netAmount, 0);
  };

  const calculateGlobalDiscountAmount = () => {
    return calculateSubtotalBeforeDiscount() * (globalDiscount / 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Navigate to review page with invoice data
    navigate('/invoices/review', {
      state: {
        clientId: selectedClient,
        client: selectedClientData,
        invoiceNumber,
        invoiceDate,
        dueDate,
        servicePeriodStart: servicePeriodStart || undefined,
        servicePeriodEnd: servicePeriodEnd || undefined,
        items,
        globalDiscount,
        isReverseCharge,
        notes,
        conditions,
        total: calculateTotal(),
      },
    });
  };

  const handleSaveAsDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(apiUrl('/invoices'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientId: selectedClient,
          invoiceNumber,
          issueDate: invoiceDate,
          dueDate,
          servicePeriodStart: servicePeriodStart || undefined,
          servicePeriodEnd: servicePeriodEnd || undefined,
          isReverseCharge,
          notes: `${notes}\n\n${conditions}`,
          status: 'DRAFT',
          globalDiscount,
          items: items.map(item => ({
            productName: item.productName || undefined,
            description: item.description,
            quantity: item.quantity,
            unitName: item.unitName || undefined,
            unitPrice: item.unitNetPrice,
            taxRate: item.taxRate || undefined,
            discount: item.discount || 0,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Fehler beim Speichern der Rechnung');
      }

      const createdInvoice = await response.json();
      
      // Navigate back to invoice list with success message
      navigate('/invoices', {
        state: {
          success: `Rechnung ${createdInvoice.invoiceNumber} wurde als Entwurf gespeichert!`,
        },
      });
    } catch (err: any) {
      setError(err.message || 'Fehler beim Speichern der Rechnung');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const selectedClientData = clients.find(c => c.id === selectedClient);

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Rechnung erstellen
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Neue Rechnung für einen Kunden erstellen
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="rounded-2xl border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-green-800 dark:text-green-400">{success}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Customer Information Card - 1 column */}
          <div className="md:col-span-1 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5 md:p-6">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-4">
              Kundeninformationen
            </h2>

            <div className="space-y-3">
              {/* Customer Select */}
              <div>
                <label htmlFor="customer" className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                  Kunde
                </label>
                <div className="flex gap-2">
                  <select
                    id="customer"
                    value={selectedClient}
                    onChange={(e) => {
                      if (e.target.value === '__ADD_NEW__') {
                        setShowAddClientModal(true);
                        e.target.value = '';
                      } else {
                        setSelectedClient(e.target.value);
                      }
                    }}
                    required
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition"
                  >
                    <option value="">Kunde auswählen</option>
                    <option value="__ADD_NEW__" className="text-blue-600 dark:text-blue-400 font-medium">
                      + Neuen Kunden hinzufügen
                    </option>
                    <option disabled>──────────</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        #{client.clientNumber} - {client.name} {client.email && `(${client.email})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Customer Address Display */}
              {selectedClientData && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                    Adresse
                  </label>
                  <div className="px-3 py-2 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white space-y-0.5">
                    <div className="font-medium">{selectedClientData.name}</div>
                    {selectedClientData.address && (
                      <div className="whitespace-pre-line text-gray-600 dark:text-gray-400">{selectedClientData.address}</div>
                    )}
                    {selectedClientData.countryCode && (
                      <div className="text-gray-600 dark:text-gray-400">{selectedClientData.countryCode}</div>
                    )}
                    {selectedClientData.email && (
                      <div className="text-gray-600 dark:text-gray-400">{selectedClientData.email}</div>
                    )}
                    {selectedClientData.phone && (
                      <div className="text-gray-600 dark:text-gray-400">{selectedClientData.phone}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Invoice Details Card - 2 columns */}
          <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5 md:p-6">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-4">
              Rechnungsdetails
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Invoice Number */}
              <div>
                <label htmlFor="invoiceNumber" className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                  Rechnungsnummer
                </label>
                <input
                  type="text"
                  id="invoiceNumber"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="INV-2025-0001"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition"
                />
                <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                  Wird automatisch generiert
                </p>
              </div>

              {/* Invoice Date */}
              <div>
                <DatePicker
                  id="invoiceDate"
                  label="Rechnungsdatum"
                  defaultDate={new Date(invoiceDate)}
                  onChange={(dates) => {
                    if (dates && dates.length > 0) {
                      const date = dates[0];
                      setInvoiceDate(date.toISOString().split('T')[0]);
                    }
                  }}
                />
              </div>

              {/* Payment Terms */}
              <div>
                <label htmlFor="paymentTerms" className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                  Zahlungsbedingungen
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    id="paymentTerms"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(Number(e.target.value))}
                    min="0"
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition"
                  />
                  <span className="flex items-center px-3 py-2 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-400">
                    Tage
                  </span>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label htmlFor="dueDate" className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                  Fälligkeitsdatum
                </label>
                <input
                  type="date"
                  id="dueDate"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition"
                />
              </div>

              {/* Service Period Range */}
              <div>
                <DatePicker
                  id="servicePeriod"
                  label="Leistungszeitraum"
                  placeholder="Von - Bis auswählen"
                  mode="range"
                  onChange={(dates) => {
                    if (dates && dates.length === 2) {
                      setServicePeriodStart(dates[0].toISOString().split('T')[0]);
                      setServicePeriodEnd(dates[1].toISOString().split('T')[0]);
                    } else if (dates && dates.length === 0) {
                      setServicePeriodStart('');
                      setServicePeriodEnd('');
                    }
                  }}
                />
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                  Hinweis
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={1}
                  placeholder="Gib eine Nachricht für deine Kunden ein."
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition resize-y min-h-[36px]"
                />
              </div>

              {/* Reverse Charge Info - automatically determined */}
              {isReverseCharge && (
                <div className="sm:col-span-2">
                  <div className="px-3 py-2 text-xs border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400">
                    ℹ️ Reverse Charge wird automatisch angewendet (Kunde nicht aus Österreich)
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Products Card */}
        <DndProvider backend={HTML5Backend}>
          <div className="mt-4 md:mt-6 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                Produkte
              </h2>
            </div>

            {/* Items List */}
            <div className="space-y-2">
              {items.map((item, index) => (
                <DraggableInvoiceItem
                  key={item.id}
                  item={item}
                  index={index}
                  updateItem={updateItem}
                  removeItem={removeItem}
                  moveItem={moveItem}
                  formatCurrency={formatCurrency}
                  showProductDiscount={showProductDiscount}
                />
              ))}
            </div>

            {/* Add Item Button */}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={addItem}
                className="px-3 py-1.5 text-sm border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Zeile hinzufügen
              </button>
              <button
                type="button"
                onClick={() => setShowProductDiscount(!showProductDiscount)}
                className={`px-3 py-1.5 text-sm border-2 border-dashed rounded-lg transition flex items-center gap-1.5 ${
                  showProductDiscount
                    ? 'border-blue-500 text-blue-600 dark:border-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400'
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
                {showProductDiscount ? '✓ ' : ''}Zeilenrabatt
              </button>
              <button
                type="button"
                onClick={() => setShowGlobalDiscount(!showGlobalDiscount)}
                className={`px-3 py-1.5 text-sm border-2 border-dashed rounded-lg transition flex items-center gap-1.5 ${
                  showGlobalDiscount
                    ? 'border-blue-500 text-blue-600 dark:border-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400'
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="5" x2="5" y2="19"></line>
                  <circle cx="6.5" cy="6.5" r="2"></circle>
                  <circle cx="17.5" cy="17.5" r="2"></circle>
                </svg>
                {showGlobalDiscount ? '✓ ' : ''}Rabatt auf Gesamtbetrag
              </button>
            </div>

            {/* Totals */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex justify-end">
                <div className="w-full md:w-1/2 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">
                      {showGlobalDiscount ? 'Zwischensumme (nach Produktrabatten)' : 'Zwischensumme ohne USt.'}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white/90">
                      {formatCurrency(showGlobalDiscount ? calculateSubtotalBeforeDiscount() : calculateSubtotal())}
                    </span>
                  </div>
                  {/* Global Discount - Conditionally rendered */}
                  {showGlobalDiscount && (
                    <>
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 dark:text-gray-400">Rabatt auf Gesamtbetrag</span>
                          <input
                            type="number"
                            value={globalDiscount}
                            onChange={(e) => setGlobalDiscount(Number(e.target.value))}
                            placeholder="0"
                            min="0"
                            max="100"
                            step="0.01"
                            className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition text-center"
                          />
                          <span className="text-gray-600 dark:text-gray-400">%</span>
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white/90">-{formatCurrency(calculateGlobalDiscountAmount())}</span>
                      </div>
                      <div className="flex justify-between text-xs pt-1">
                        <span className="text-gray-600 dark:text-gray-400">Zwischensumme ohne USt.</span>
                        <span className="font-medium text-gray-900 dark:text-white/90">{formatCurrency(calculateSubtotal())}</span>
                      </div>
                    </>
                  )}
                  {!isReverseCharge && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">MwSt. 20%</span>
                      <span className="font-medium text-gray-900 dark:text-white/90">{formatCurrency(calculateTax())}</span>
                    </div>
                  )}
                  {isReverseCharge && (
                    <div className="flex justify-between text-[10px] text-blue-600 dark:text-blue-400">
                      <span>Reverse Charge</span>
                      <span>0,00 €</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-200 dark:border-gray-800">
                    <span className="text-gray-900 dark:text-white/90">Gesamt EUR</span>
                    <span className="text-gray-900 dark:text-white/90">{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DndProvider>

        {/* Conditions Card */}
        <div className="mt-4 md:mt-6 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5 md:p-6">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-4">
            Bedingungen
          </h2>
          <textarea
            value={conditions}
            onChange={(e) => setConditions(e.target.value)}
            rows={6}
            placeholder="Gib deine Geschäftsbedingungen, Zahlungsanweisungen oder zusätzliche Anmerkungen ein."
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition resize-none"
          />
        </div>

        {/* Submit Buttons */}
        <div className="mt-4 md:mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => pdfRef.current?.generatePDF()}
            disabled={items.length === 0 || !selectedClient || loading}
            className="px-6 py-2.5 text-sm border border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:border-gray-400 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent transition font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Vorschau
          </button>
          <button
            type="button"
            onClick={handleSaveAsDraft}
            disabled={items.length === 0 || !selectedClient || loading}
            className="px-6 py-2.5 text-sm border border-gray-600 text-gray-700 dark:border-gray-500 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 disabled:border-gray-400 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent transition font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            {loading ? 'Speichern...' : 'Speichern'}
          </button>
          <button
            type="submit"
            disabled={items.length === 0 || !selectedClient || loading}
            className="px-6 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Überprüfen und senden
          </button>
        </div>
      </form>

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={showAddClientModal}
        onClose={() => setShowAddClientModal(false)}
        onClientAdded={handleClientAdded}
      />

      {/* Hidden PDF Preview Component for PDF Generation */}
      {selectedClientData && (
        <InvoicePDFPreview
          ref={pdfRef}
          invoiceNumber={invoiceNumber}
          invoiceDate={invoiceDate}
          dueDate={dueDate}
          servicePeriodStart={servicePeriodStart}
          servicePeriodEnd={servicePeriodEnd}
          client={selectedClientData}
          items={items}
          globalDiscount={globalDiscount}
          isReverseCharge={isReverseCharge}
          notes={notes}
          conditions={conditions}
          user={user || undefined}
        />
      )}
    </div>
  );
}
