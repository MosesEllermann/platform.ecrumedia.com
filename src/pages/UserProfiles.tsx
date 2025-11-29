import { useState, useEffect, FormEvent } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import { useAuth } from "../context/AuthContext";
import { apiUrl } from "../config/api";

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

export default function UserProfiles() {
  const { user, token, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    // User fields
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    countryCode: "",
    profileImage: "",
    
    // Client fields
    type: "COMPANY" as "COMPANY" | "PRIVATE",
    name: "", // Company name
    vatNumber: "",
    homepage: "",
    
    // Password fields
    newPassword: "",
    newPasswordConfirm: "",
  });

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      console.log('👤 User data loaded:', {
        userId: user.id,
        email: user.email,
        role: user.role,
        hasClient: !!user.client,
        clientId: user.client?.id,
        clientName: user.client?.name,
        userCompany: user.company,
      });
      
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        countryCode: user.country || "AT",
        profileImage: user.profileImage || "",
        // For CLIENT: use client data, for ADMIN: use user data
        type: user.client?.type || "COMPANY",
        name: user.role === 'CLIENT' ? (user.client?.name || "") : (user.company || ""),
        vatNumber: user.role === 'CLIENT' ? (user.client?.vatNumber || "") : (user.vatNumber || ""),
        homepage: user.role === 'CLIENT' ? (user.client?.homepage || "") : (user.homepage || ""),
        newPassword: "",
        newPasswordConfirm: "",
      });
      setProfileImagePreview(user.profileImage || null);
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    console.log('📝 Input changed:', { field: name, value });
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear messages when user starts typing
    setError(null);
    setSuccess(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError("Bild ist zu groß. Maximale Größe: 2MB");
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setError("Bitte wählen Sie eine Bilddatei");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({ ...prev, profileImage: base64String }));
        setProfileImagePreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, profileImage: "" }));
    setProfileImagePreview(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Validation
    if (!formData.type) {
      setError("Kundentyp ist erforderlich");
      setIsLoading(false);
      return;
    }

    if (!formData.name) {
      setError("Firmenname ist erforderlich");
      setIsLoading(false);
      return;
    }

    if (!formData.email) {
      setError("E-Mail ist erforderlich");
      setIsLoading(false);
      return;
    }

    if (!formData.address) {
      setError("Adresse ist erforderlich");
      setIsLoading(false);
      return;
    }

    if (!formData.countryCode) {
      setError("Land ist erforderlich");
      setIsLoading(false);
      return;
    }

    // Password validation
    if (formData.newPassword || formData.newPasswordConfirm) {
      if (formData.newPassword !== formData.newPasswordConfirm) {
        setError("Passwörter stimmen nicht überein");
        setIsLoading(false);
        return;
      }
      if (formData.newPassword.length < 6) {
        setError("Passwort muss mindestens 6 Zeichen lang sein");
        setIsLoading(false);
        return;
      }
    }

    try {
      // Prepare data to send - exclude empty password fields
      const dataToSend: any = { ...formData };
      if (!dataToSend.newPassword || dataToSend.newPassword.trim() === '') {
        delete dataToSend.newPassword;
        delete dataToSend.newPasswordConfirm;
      }

      console.log('📤 Sending profile update:', dataToSend);

  const response = await fetch(apiUrl('/auth/profile'), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Fehler beim Aktualisieren des Profils");
      }

      console.log('✅ Profile update response received');

      // Refresh user data and wait for it to complete
      await refreshUser();
      
      console.log('✅ User data refreshed');

      // Show success message
      setSuccess("Profil erfolgreich aktualisiert");
      
      // Exit edit mode after user data is refreshed
      setIsEditing(false);

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || "Ein Fehler ist aufgetreten");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form data to original user data
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        countryCode: user.country || "AT",
        profileImage: user.profileImage || "",
        type: user.client?.type || "COMPANY",
        name: user.client?.name || "",
        vatNumber: user.client?.vatNumber || "",
        homepage: user.client?.homepage || "",
        newPassword: "",
        newPasswordConfirm: "",
      });
      setProfileImagePreview(user.profileImage || null);
    }
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  return (
    <>
      <PageMeta
        title="Profil | ECRU Media Platform"
        description="Verwalten Sie Ihre Profildaten"
      />
      <PageBreadcrumb pageTitle="Profil" />
      
      {error && (
        <div className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-5 rounded-lg bg-green-50 p-4 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
          {success}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        {/* Header with Profile Image, Name and Action Button */}
        <div className="mb-6 flex items-center justify-between pb-5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 flex-shrink-0">
              {profileImagePreview ? (
                <img
                  src={profileImagePreview}
                  alt="Profilbild"
                  className="h-16 w-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-2xl">
                    {user?.role === 'CLIENT'
                      ? (formData.name?.charAt(0)?.toUpperCase() || user?.client?.name?.charAt(0)?.toUpperCase() || 'C')
                      : (formData.name?.charAt(0)?.toUpperCase() || user?.company?.charAt(0)?.toUpperCase() || user?.firstName?.charAt(0)?.toUpperCase() || 'A')
                    }
                  </span>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white/90">
                {user?.role === 'CLIENT' 
                  ? (formData.name || user?.client?.name || "Mein Profil")
                  : (formData.name || user?.company || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || "Admin-Profil")
                }
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.role === 'CLIENT' 
                  ? (formData.type === 'COMPANY' ? 'Firma' : 'Privatkunde')
                  : 'Administrator'
                }
              </p>
              {user?.role === 'CLIENT' && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Kundennummer: {user?.client?.clientNumber || "Wird automatisch vergeben"}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!isEditing ? (
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
                  disabled={isLoading}
                  onClick={handleSubmit}
                  className="flex items-center justify-center gap-2 rounded-full border border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Wird gespeichert..." : "Speichern"}
                </button>
              </>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off">
          {/* Disable browser autofill */}
          <input type="text" name="fakeusernameremembered" style={{ display: 'none' }} />
          <input type="password" name="fakepasswordremembered" style={{ display: 'none' }} />

          <div className="space-y-6">
            {/* Profile Image Section - only visible when editing */}
            {isEditing && (
              <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
                <h4 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
                  Profilbild
                </h4>
                <div className="flex flex-col items-center gap-4 sm:flex-row">
                  <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-gray-200 dark:border-gray-700">
                    {profileImagePreview ? (
                      <img
                        src={profileImagePreview}
                        alt="Profilbild"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-800">
                        <svg
                          className="h-12 w-12 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="profileImageInput"
                      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Bild auswählen
                    </label>
                    <input
                      id="profileImageInput"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    {profileImagePreview && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-600 shadow-theme-xs hover:bg-red-50 dark:border-red-700 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Bild entfernen
                      </button>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      JPG, PNG oder GIF. Maximale Größe: 2MB
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Company Information Section - For all users (Admin company data or Client company data) */}
            <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
              <h4 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
                {user?.role === 'ADMIN' ? 'Firmendaten (für Rechnungen)' : 'Kundeninformationen'}
              </h4>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* Client Type - Only for CLIENT users */}
                {user?.role === 'CLIENT' && (
                  <div>
                    <Label htmlFor="type">
                      Kundentyp <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      autoComplete="off"
                      disabled={!isEditing}
                      required
                    >
                      <option value="COMPANY">Unternehmen</option>
                      <option value="PRIVATE">Privatperson</option>
                    </select>
                  </div>
                )}

                {/* Client Number - Only for CLIENT users */}
                {user?.role === 'CLIENT' && (
                  <div>
                    <Label htmlFor="clientNumber">Kundennummer</Label>
                    <Input
                      id="clientNumber"
                      type="text"
                      value={user?.client?.clientNumber || "Wird automatisch vergeben"}
                      disabled
                      className="bg-gray-50 dark:bg-gray-900"
                    />
                  </div>
                )}

                {/* Company/Firm Name - For all users */}
                <div className={(user?.role === 'CLIENT' && formData.type === 'COMPANY') ? 'lg:col-span-2' : ''}>
                  <Label htmlFor="name">
                    {user?.role === 'ADMIN' 
                      ? 'Firmenname' 
                      : (formData.type === 'COMPANY' ? 'Firmenname' : 'Name')
                    } <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    autoComplete="off"
                    disabled={!isEditing}
                    required
                  />
                </div>

                {/* UID and Homepage - Always show for ADMIN, conditional for CLIENT */}
                {(user?.role === 'ADMIN' || formData.type === 'COMPANY') ? (
                  <>
                    <div>
                      <Label htmlFor="vatNumber">UID Nummer</Label>
                      <Input
                        id="vatNumber"
                        name="vatNumber"
                        type="text"
                        value={formData.vatNumber}
                        onChange={handleInputChange}
                        autoComplete="off"
                        disabled={!isEditing}
                        placeholder="ATU12345678"
                      />
                    </div>

                    <div>
                      <Label htmlFor="homepage">Homepage</Label>
                      <Input
                        id="homepage"
                        name="homepage"
                        type="url"
                        value={formData.homepage}
                        onChange={handleInputChange}
                        autoComplete="off"
                        disabled={!isEditing}
                        placeholder="https://beispiel.at"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <Label htmlFor="homepage">Homepage</Label>
                    <Input
                      id="homepage"
                      name="homepage"
                      type="url"
                      value={formData.homepage}
                      onChange={handleInputChange}
                      autoComplete="off"
                      disabled={!isEditing}
                      placeholder="https://beispiel.at"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Personal Information Section */}
            <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
              <h4 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
                Persönliche Daten
              </h4>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div>
                  <Label htmlFor="firstName">Vorname</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    autoComplete="off"
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label htmlFor="lastName">Nachname</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    autoComplete="off"
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label htmlFor="email">
                    E-Mail <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    autoComplete="off"
                    disabled={!isEditing}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    autoComplete="off"
                    disabled={!isEditing}
                    placeholder="+43 123 456789"
                  />
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
              <h4 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
                Adresse
              </h4>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div>
                  <Label htmlFor="address">
                    Adresse <span className="text-red-500">*</span>
                  </Label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    autoComplete="off"
                    placeholder="Straße, Hausnummer&#10;PLZ Ort"
                    rows={3}
                    required
                    disabled={!isEditing}
                    className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <Label htmlFor="countryCode">
                    Land <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="countryCode"
                    name="countryCode"
                    value={formData.countryCode}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-60 disabled:cursor-not-allowed"
                    autoComplete="off"
                    disabled={!isEditing}
                    required
                  >
                    <option value="">Land auswählen</option>
                    {COUNTRIES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name} ({country.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Password Change Section - only visible in edit mode */}
            {isEditing && (
              <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
                <h4 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
                  Passwort ändern
                </h4>
                <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                  Leer lassen, um Passwort nicht zu ändern
                </p>
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <div>
                    <Label htmlFor="newPassword">
                      Neues Passwort
                    </Label>
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      autoComplete="new-password"
                      placeholder="Mindestens 6 Zeichen"
                    />
                  </div>

                  <div>
                    <Label htmlFor="newPasswordConfirm">
                      Passwort wiederholen
                    </Label>
                    <Input
                      id="newPasswordConfirm"
                      name="newPasswordConfirm"
                      type="password"
                      value={formData.newPasswordConfirm}
                      onChange={handleInputChange}
                      autoComplete="new-password"
                      placeholder="Passwort bestätigen"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit/Cancel Buttons at bottom - only visible in edit mode */}
          {isEditing && (
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center justify-center gap-2 rounded-full border border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Wird gespeichert..." : "Speichern"}
              </button>
            </div>
          )}
        </form>
      </div>
    </>
  );
}
