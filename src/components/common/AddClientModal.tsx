import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../config/api';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientAdded: (client: any) => void;
}

interface CountryOption {
  code: string;
  name: string;
  flag: string;
}

const countries: CountryOption[] = [
  { code: 'AT', name: 'Österreich', flag: '🇦🇹' },
  { code: 'DE', name: 'Deutschland', flag: '🇩🇪' },
  { code: 'CH', name: 'Schweiz', flag: '🇨🇭' },
  { code: 'LI', name: 'Liechtenstein', flag: '🇱🇮' },
  { code: 'IT', name: 'Italien', flag: '🇮🇹' },
  { code: 'FR', name: 'Frankreich', flag: '🇫🇷' },
  { code: 'ES', name: 'Spanien', flag: '🇪🇸' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'NL', name: 'Niederlande', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgien', flag: '🇧🇪' },
  { code: 'LU', name: 'Luxemburg', flag: '🇱🇺' },
  { code: 'PL', name: 'Polen', flag: '🇵🇱' },
  { code: 'CZ', name: 'Tschechien', flag: '🇨🇿' },
  { code: 'SK', name: 'Slowakei', flag: '🇸🇰' },
  { code: 'HU', name: 'Ungarn', flag: '🇭🇺' },
  { code: 'SI', name: 'Slowenien', flag: '🇸🇮' },
  { code: 'HR', name: 'Kroatien', flag: '🇭🇷' },
  { code: 'RO', name: 'Rumänien', flag: '🇷🇴' },
  { code: 'BG', name: 'Bulgarien', flag: '🇧🇬' },
  { code: 'GR', name: 'Griechenland', flag: '🇬🇷' },
  { code: 'SE', name: 'Schweden', flag: '🇸🇪' },
  { code: 'DK', name: 'Dänemark', flag: '🇩🇰' },
  { code: 'FI', name: 'Finnland', flag: '🇫🇮' },
  { code: 'NO', name: 'Norwegen', flag: '🇳🇴' },
  { code: 'IE', name: 'Irland', flag: '🇮🇪' },
  { code: 'GB', name: 'Vereinigtes Königreich', flag: '🇬🇧' },
  { code: 'US', name: 'USA', flag: '🇺🇸' },
  { code: 'CA', name: 'Kanada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australien', flag: '🇦🇺' },
  { code: 'NZ', name: 'Neuseeland', flag: '🇳🇿' },
].sort((a, b) => a.name.localeCompare(b.name));

export default function AddClientModal({ isOpen, onClose, onClientAdded }: AddClientModalProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [createdClientName, setCreatedClientName] = useState('');
  const [createdClient, setCreatedClient] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Form state
  const [type, setType] = useState<'COMPANY' | 'PRIVATE'>('COMPANY');
  const [vatNumber, setVatNumber] = useState('');
  const [name, setName] = useState('');
  const [clientNumber, setClientNumber] = useState('');
  const [address, setAddress] = useState('');
  const [countryCode, setCountryCode] = useState('AT');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [homepage, setHomepage] = useState('');
  const [fixedNote, setFixedNote] = useState('');
  const [createUserAccount, setCreateUserAccount] = useState(false);

  // Fetch next client number when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchNextNumber();
      resetForm();
    }
  }, [isOpen]);

  // Disable createUserAccount checkbox if email is empty
  useEffect(() => {
    if (!email && createUserAccount) {
      setCreateUserAccount(false);
    }
  }, [email]);

  const fetchNextNumber = async () => {
    try {
  const response = await fetch(apiUrl('/clients/next-number'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const number = await response.json();
        setClientNumber(number.toString());
      }
    } catch (err) {
      console.error('Failed to fetch next number:', err);
    }
  };

  const resetForm = () => {
    setType('COMPANY');
    setVatNumber('');
    setName('');
    setAddress('');
    setCountryCode('AT');
    setPhone('');
    setEmail('');
    setHomepage('');
    setFixedNote('');
    setCreateUserAccount(false);
    setError('');
    setShowPassword(false);
    setGeneratedPassword('');
    setCreatedClientName('');
    setCreatedClient(null);
    setCopied(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate email if user account creation is requested
    if (createUserAccount && !email) {
      setError('E-Mail-Adresse ist erforderlich, um ein Benutzerkonto zu erstellen');
      return;
    }
    
    setLoading(true);

    try {
  const response = await fetch(apiUrl('/clients'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          name,
          vatNumber: type === 'COMPANY' ? vatNumber : undefined,
          clientNumber: parseInt(clientNumber),
          address: address || undefined,
          countryCode,
          phone: phone || undefined,
          email: email || undefined,
          homepage: homepage || undefined,
          fixedNote: fixedNote || undefined,
          createUserAccount,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Fehler beim Erstellen des Kunden');
      }

      const newClient = await response.json();
      
      // Show temporary password if user account was created
      if (newClient.temporaryPassword) {
        setCreatedClient(newClient.client || newClient);
        setGeneratedPassword(newClient.temporaryPassword);
        setCreatedClientName(newClient.client.name);
        setShowPassword(true);
      } else {
        onClientAdded(newClient.client || newClient);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Fehler beim Erstellen des Kunden');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordModalClose = () => {
    if (createdClient) {
      onClientAdded(createdClient);
    }
    setShowPassword(false);
    setGeneratedPassword('');
    setCreatedClientName('');
    setCreatedClient(null);
    onClose();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  // Password success modal
  if (showPassword) {
    return (
      <div className="fixed inset-0 z-99999 flex items-center justify-center overflow-y-auto">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px]"
          onClick={handlePasswordModalClose}
        />

        {/* Modal */}
        <div className="relative m-4 w-full max-w-[500px] rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
          {/* Success Icon */}
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Header */}
          <div className="mb-6 text-center">
            <h4 className="mb-1.5 text-xl font-semibold text-gray-800 dark:text-white/90">
              Kunde erfolgreich erstellt!
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              User Account für <span className="font-medium text-gray-700 dark:text-gray-300">{createdClientName}</span> wurde angelegt
            </p>
          </div>

          {/* Password Display */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Temporäres Passwort
            </label>
            <div className="flex gap-2">
              <div className="flex-1 rounded-lg border-2 border-blue-500 bg-blue-50 px-4 py-3 font-mono text-base font-semibold text-gray-900 dark:border-blue-600 dark:bg-blue-900/30 dark:text-white">
                {generatedPassword}
              </div>
              <button
                type="button"
                onClick={copyToClipboard}
                className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition ${
                  copied
                    ? 'bg-green-500 dark:bg-green-600'
                    : 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
                }`}
              >
                {copied ? (
                  <>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Kopiert!
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Kopieren
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Warning */}
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
            <div className="flex gap-3">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
                  Wichtig: Passwort sichern!
                </p>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-500">
                  Bitte notieren Sie dieses Passwort jetzt. Es kann später nicht mehr angezeigt werden.
                </p>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={handlePasswordModalClose}
            className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            Fertig
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center overflow-y-auto">
      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative m-4 w-full max-w-[900px] rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-999 flex h-9.5 w-9.5 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white sm:right-6 sm:top-6 sm:h-11 sm:w-11"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M6.04289 16.5413C5.65237 16.9318 5.65237 17.565 6.04289 17.9555C6.43342 18.346 7.06658 18.346 7.45711 17.9555L11.9987 13.4139L16.5408 17.956C16.9313 18.3466 17.5645 18.3466 17.955 17.956C18.3455 17.5655 18.3455 16.9323 17.955 16.5418L13.4129 11.9997L17.955 7.4576C18.3455 7.06707 18.3455 6.43391 17.955 6.04338C17.5645 5.65286 16.9313 5.65286 16.5408 6.04338L11.9987 10.5855L7.45711 6.0439C7.06658 5.65338 6.43342 5.65338 6.04289 6.0439C5.65237 6.43442 5.65237 7.06759 6.04289 7.45811L10.5845 11.9997L6.04289 16.5413Z" fill="currentColor"/>
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6 pr-14">
          <h4 className="mb-1.5 text-xl font-semibold text-gray-800 dark:text-white/90">
            Neuen Kunden erstellen
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Füge einen neuen Kunden hinzu und verwalte dessen Informationen.
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="max-h-[70vh] overflow-y-auto px-0.5 pb-1">
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-2.5 dark:border-red-800 dark:bg-red-900/20">
                <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Type and VAT Section */}
            <div className="grid grid-cols-1 gap-x-4 gap-y-4 lg:grid-cols-2">
              {/* Type */}
              <div className="col-span-2 lg:col-span-1">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Typ <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setType('COMPANY')}
                    className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium transition ${
                      type === 'COMPANY'
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400 dark:border-gray-700 dark:text-gray-400'
                    }`}
                  >
                    Unternehmen
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('PRIVATE')}
                    className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium transition ${
                      type === 'PRIVATE'
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400 dark:border-gray-700 dark:text-gray-400'
                    }`}
                  >
                    Privatperson
                  </button>
                </div>
              </div>

              {/* VAT Number - Only for companies */}
              {type === 'COMPANY' && (
                <div className="col-span-2 lg:col-span-1">
                  <label htmlFor="vatNumber" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    UID
                  </label>
                  <input
                    type="text"
                    id="vatNumber"
                    value={vatNumber}
                    onChange={(e) => setVatNumber(e.target.value)}
                    placeholder="z.B. ATU12345678"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>
              )}
            </div>

            {/* Name and Number */}
            <div className="mt-5">
              <h5 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">
                Grundinformationen
              </h5>
              <div className="grid grid-cols-1 gap-x-4 gap-y-4 lg:grid-cols-2">
                {/* Name */}
                <div className="col-span-2 lg:col-span-1">
                  <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder={type === 'COMPANY' ? 'Firmenname' : 'Vor- und Nachname'}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>

                {/* Client Number */}
                <div className="col-span-2 lg:col-span-1">
                  <label htmlFor="clientNumber" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nr. <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      id="clientNumber"
                      value={clientNumber}
                      onChange={(e) => setClientNumber(e.target.value)}
                      required
                      min="1"
                      className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={fetchNextNumber}
                      title="Nächste freie Nummer laden"
                      className="rounded-lg border border-gray-300 px-2.5 py-2 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                    >
                      <svg className="h-4 w-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Address */}
                <div className="col-span-2 lg:col-span-1">
                  <label htmlFor="address" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Adresse
                  </label>
                  <textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={3}
                    placeholder="Straße, Hausnummer&#10;PLZ Ort"
                    className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>

                {/* Country */}
                <div className="col-span-2 lg:col-span-1">
                  <label htmlFor="country" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Land
                  </label>
                  <select
                    id="country"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    {countries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Phone */}
                <div className="col-span-2 lg:col-span-1">
                  <label htmlFor="phone" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+43 123 456789"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>

                {/* Email */}
                <div className="col-span-2 lg:col-span-1">
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    E-Mail
                  </label>
                  <input
                    type="text"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="kunde@beispiel.at"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                  
                  {/* User Account Checkbox */}
                  <div className="mt-2.5">
                    <label className="flex cursor-pointer items-start gap-2">
                      <input
                        type="checkbox"
                        checked={createUserAccount}
                        onChange={(e) => setCreateUserAccount(e.target.checked)}
                        disabled={!email}
                        className="mt-0.5 h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-500 outline-none transition focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700"
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        User Account erstellen und Zugangsdaten generieren {!email && <span className="text-red-500">(E-Mail erforderlich)</span>}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Homepage */}
                <div className="col-span-2">
                  <label htmlFor="homepage" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Webseite
                  </label>
                  <input
                    type="text"
                    id="homepage"
                    value={homepage}
                    onChange={(e) => setHomepage(e.target.value)}
                    placeholder="https://www.beispiel.at"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>

                {/* Notes */}
                <div className="col-span-2">
                  <label htmlFor="fixedNote" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Notizen
                  </label>
                  <textarea
                    id="fixedNote"
                    value={fixedNote}
                    onChange={(e) => setFixedNote(e.target.value)}
                    rows={3}
                    placeholder="Zusätzliche Anmerkungen zum Kunden..."
                    className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-5 flex items-center justify-end gap-3 border-t border-gray-200 pt-5 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading || !name}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {loading ? 'Wird gespeichert...' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
