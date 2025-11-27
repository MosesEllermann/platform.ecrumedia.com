import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/ui/avatar/Avatar';

const COUNTRIES = [
  { code: 'AT', name: 'Österreich' },
  { code: 'DE', name: 'Deutschland' },
  { code: 'CH', name: 'Schweiz' },
  { code: 'LI', name: 'Liechtenstein' },
  { code: 'IT', name: 'Italien' },
  { code: 'FR', name: 'Frankreich' },
  { code: 'ES', name: 'Spanien' },
  { code: 'PT', name: 'Portugal' },
  { code: 'NL', name: 'Niederlande' },
  { code: 'BE', name: 'Belgien' },
  { code: 'LU', name: 'Luxemburg' },
  { code: 'PL', name: 'Polen' },
  { code: 'CZ', name: 'Tschechien' },
  { code: 'SK', name: 'Slowakei' },
  { code: 'HU', name: 'Ungarn' },
  { code: 'SI', name: 'Slowenien' },
  { code: 'HR', name: 'Kroatien' },
  { code: 'RO', name: 'Rumänien' },
  { code: 'BG', name: 'Bulgarien' },
  { code: 'GR', name: 'Griechenland' },
  { code: 'SE', name: 'Schweden' },
  { code: 'DK', name: 'Dänemark' },
  { code: 'FI', name: 'Finnland' },
  { code: 'NO', name: 'Norwegen' },
  { code: 'IE', name: 'Irland' },
  { code: 'GB', name: 'Vereinigtes Königreich' },
  { code: 'US', name: 'USA' },
  { code: 'CA', name: 'Kanada' },
  { code: 'AU', name: 'Australien' },
  { code: 'NZ', name: 'Neuseeland' },
].sort((a, b) => a.name.localeCompare(b.name));

interface Client {
  id: string;
  clientNumber: number;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  type: 'COMPANY' | 'PRIVATE';
  vatNumber?: string;
  address?: string;
  countryCode: string;
  phone?: string;
  homepage?: string;
  createdAt: string;
  role?: string;
  user?: {
    id: string;
    profileImage?: string | null;
  };
}

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, isAdmin } = useAuth();
  
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    firstName: '',
    lastName: '',
    email: '',
    type: 'COMPANY' as 'COMPANY' | 'PRIVATE',
    vatNumber: '',
    address: '',
    countryCode: '',
    phone: '',
    homepage: '',
    password: '',
    passwordConfirm: '',
    clientNumber: 0,
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate('/clients');
      return;
    }
    fetchClient();
  }, [id, isAdmin, navigate]);

  const fetchClient = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/clients/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Kunde konnte nicht geladen werden');
      }

      const data = await response.json();
      setClient(data);
      
      // Populate form
      setFormData({
        name: data.name || '',
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        type: data.type || 'COMPANY',
        vatNumber: data.vatNumber || '',
        address: data.address || '',
        countryCode: data.countryCode || '',
        phone: data.phone || '',
        homepage: data.homepage || '',
        password: '',
        passwordConfirm: '',
        clientNumber: data.clientNumber || 0,
      });
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Only validate password if user is trying to change it
    if (formData.password || formData.passwordConfirm) {
      // Validate password confirmation
      if (formData.password !== formData.passwordConfirm) {
        setError('Die Passwörter stimmen nicht überein!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Validate password length if provided
      if (formData.password && formData.password.length < 6) {
        setError('Das Passwort muss mindestens 6 Zeichen lang sein!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    // Validate client number
    if (formData.clientNumber < 1) {
      setError('Die Kundennummer muss mindestens 1 sein!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);

    try {
      const updateData: any = {
        name: formData.name,
        firstName: formData.firstName || null,
        lastName: formData.lastName || null,
        email: formData.email,
        type: formData.type,
        countryCode: formData.countryCode,
        clientNumber: parseInt(String(formData.clientNumber), 10), // Ensure it's an integer
        vatNumber: formData.vatNumber || null,
        address: formData.address || null,
        phone: formData.phone || null,
        homepage: formData.homepage || null,
      };

      // Only include password if it's being changed and not empty
      if (formData.password && formData.password.trim() !== '') {
        updateData.password = formData.password;
      }

      console.log('📤 Sending update data:', updateData);

      const response = await fetch(`http://localhost:3000/api/clients/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fehler beim Speichern');
      }

      const updatedClient = await response.json();
      setClient(updatedClient);
      setSuccess('Kundendaten erfolgreich aktualisiert!');
      setFormData({ ...formData, password: '', passwordConfirm: '' }); // Clear password fields
      setIsEditing(false); // Exit edit mode
      
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const handleLoginAsClient = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/auth/login-as-client/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Login als Kunde fehlgeschlagen');
      }

      const { access_token } = await response.json();
      
      // Create a URL with the token as a parameter
      const loginUrl = `${window.location.origin}/?loginToken=${encodeURIComponent(access_token)}`;
      
      // Open in new tab
      window.open(loginUrl, '_blank');
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCancelEdit = () => {
    // Reset form data to original client data
    if (client) {
      setFormData({
        name: client.name || '',
        firstName: client.firstName || '',
        lastName: client.lastName || '',
        email: client.email || '',
        type: client.type || 'COMPANY',
        vatNumber: client.vatNumber || '',
        address: client.address || '',
        countryCode: client.countryCode || '',
        phone: client.phone || '',
        homepage: client.homepage || '',
        password: '',
        passwordConfirm: '',
        clientNumber: client.clientNumber || 0,
      });
    }
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    console.log('🔄 Field changed:', name, '=', value);
    
    // Convert clientNumber to integer
    if (name === 'clientNumber') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-800 dark:text-red-400">Kunde nicht gefunden</p>
        </div>
        <button
          onClick={() => navigate('/clients')}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
        >
          Zurück zur Übersicht
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/clients')}
            className="mb-2 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Zurück zur Kundenübersicht
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Kunde bearbeiten
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Kundennummer: #{client.clientNumber}
          </p>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="rounded-2xl border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 p-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-green-800 dark:text-green-400">{success}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Client Information Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-between pb-5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 flex-shrink-0">
              <Avatar 
                src={client.user?.profileImage}
                name={client.name}
                size="xxlarge"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white/90">
                {client.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {client.type === 'COMPANY' ? 'Firma' : 'Privatkunde'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Registriert am {new Date(client.createdAt).toLocaleDateString('de-DE')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                >
                  <svg
                    className="fill-current"
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                      fill=""
                    />
                  </svg>
                  Bearbeiten
                </button>
                {/* SECURITY: Only show "Als Kunde anmelden" button for admins */}
                {isAdmin && (
                  <button
                    onClick={handleLoginAsClient}
                    className="flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                  >
                    <svg
                      className="fill-current"
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M9 1.5C7.13401 1.5 5.625 3.00901 5.625 4.875C5.625 6.74099 7.13401 8.25 9 8.25C10.866 8.25 12.375 6.74099 12.375 4.875C12.375 3.00901 10.866 1.5 9 1.5ZM7.125 4.875C7.125 3.83747 7.96247 3 9 3C10.0375 3 10.875 3.83747 10.875 4.875C10.875 5.91253 10.0375 6.75 9 6.75C7.96247 6.75 7.125 5.91253 7.125 4.875Z"
                        fill=""
                      />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M9 9.75C6.58579 9.75 4.37868 10.6862 2.75736 12.3074C2.46447 12.6003 2.46447 13.0752 2.75736 13.3681C3.05026 13.661 3.52513 13.661 3.81802 13.3681C5.18934 11.9968 7.01184 11.25 9 11.25C10.9882 11.25 12.8107 11.9968 14.182 13.3681C14.4749 13.661 14.9497 13.661 15.2426 13.3681C15.5355 13.0752 15.5355 12.6003 15.2426 12.3074C13.6213 10.6862 11.4142 9.75 9 9.75Z"
                        fill=""
                      />
                    </svg>
                    Als {client.name} anmelden
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-full border border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Wird gespeichert..." : "Speichern"}
                </button>
              </>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6" autoComplete="off">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kundentyp */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                Kundentyp <span className="text-red-500">*</span>
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                disabled={!isEditing}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="COMPANY">Firma</option>
                <option value="PRIVATE">Privatkunde</option>
              </select>
            </div>

            {/* Kundennummer */}
            <div>
              <label htmlFor="clientNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                Kundennummer <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="clientNumber"
                name="clientNumber"
                value={formData.clientNumber}
                onChange={handleChange}
                required
                min="1"
                disabled={!isEditing}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {/* Vorname */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                Vorname
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {/* Nachname */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                Nachname
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {/* Firmenname / Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                {formData.type === 'COMPANY' ? 'Firmenname' : 'Name'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={!isEditing}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {/* E-Mail */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                E-Mail <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={!isEditing}
                autoComplete="off"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {/* UID Nummer */}
            {formData.type === 'COMPANY' && (
              <div>
                <label htmlFor="vatNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                  UID Nummer
                </label>
                <input
                  type="text"
                  id="vatNumber"
                  name="vatNumber"
                  value={formData.vatNumber}
                  onChange={handleChange}
                  placeholder="ATU12345678"
                  disabled={!isEditing}
                  autoComplete="off"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            )}

            {/* Telefon */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                Telefon
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+43 123 456789"
                disabled={!isEditing}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {/* Land */}
            <div>
              <label htmlFor="countryCode" className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                Land <span className="text-red-500">*</span>
              </label>
              <select
                id="countryCode"
                name="countryCode"
                value={formData.countryCode}
                onChange={handleChange}
                required
                disabled={!isEditing}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="">Land auswählen</option>
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name} ({country.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Homepage */}
            {formData.type === 'COMPANY' && (
              <div>
                <label htmlFor="homepage" className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                  Homepage
                </label>
                <input
                  type="url"
                  id="homepage"
                  name="homepage"
                  value={formData.homepage}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  disabled={!isEditing}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            )}

            {/* Adresse */}
            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                Adresse
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                placeholder="Straße, Hausnummer&#10;PLZ Ort"
                disabled={!isEditing}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition resize-none disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {/* Passwort - nur im Bearbeitungsmodus anzeigen */}
            {isEditing && (
              <>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                    Neues Passwort
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Leer lassen, um Passwort nicht zu ändern"
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Mindestens 6 Zeichen (nur ausfüllen, wenn ändern)
                  </p>
                </div>

                {/* Passwort bestätigen */}
                <div>
                  <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                    Passwort bestätigen
                  </label>
                  <input
                    type="password"
                    id="passwordConfirm"
                    name="passwordConfirm"
                    value={formData.passwordConfirm}
                    onChange={handleChange}
                    placeholder="Passwort erneut eingeben"
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition"
                  />
                  {formData.password && formData.passwordConfirm && (
                    <div className="mt-1 flex items-center gap-1">
                      {formData.password === formData.passwordConfirm ? (
                        <>
                          <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs text-green-600 dark:text-green-400">Passwörter stimmen überein</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs text-red-600 dark:text-red-400">Passwörter stimmen nicht überein</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Action Buttons at bottom - only visible in edit mode */}
          {isEditing && (
            <div className="mt-6 flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-full border border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Wird gespeichert..." : "Speichern"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
