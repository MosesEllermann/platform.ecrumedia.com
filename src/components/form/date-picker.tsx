import { useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import { German } from "flatpickr/dist/l10n/de.js";
import "flatpickr/dist/flatpickr.css";
import Label from "./Label";
import { CalenderIcon } from "../../icons";
import Hook = flatpickr.Options.Hook;
import DateOption = flatpickr.Options.DateOption;

type PropsType = {
  id: string;
  mode?: "single" | "multiple" | "range" | "time";
  onChange?: Hook | Hook[];
  defaultDate?: DateOption;
  label?: string;
  placeholder?: string;
};

export default function DatePicker({
  id,
  mode,
  onChange,
  label,
  defaultDate,
  placeholder,
}: PropsType) {
  const flatpickrRef = useRef<flatpickr.Instance | null>(null);

  // Initialize flatpickr
  useEffect(() => {
    const instance = flatpickr(`#${id}`, {
      mode: mode || "single",
      static: true,
      monthSelectorType: "static",
      dateFormat: "d.m.Y",
      locale: German,
      defaultDate,
      onChange,
    });

    if (!Array.isArray(instance)) {
      flatpickrRef.current = instance;
    }

    return () => {
      if (flatpickrRef.current) {
        flatpickrRef.current.destroy();
        flatpickrRef.current = null;
      }
    };
  }, [mode, onChange, id]);

  // Update date when defaultDate changes
  useEffect(() => {
    if (flatpickrRef.current && defaultDate) {
      flatpickrRef.current.setDate(defaultDate, false);
    }
  }, [defaultDate]);

  return (
    <div>
      {label && <Label htmlFor={id} className="text-xs mb-1">{label}</Label>}

      <div className="relative">
        <input
          id={id}
          placeholder={placeholder}
          className="h-9 w-full rounded-lg border appearance-none px-3 py-2 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-2  dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700  dark:focus:border-brand-800"
        />

        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-2.5 top-1/2 dark:text-gray-400">
          <CalenderIcon className="size-5" />
        </span>
      </div>
    </div>
  );
}
