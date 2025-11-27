import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import QuotePDFPreview, { QuotePDFPreviewRef } from '../../components/common/QuotePDFPreview';

interface QuoteItem {
  productName: string;
  description: string;
  quantity: number;
  unitName: string;
  unitPrice: number;
  taxRate: number;
  discount: number;
  netAmount: number;
}

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
}

interface QuoteData {
  clientId: string;
  client: Client;
  quoteNumber: string;
  quoteDate: string;
  validUntil: string;
  servicePeriodStart?: string;
  servicePeriodEnd?: string;
  items: QuoteItem[];
  globalDiscount: number;
  isReverseCharge: boolean;
  notes: string;
  conditions: string;
  total: number;
}

const generateQuoteEmailTemplate = ({
  quoteNumber,
  servicePeriodStart,
  servicePeriodEnd,
  total,
  isReverseCharge,
}: {
  quoteNumber: string;
  servicePeriodStart?: string;
  servicePeriodEnd?: string;
  total: number;
  isReverseCharge: boolean;
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatServicePeriod = () => {
    if (!servicePeriodStart || !servicePeriodEnd) {
      return '';
    }
    
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return `${formatDate(servicePeriodStart)} - ${formatDate(servicePeriodEnd)}`;
  };

  const servicePeriod = formatServicePeriod();
  const amount = formatCurrency(total);

  if (isReverseCharge) {
    return {
      subject: `Angebot ${quoteNumber}${servicePeriod ? ` - ${servicePeriod}` : ''}`,
      body: `Guten Tag,

Im Anhang dieser Mail sende ich das Angebot Nr. ${quoteNumber}${servicePeriod ? ` für den Zeitraum ${servicePeriod}` : ''} in Höhe von ${amount} ohne Ust.
(Reverse Charge System).

Bei Fragen zum Angebot oder bei Interesse an einer Beauftragung stehe ich jederzeit zur Verfügung.

Mit freundlichen Grüßen,
Seth-Moses Ellermann`,
    };
  }

  return {
    subject: `Angebot ${quoteNumber}${servicePeriod ? ` - ${servicePeriod}` : ''}`,
    body: `Guten Tag,

Im Anhang dieser Mail sende ich das Angebot Nr. ${quoteNumber}${servicePeriod ? ` für den Zeitraum ${servicePeriod}` : ''} in Höhe von ${amount}.

Bei Fragen zum Angebot oder bei Interesse an einer Beauftragung stehe ich jederzeit zur Verfügung.

Mit freundlichen Grüßen,
Seth-Moses Ellermann`,
  };
};

export default function ReviewAndSendQuote() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pdfRef = useRef<QuotePDFPreviewRef>(null);

  const quoteData = location.state as QuoteData | null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [sendCopyToSelf, setSendCopyToSelf] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');

  useEffect(() => {
    if (!quoteData) {
      navigate('/quotes/create');
      return;
    }

    // Set recipient email
    if (quoteData.client.email) {
      setRecipientEmail(quoteData.client.email);
    }

    // Generate email template
    const template = generateQuoteEmailTemplate({
      quoteNumber: quoteData.quoteNumber,
      servicePeriodStart: quoteData.servicePeriodStart,
      servicePeriodEnd: quoteData.servicePeriodEnd,
      total: quoteData.total,
      isReverseCharge: quoteData.isReverseCharge,
    });

    setEmailSubject(template.subject);
    setEmailBody(template.body);
  }, [quoteData, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (sendEmail && !recipientEmail) {
      setError('Bitte geben Sie eine E-Mail-Adresse für den Empfänger ein.');
      return;
    }

    setLoading(true);

    try {
      // Create the quote in the database
      const createResponse = await fetch('http://localhost:3001/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientId: quoteData!.clientId,
          quoteNumber: quoteData!.quoteNumber,
          issueDate: quoteData!.quoteDate,
          validUntil: quoteData!.validUntil,
          servicePeriodStart: quoteData!.servicePeriodStart || undefined,
          servicePeriodEnd: quoteData!.servicePeriodEnd || undefined,
          isReverseCharge: quoteData!.isReverseCharge,
          notes: `${quoteData!.notes}\n\n${quoteData!.conditions}`,
          status: 'DRAFT', // Always create as DRAFT first
          items: quoteData!.items.map(item => ({
            productName: item.productName || undefined,
            description: item.description,
            quantity: item.quantity,
            unitName: item.unitName || undefined,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate || undefined,
          })),
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Fehler beim Erstellen des Angebots');
      }

      const createdQuote = await createResponse.json();

      // If email should be sent, call the send endpoint
      if (sendEmail) {
        try {
          const sendResponse = await fetch(`http://localhost:3001/api/quotes/${createdQuote.id}/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              recipientEmail,
              subject: emailSubject,
              body: emailBody,
              sendCopyToSelf,
            }),
          });

          if (!sendResponse.ok) {
            const errorData = await sendResponse.json().catch(() => ({}));
            throw new Error(errorData.message || 'E-Mail konnte nicht gesendet werden');
          }
        } catch (emailError: any) {
          // Email failed but quote was created
          setError(`Angebot ${createdQuote.quoteNumber} wurde erstellt, aber Email konnte nicht gesendet werden: ${emailError.message}`);
          setLoading(false);
          return;
        }
      }

      // Success - navigate back to quote list
      navigate('/quotes', {
        state: {
          success: sendEmail
            ? `Angebot ${createdQuote.quoteNumber} wurde erfolgreich erstellt und versendet!`
            : `Angebot ${createdQuote.quoteNumber} wurde erfolgreich erstellt!`,
        },
      });
    } catch (err: any) {
      setError(err.message || 'Fehler beim Verarbeiten des Angebots');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/quotes/create', { state: quoteData });
  };

  if (!quoteData) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-800 dark:text-white/90">
          Angebot überprüfen und senden
        </h1>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          Überprüfen Sie das Angebot und senden Sie es an den Kunden
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-3">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
              {error.includes('Email konnte nicht gesendet werden') && (
                <p className="text-xs text-red-700 dark:text-red-500 mt-2">
                  💡 Tipp: Stelle sicher, dass die SMTP-Konfiguration in der Backend .env Datei korrekt ist.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side - PDF Preview */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            PDF Vorschau
          </h2>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex flex-col items-center justify-center space-y-4">
              <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Angebot {quoteData.quoteNumber}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {quoteData.client.name}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => pdfRef.current?.generatePDF()}
                  className="px-4 py-2 text-sm border border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  PDF Vorschau anzeigen
                </button>
                <button
                  type="button"
                  onClick={() => pdfRef.current?.downloadPDF()}
                  className="px-4 py-2 text-sm border border-green-600 text-green-600 dark:border-green-500 dark:text-green-500 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  PDF herunterladen
                </button>
              </div>
            </div>
          </div>

          {/* Quote Details Summary */}
          <div className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Angebotsnummer:</span>
              <span className="font-medium text-gray-900 dark:text-white">{quoteData.quoteNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Kunde:</span>
              <span className="font-medium text-gray-900 dark:text-white">{quoteData.client.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Datum:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {new Date(quoteData.quoteDate).toLocaleDateString('de-DE')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Gültig bis:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {new Date(quoteData.validUntil).toLocaleDateString('de-DE')}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Gesamtbetrag:</span>
              <span className="font-bold text-lg text-gray-900 dark:text-white">
                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(quoteData.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side - Email Form */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            E-Mail Optionen
          </h2>

          <div className="space-y-4">
            {/* Send Email Checkbox */}
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <input
                type="checkbox"
                id="sendEmail"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2"
              />
              <label htmlFor="sendEmail" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                E-Mail an Kunden senden
              </label>
            </div>

            {sendEmail && (
              <>
                {/* Recipient Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    An <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    required={sendEmail}
                    readOnly
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 outline-none cursor-not-allowed"
                  />
                  {!quoteData.client.email && (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                      ⚠️ Dieser Kunde hat keine E-Mail-Adresse hinterlegt
                    </p>
                  )}
                </div>

                {/* Email Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Betreff <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    required={sendEmail}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition"
                  />
                </div>

                {/* Email Body */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Nachricht <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    required={sendEmail}
                    rows={12}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition resize-none font-mono"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Das Angebot wird als PDF-Anhang beigefügt
                  </p>
                </div>

                {/* Send Copy to Self */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="sendCopyToSelf"
                    checked={sendCopyToSelf}
                    onChange={(e) => setSendCopyToSelf(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2"
                  />
                  <label htmlFor="sendCopyToSelf" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                    Kopie an mich senden ({user?.email})
                  </label>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons - Full Width at Bottom */}
        <div className="lg:col-span-2 flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleGoBack}
            disabled={loading}
            className="px-6 py-2.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Zurück
          </button>
          <button
            type="submit"
            disabled={loading || (sendEmail && !recipientEmail)}
            className="px-6 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Wird verarbeitet...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                {sendEmail ? 'Senden' : 'Speichern'}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Hidden PDF Preview Component for PDF Generation */}
      <QuotePDFPreview
        ref={pdfRef}
        quoteNumber={quoteData.quoteNumber}
        quoteDate={quoteData.quoteDate}
        validUntil={quoteData.validUntil}
        servicePeriodStart={quoteData.servicePeriodStart}
        servicePeriodEnd={quoteData.servicePeriodEnd}
        client={quoteData.client}
        items={quoteData.items}
        globalDiscount={quoteData.globalDiscount}
        isReverseCharge={quoteData.isReverseCharge}
        notes={quoteData.notes}
        conditions={quoteData.conditions}
        user={user || undefined}
      />
    </div>
  );
}
