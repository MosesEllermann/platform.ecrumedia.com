import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";

export default function SignUpForm() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    company: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError(t("auth.passwordsDoNotMatch"));
      setLoading(false);
      return;
    }

    try {
      // Prepare payload - only include company and phone if they're not empty
      const payload: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      };
      
      if (formData.company && formData.company.trim()) {
        payload.company = formData.company;
      }
      
      if (formData.phone && formData.phone.trim()) {
        payload.phone = formData.phone;
      }

      const response = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t("auth.registrationFailed"));
      }

      // Show success message
      setSuccess(t("auth.registrationSuccess"));
      
      // Clear form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        company: "",
        phone: "",
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/signin");
      }, 2000);
    } catch (err: any) {
      setError(err.message || t("auth.registrationFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
      <div className="w-full max-w-md mx-auto mb-5 sm:pt-10">
        <Link
          to="/signin"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          {t("auth.backToSignIn")}
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              {t("auth.signUpTitle")}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("auth.signUpDescription")}
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
                </div>
              )}
              {success && (
                <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <p className="text-sm text-green-800 dark:text-green-400">{success}</p>
                </div>
              )}
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* <!-- First Name --> */}
                  <div className="sm:col-span-1">
                    <Label>
                      {t("auth.firstName")}<span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="fname"
                      name="firstName"
                      placeholder={t("auth.firstNamePlaceholder")}
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                  </div>
                  {/* <!-- Last Name --> */}
                  <div className="sm:col-span-1">
                    <Label>
                      {t("auth.lastName")}<span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="lname"
                      name="lastName"
                      placeholder={t("auth.lastNamePlaceholder")}
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                {/* <!-- Email --> */}
                <div>
                  <Label>
                    {t("auth.email")}<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    placeholder={t("auth.emailPlaceholder")}
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                {/* <!-- Company --> */}
                <div>
                  <Label>
                    {t("auth.company")}
                  </Label>
                  <Input
                    type="text"
                    id="company"
                    name="company"
                    placeholder={t("auth.companyPlaceholder")}
                    value={formData.company}
                    onChange={handleChange}
                  />
                </div>
                {/* <!-- Phone --> */}
                <div>
                  <Label>
                    {t("auth.phoneNumber")}
                  </Label>
                  <Input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder={t("auth.phonePlaceholder")}
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                {/* <!-- Password --> */}
                <div>
                  <Label>
                    {t("auth.password")}<span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder={t("auth.passwordPlaceholder")}
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>
                {/* <!-- Confirm Password --> */}
                <div>
                  <Label>
                    {t("auth.confirmPassword")}<span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder={t("auth.confirmPasswordPlaceholder")}
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                {/* <!-- Checkbox --> */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    className="w-5 h-5"
                    checked={isChecked}
                    onChange={setIsChecked}
                  />
                  <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                    Durch die Erstellung eines Kontos stimmen Sie den{" "}
                    <span className="text-gray-800 dark:text-white/90">
                      {t("auth.termsAndConditions")}
                    </span>{" "}
                    und unserer{" "}
                    <span className="text-gray-800 dark:text-white">
                      {t("auth.privacyPolicy")}
                    </span>{" "}
                    zu
                  </p>
                </div>
                {/* <!-- Button --> */}
                <div>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? t("auth.signingUp") : t("auth.signUp")}
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                {t("auth.hasAccount")} {""}
                <Link
                  to="/signin"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  {t("auth.signIn")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
