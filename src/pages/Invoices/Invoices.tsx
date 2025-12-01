import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../config/api';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  isReverseCharge: boolean;
  reverseChargeNote?: string;
  paidAt?: string;
  paidAmount?: number;
  pdfUrl?: string;
  notes?: string;
  items: InvoiceItem[];
}

interface InvoiceStats {
  total: number;
  paid: number;
  unpaid: number;
  overdue: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
}

export default function Invoices() {
  const { t } = useTranslation();
  const { token, isAdmin } = useAuth();
  const location = useLocation();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [statusDropdownId, setStatusDropdownId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    // Reload invoices when coming back from creating/editing
    if (location.state) {
      // Clear the state to prevent reloading on page refresh
      window.history.replaceState({}, document.title);
      
      // Reload invoices when coming back
      fetchInvoices();
      fetchStats();
    }
  }, [location]);

  useEffect(() => {
    fetchInvoices();
    fetchStats();
  }, [filter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filter !== 'all') {
        queryParams.append('status', filter.toUpperCase());
      }
      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }

  const response = await fetch(apiUrl(`/invoices?${queryParams.toString()}`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }

      const data = await response.json();
      setInvoices(data);
    } catch (err: any) {
      setError(err.message || t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
  const response = await fetch(apiUrl('/invoices/stats'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleSearch = () => {
    fetchInvoices();
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!isAdmin) return;
    
    try {
  const response = await fetch(apiUrl(`/invoices/${invoiceId}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete invoice');
      }

      setDeleteConfirmId(null);
      fetchInvoices();
      fetchStats();
    } catch (err) {
      setError('Fehler beim Löschen der Rechnung');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleUpdateStatus = async (invoiceId: string, status: string) => {
    if (!isAdmin) return;
    
    try {
  const response = await fetch(apiUrl(`/invoices/${invoiceId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update invoice status');
      }

      setStatusDropdownId(null);
      setDropdownPosition(null);
      fetchInvoices();
      fetchStats();
    } catch (err) {
      setError('Fehler beim Aktualisieren des Status');
      setTimeout(() => setError(''), 3000);
    }
  };

  const statusOptions = [
    { value: 'DRAFT', label: 'Entwurf', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800' },
    { value: 'SENT', label: 'Gesendet', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800' },
    { value: 'PAID', label: 'Bezahlt', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800' },
    { value: 'OVERDUE', label: 'Überfällig', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800' },
    { value: 'CANCELLED', label: 'Storniert', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-800' },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'SENT':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      case 'CANCELLED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PAID':
        return t('invoices.paid');
      case 'SENT':
        return t('invoices.unpaid');
      case 'OVERDUE':
        return t('invoices.overdue');
      case 'DRAFT':
        return t('invoices.draft');
      case 'CANCELLED':
        return t('invoices.cancelled');
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-lg text-gray-600 dark:text-gray-400">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          {t('invoices.title')}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {isAdmin 
            ? 'Administrator-Ansicht: Alle Rechnungen aller Kunden' 
            : 'Verwalten Sie Ihre Rechnungen und Zahlungen'}
        </p>
      </div>

      {/* Admin Info Banner */}
      {isAdmin && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 p-5 md:p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Administrator-Modus
              </h3>
              <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
                Sie sehen alle Rechnungen aller Kunden. Verwenden Sie die Filteroptionen, um nach bestimmten Kunden oder Status zu suchen.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
          {/* Total Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Gesamt
                </span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {stats.total}
                </h4>
              </div>
            </div>
          </div>

          {/* Paid Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t('invoices.paid')}
                </span>
                <h4 className="mt-2 font-bold text-green-600 text-title-sm dark:text-green-400">
                  {stats.paid}
                </h4>
              </div>
            </div>
          </div>

          {/* Unpaid Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t('invoices.unpaid')}
                </span>
                <h4 className="mt-2 font-bold text-blue-600 text-title-sm dark:text-blue-400">
                  {stats.unpaid}
                </h4>
              </div>
            </div>
          </div>

          {/* Overdue Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t('invoices.overdue')}
                </span>
                <h4 className="mt-2 font-bold text-red-600 text-title-sm dark:text-red-400">
                  {stats.overdue}
                </h4>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder={t('common.search') + ' Rechnungsnummer...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="appearance-none px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white cursor-pointer outline-none transition"
              >
                <option value="all">Alle</option>
                <option value="paid">{t('invoices.paid')}</option>
                <option value="sent">Offen</option>
                <option value="overdue">{t('invoices.overdue')}</option>
                <option value="draft">{t('invoices.draft')}</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-400">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M4.79175 7.39551L10.0001 12.6038L15.2084 7.39551" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </div>
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition font-medium"
            >
              {t('common.search')}
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Invoices Table */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('invoices.invoiceNumber')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('invoices.date')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('invoices.dueDate')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('invoices.amount')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('invoices.status')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-white/[0.03] divide-y divide-gray-200 dark:divide-gray-800">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-gray-500 dark:text-gray-400">{t('invoices.noInvoices')}</p>
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white/90">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(invoice.issueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white/90">
                      {formatCurrency(invoice.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative inline-block">
                        <button
                          onClick={(e) => {
                            if (isAdmin) {
                              if (statusDropdownId === invoice.id) {
                                setStatusDropdownId(null);
                                setDropdownPosition(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setDropdownPosition({
                                  top: rect.bottom + window.scrollY + 4,
                                  left: rect.left + window.scrollX
                                });
                                setStatusDropdownId(invoice.id);
                              }
                            }
                          }}
                          disabled={!isAdmin}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${getStatusColor(
                            invoice.status
                          )} ${isAdmin ? 'cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-gray-400 dark:hover:ring-gray-600' : 'cursor-default'}`}
                        >
                          {getStatusText(invoice.status)}
                          {isAdmin && (
                            <svg 
                              className={`w-3 h-3 transition-transform ${statusDropdownId === invoice.id ? 'rotate-180' : ''}`} 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end items-center gap-2">
                        {isAdmin && (
                          <>
                            {invoice.status === 'DRAFT' && (
                              <Link
                                to={`/invoices/edit/${invoice.id}`}
                                className="p-2 text-blue-600 hover:text-white dark:text-blue-400 hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                                title="Rechnung bearbeiten"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </Link>
                            )}
                            {deleteConfirmId === invoice.id ? (
                              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800">
                                <span className="text-xs text-red-800 dark:text-red-300 font-medium whitespace-nowrap">Wirklich löschen?</span>
                                <button
                                  onClick={() => handleDeleteInvoice(invoice.id)}
                                  className="px-3 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 transition font-medium"
                                  title="Löschen bestätigen"
                                >
                                  Ja
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-3 py-1 text-xs bg-gray-500 text-white rounded-md hover:bg-gray-600 transition font-medium"
                                  title="Abbrechen"
                                >
                                  Nein
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(invoice.id)}
                                className="p-2 text-red-600 hover:text-white dark:text-red-400 hover:bg-red-600 dark:hover:bg-red-500 dark:hover:text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                                title="Rechnung löschen"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Dropdown Portal - Rendered outside table to avoid overflow issues */}
      {statusDropdownId && isAdmin && dropdownPosition && (
        <>
          {/* Backdrop to close dropdown when clicking outside */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => {
              setStatusDropdownId(null);
              setDropdownPosition(null);
            }}
          />
          
          {/* Dropdown Menu */}
          <div 
            className="fixed z-50 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-[160px]"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`
            }}
          >
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  const invoice = invoices.find(inv => inv.id === statusDropdownId);
                  if (invoice) {
                    handleUpdateStatus(invoice.id, option.value);
                  }
                }}
                className={`w-full text-left px-3 py-2 transition-colors flex items-center ${
                  invoices.find(inv => inv.id === statusDropdownId)?.status === option.value 
                    ? 'bg-gray-50 dark:bg-gray-800' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${option.color}`}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
