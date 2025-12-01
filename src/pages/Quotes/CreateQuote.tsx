import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router';
import AddClientModal from '../../components/common/AddClientModal';
import QuotePDFPreview, { QuotePDFPreviewRef } from '../../components/common/QuotePDFPreview';
import DatePicker from '../../components/form/date-picker';
import { apiUrl } from '../../config/api';

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

interface QuoteItem {
  id: string;
  productName: string;
  description: string;
  quantity: number;
  unitName: string;
  unitPrice: number;
  taxRate: number;
  discount: number; // Discount percentage (0-100)
  netAmount: number;
  total: number;
}

const unitOptions = ['Stunde(n)', 'Tag(e)', 'Stück', 'Pauschal', 'km', 'Monat(e)', 'Jahr(e)'];

export default function CreateQuote() {
  const { token, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const pdfRef = useRef<QuotePDFPreviewRef>(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/quotes');
    }
  }, [isAdmin, navigate]);

  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSuccessExiting, setIsSuccessExiting] = useState(false);
  const [isErrorExiting, setIsErrorExiting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Always use current date for quote date
  const currentDate = new Date().toISOString().split('T')[0];

  const [selectedClient, setSelectedClient] = useState('');
  const [quoteNumber, setQuoteNumber] = useState('');
  const [quoteDate, setQuoteDate] = useState(currentDate);
  const [validUntil, setValidUntil] = useState('');
  const [validityDays, setValidityDays] = useState(30);
  const [servicePeriodStart] = useState('');
  const [servicePeriodEnd] = useState('');
  const [isReverseCharge, setIsReverseCharge] = useState(false);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [showProductDiscount, setShowProductDiscount] = useState(false);
  const [showGlobalDiscount, setShowGlobalDiscount] = useState(false);
  const [conditions, setConditions] = useState(`Dieses Angebot ist gültig bis zum angegebenen Datum.
Bei Auftragserteilung gelten unsere allgemeinen Geschäftsbedingungen.

Mit freundlichen Grüßen
Seth-Moses Ellermann`);

  useEffect(() => {
    // Always set current date on component mount
    setQuoteDate(currentDate);
    fetchClients();
    fetchNextQuoteNumber();
  }, []);

  // Calculate valid until date based on validity days
  useEffect(() => {
    if (quoteDate && validityDays) {
      const date = new Date(quoteDate);
      date.setDate(date.getDate() + validityDays);
      setValidUntil(date.toISOString().split('T')[0]);
    }
  }, [quoteDate, validityDays]);

  // Check if client is reverse charge eligible
  useEffect(() => {
    if (selectedClient) {
      const client = clients.find(c => c.id === selectedClient);
      if (client && client.countryCode !== 'AT' && client.type === 'COMPANY' && client.vatNumber) {
        setIsReverseCharge(true);
        
        // Automatically add reverse charge note if applicable
        const reverseChargeNote = 'Die Umsatzsteuerschuld geht auf den Leistungsempfänger über\n(Reverse Charge System)';
        // Only add if it's not already in the notes
        if (!notes.includes('Reverse Charge') && !notes.includes('Umsatzsteuerschuld')) {
          setNotes(notes ? `${notes}\n\n${reverseChargeNote}` : reverseChargeNote);
        }
      } else {
        setIsReverseCharge(false);
      }
    }
  }, [selectedClient, clients]);

  const fetchClients = async () => {
    try {
      const response = await fetch(apiUrl('/clients'), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const fetchNextQuoteNumber = async () => {
    try {
      const response = await fetch(apiUrl('/quotes/next-number'), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setQuoteNumber(data.nextQuoteNumber);
      }
    } catch (error) {
      console.error('Failed to fetch next quote number:', error);
    }
  };

  const handleClientAdded = (newClient: Client) => {
    setClients([...clients, newClient]);
    setSelectedClient(newClient.id);
    setShowAddClientModal(false);
  };

  const addItem = () => {
    const newItem: QuoteItem = {
      id: Date.now().toString(),
      productName: '',
      description: '',
      quantity: 1,
      unitName: 'Stunde(n)',
      unitPrice: 0,
      taxRate: 20,
      discount: 0,
      netAmount: 0,
      total: 0,
    };
    setItems([...items, newItem]);
  };

  const updateItem = (index: number, field: keyof QuoteItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate amounts when quantity, unitPrice, or discount changes
    if (field === 'quantity' || field === 'unitPrice' || field === 'discount') {
      const item = newItems[index];
      const discountMultiplier = 1 - (item.discount / 100);
      item.netAmount = item.quantity * item.unitPrice * discountMultiplier;
      item.total = item.netAmount;
    }
    
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateSubtotalBeforeDiscount = () => {
    return items.reduce((sum, item) => sum + item.netAmount, 0);
  };

  const calculateGlobalDiscountAmount = () => {
    return calculateSubtotalBeforeDiscount() * (globalDiscount / 100);
  };

  const calculateSubtotal = () => {
    const itemsTotal = items.reduce((sum, item) => sum + item.netAmount, 0);
    const discountMultiplier = 1 - (globalDiscount / 100);
    return itemsTotal * discountMultiplier;
  };

  const calculateTax = () => {
    if (isReverseCharge) return 0;
    return calculateSubtotal() * 0.2;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Navigate to review page with quote data
    navigate('/quotes/review', {
      state: {
        clientId: selectedClient,
        client: selectedClientData,
        quoteNumber,
        quoteDate,
        validUntil,
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

  const handleSaveAsDraft = useCallback(async (e?: React.FormEvent, isAutoSave = false) => {
    if (e) e.preventDefault();
    
    if (!isAutoSave) {
      setError('');
      setSuccess('');
      setLoading(true);
    } else {
      setAutoSaving(true);
    }

    try {
      const response = await fetch(apiUrl('/quotes'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientId: selectedClient,
          quoteNumber,
          issueDate: quoteDate,
          validUntil,
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
            unitPrice: item.unitPrice,
            taxRate: item.taxRate || undefined,
            discount: item.discount || 0,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Fehler beim Speichern des Angebots');
      }

      const createdQuote = await response.json();
      setLastSaved(new Date());
      
      if (!isAutoSave) {
        setSuccess(`Angebot ${createdQuote.quoteNumber} wurde gespeichert!`);
        setIsSuccessExiting(false);
        setTimeout(() => {
          setIsSuccessExiting(true);
          setTimeout(() => {
            // Navigate back to quotes list with success message
            navigate('/quotes', {
              state: {
                success: `Angebot ${createdQuote.quoteNumber} wurde als Entwurf gespeichert!`,
              },
            });
          }, 500);
        }, 3000);
      }
    } catch (err: any) {
      if (!isAutoSave) {
        setError(err.message || 'Fehler beim Speichern des Angebots');
        setIsErrorExiting(false);
        setTimeout(() => {
          setIsErrorExiting(true);
          setTimeout(() => setError(''), 500);
        }, 4500);
      }
    } finally {
      if (!isAutoSave) {
        setLoading(false);
      } else {
        setAutoSaving(false);
      }
    }
  }, [token, selectedClient, quoteNumber, quoteDate, validUntil, servicePeriodStart, servicePeriodEnd, isReverseCharge, notes, conditions, globalDiscount, items, navigate]);

  // Auto-save effect (every 15 seconds)
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (items.length > 0 && selectedClient) {
        handleSaveAsDraft(undefined, true);
      }
    }, 15000); // 15 seconds

    return () => clearInterval(autoSaveInterval);
  }, [items, selectedClient, handleSaveAsDraft]);

  const selectedClientData = clients.find(c => c.id === selectedClient);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Angebot erstellen
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Neues Angebot für einen Kunden erstellen
          </p>
        </div>
        {lastSaved && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Zuletzt gespeichert: {lastSaved.toLocaleTimeString('de-DE')}
            {autoSaving && <span className="ml-2 text-blue-600 dark:text-blue-400">Speichern...</span>}
          </div>
        )}
      </div>

      {/* Success Message - Modern Animated Toast */}
      {success && (
        <div 
          className="fixed top-24 right-6 z-[9999] max-w-md transition-all duration-500 ease-out"
          style={{
            animation: isSuccessExiting ? 'slideOutToRight 0.5s ease-in forwards' : 'slideInFromRight 0.5s ease-out',
          }}
        >
          <div className="rounded-2xl border border-green-200 bg-white dark:border-green-800 dark:bg-white/[0.03] shadow-sm overflow-hidden backdrop-blur-sm">
            <div className="flex items-center gap-4 p-4">
              <div className="flex-shrink-0">
                <div className="w-7 h-7 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center shadow-sm">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white/90 leading-tight">{success}</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-1 bg-green-100 dark:bg-green-900/30">
              <div 
                className="h-full bg-green-500 dark:bg-green-600"
                style={{
                  animation: 'grow 3s linear forwards',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error Message - Modern Animated Toast */}
      {error && (
        <div 
          className="fixed top-24 right-6 z-[9999] max-w-md transition-all duration-500 ease-out"
          style={{
            animation: isErrorExiting ? 'slideOutToRight 0.5s ease-in forwards' : 'slideInFromRight 0.5s ease-out',
          }}
        >
          <div className="rounded-2xl border border-red-200 bg-white dark:border-red-800 dark:bg-white/[0.03] shadow-sm overflow-hidden backdrop-blur-sm">
            <div className="flex items-center gap-4 p-4">
              <div className="flex-shrink-0">
                <div className="w-7 h-7 rounded-full bg-red-500 dark:bg-red-600 flex items-center justify-center shadow-sm">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white/90 leading-tight">{error}</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-1 bg-red-100 dark:bg-red-900/30">
              <div 
                className="h-full bg-red-500 dark:bg-red-600"
                style={{
                  animation: 'grow 3s linear forwards',
                }}
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideOutToRight {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(100px);
          }
        }
        
        @keyframes grow {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Customer Information Card */}
          <div className="md:col-span-1 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5 md:p-6">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-4">
              Kundeninformationen
            </h2>

            <div className="space-y-3">
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
                    <option value="">Kunde auswählen...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.clientNumber} - {client.name}
                      </option>
                    ))}
                    <option value="__ADD_NEW__">+ Neuen Kunden anlegen</option>
                  </select>
                </div>
              </div>

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
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quote Details Card */}
          <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5 md:p-6">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-4">
              Angebotsdetails
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="quoteNumber" className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                  Angebotsnummer
                </label>
                <input
                  type="text"
                  id="quoteNumber"
                  value={quoteNumber}
                  onChange={(e) => setQuoteNumber(e.target.value)}
                  placeholder="QUO-2025-0001"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition"
                />
              </div>

              <div>
                <DatePicker
                  id="quoteDate"
                  label="Angebotsdatum"
                  defaultDate={new Date(quoteDate)}
                  onChange={(dates) => {
                    if (dates && dates.length > 0) {
                      setQuoteDate(dates[0].toISOString().split('T')[0]);
                    }
                  }}
                />
              </div>

              <div>
                <label htmlFor="validityDays" className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                  Gültigkeitsdauer
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    id="validityDays"
                    value={validityDays}
                    onChange={(e) => setValidityDays(Number(e.target.value))}
                    min="1"
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition"
                  />
                  <span className="flex items-center px-3 py-2 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-400">
                    Tage
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="validUntil" className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                  Gültig bis
                </label>
                <input
                  type="date"
                  id="validUntil"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="notes" className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                  Notizen (optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Zusätzliche Informationen zum Angebot"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition resize-y"
                />
              </div>

              {isReverseCharge && (
                <div className="sm:col-span-2">
                  <div className="px-3 py-2 text-xs border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400">
                    ℹ️ Reverse Charge wird automatisch angewendet
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Products Card */}
        <div className="mt-4 md:mt-6 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5 md:p-6">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-4">
            Produkte / Leistungen
          </h2>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id}>
                {/* Main row with all fields */}
                <div className="flex flex-col gap-3">
                  {/* First row: All fields in one line */}
                  <div className="flex gap-2 items-end flex-wrap lg:flex-nowrap">
                    {/* Product Name - 50% on large screens */}
                    <div className="flex-1 min-w-[200px]" style={{ minWidth: '0' }}>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                        Produkt
                      </label>
                      <input
                        type="text"
                        value={item.productName}
                        onChange={(e) => updateItem(index, 'productName', e.target.value)}
                        placeholder="Produktname"
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition overflow-hidden text-ellipsis"
                        style={{ minWidth: '0' }}
                      />
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

                    {/* Price */}
                    <div className="flex-shrink-0 w-[140px]">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                        Preis (netto)
                      </label>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value))}
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
                        <option value={0}>0 %</option>
                        <option value={10}>10 %</option>
                        <option value={13}>13 %</option>
                        <option value={20}>20 %</option>
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

                    {/* Total Amount */}
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

                  {/* Second row: Description - 2/3 width for quotes */}
                  <div className="w-full lg:w-2/3">
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
                {index < items.length - 1 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 mt-3"></div>
                )}
              </div>
            ))}
          </div>

          {/* Add Item Button and Discount Toggles */}
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
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">MwSt.</span>
                    <span className="font-medium text-gray-900 dark:text-white/90">Reverse Charge</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-gray-200 dark:border-gray-800">
                  <span className="text-gray-900 dark:text-white/90">Gesamt EUR</span>
                  <span className="text-gray-900 dark:text-white/90">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conditions Card */}
        <div className="mt-4 md:mt-6 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5 md:p-6">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-4">
            Bedingungen
          </h2>
          <textarea
            value={conditions}
            onChange={(e) => setConditions(e.target.value)}
            rows={6}
            placeholder="Geschäftsbedingungen und zusätzliche Informationen"
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

      <AddClientModal
        isOpen={showAddClientModal}
        onClose={() => setShowAddClientModal(false)}
        onClientAdded={handleClientAdded}
      />

      {/* Hidden PDF Preview Component for PDF Generation */}
      {selectedClientData && (
        <QuotePDFPreview
          ref={pdfRef}
          quoteNumber={quoteNumber}
          quoteDate={quoteDate}
          validUntil={validUntil}
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
