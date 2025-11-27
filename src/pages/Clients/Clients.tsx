import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router';
import Avatar from '../../components/ui/avatar/Avatar';

interface Client {
  id: string;
  clientNumber: number;
  name: string;
  email: string;
  type: 'COMPANY' | 'PRIVATE';
  vatNumber?: string;
  address?: string;
  countryCode: string;
  phone?: string;
  homepage?: string;
  createdAt: string;
  user?: {
    role: string;
    profileImage?: string | null;
  };
}

export default function Clients() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/clients', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Fehler beim Laden der Kunden');
      }

      const data = await response.json();
      // Filter out admins - nur Clients anzeigen
      const filteredClients = data.filter((client: Client) => client.user?.role !== 'ADMIN');
      setClients(filteredClients);
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.clientNumber.toString().includes(searchTerm)
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getClientTypeBadge = (type: 'COMPANY' | 'PRIVATE') => {
    if (type === 'COMPANY') {
      return (
        <span className="inline-flex rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-xs font-medium text-blue-800 dark:text-blue-300">
          Firma
        </span>
      );
    }
    return (
      <span className="inline-flex rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-medium text-gray-800 dark:text-gray-300">
        Privat
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Kundenverwaltung
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Übersicht aller registrierten Kunden (ohne Administratoren)
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
        {/* Total Clients Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Gesamt Kunden
              </span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                {clients.length}
              </h4>
            </div>
          </div>
        </div>

        {/* Companies Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Firmen
              </span>
              <h4 className="mt-2 font-bold text-blue-600 text-title-sm dark:text-blue-400">
                {clients.filter(c => c.type === 'COMPANY').length}
              </h4>
            </div>
          </div>
        </div>

        {/* Private Clients Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Privatkunden
              </span>
              <h4 className="mt-2 font-bold text-gray-600 text-title-sm dark:text-gray-400">
                {clients.filter(c => c.type === 'PRIVATE').length}
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Suche nach Name, E-Mail oder Kundennummer..."
            className="w-full px-4 py-2.5 pl-10 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Clients Table */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Kundennummer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Typ
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  E-Mail
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Telefon
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Land
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Registriert am
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-white/[0.03] divide-y divide-gray-200 dark:divide-gray-800">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      {searchTerm ? 'Keine Kunden gefunden, die Ihrer Suche entsprechen.' : 'Noch keine Kunden vorhanden.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr 
                    key={client.id} 
                    onClick={() => navigate(`/clients/${client.id}`)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition cursor-pointer"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white/90">
                      #{client.clientNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white/90">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <Avatar 
                            src={client.user?.profileImage}
                            name={client.name}
                            size="medium"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="font-medium">{client.name}</div>
                          {client.vatNumber && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              UID: {client.vatNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      {getClientTypeBadge(client.type)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white/90">
                      <a href={`mailto:${client.email}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                        {client.email}
                      </a>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white/90">
                      {client.phone || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white/90">
                      {client.countryCode}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(client.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      {filteredClients.length > 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {filteredClients.length} {filteredClients.length === 1 ? 'Kunde' : 'Kunden'} gefunden
        </div>
      )}
    </div>
  );
}
