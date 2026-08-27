/**
 * Utility formatters for medical supply chain data (IDR currency, date formats, mono quantities)
 */

/**
 * Formats a number as IDR currency (or other ISO currency code)
 */
export function formatCurrency(
  amount: number,
  currency: string = "IDR",
  locale: string = "id-ID"
): string {
  if (isNaN(amount)) return "Rp 0";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats a date into standard YYYY-MM-DD string (or localized date format)
 */
export function formatDate(
  dateInput: Date | string | number | null | undefined,
  formatStyle: "iso" | "short" | "medium" | "long" = "iso"
): string {
  if (!dateInput) return "—";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "Invalid Date";

  if (formatStyle === "iso") {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const optionsMap: Record<"short" | "medium" | "long", Intl.DateTimeFormatOptions> = {
    short: { day: "numeric", month: "short", year: "numeric" },
    medium: { day: "numeric", month: "short", year: "numeric" },
    long: { day: "numeric", month: "long", year: "numeric" },
  };

  return new Intl.DateTimeFormat("en-US", optionsMap[formatStyle]).format(date);
}

/**
 * Formats numbers with thousands separator
 */
export function formatNumber(
  value: number | null | undefined,
  fallback: string = "0"
): string {
  if (value === null || value === undefined || isNaN(value)) return fallback;
  return new Intl.NumberFormat("en-US").format(value);
}

/**
 * Formats quantities safe for display with lot/SKU monospaced figures
 */
export function formatQuantity(
  qty: number | null | undefined,
  unit?: string
): string {
  if (qty === null || qty === undefined || isNaN(qty)) return unit ? `0 ${unit}` : "0";
  const formatted = formatNumber(qty);
  return unit ? `${formatted} ${unit}` : formatted;
}
