export const SPEC_REPORT_FIELDS = [
  { value: "cpu", label: "Processor" },
  { value: "gpu", label: "Graphics card" },
  { value: "memory", label: "Memory amount" },
  { value: "storage", label: "Storage" },
  { value: "motherboard", label: "Motherboard" },
  { value: "case", label: "Case standard" },
  { value: "psu", label: "Power supply" },
  { value: "ram-config", label: "RAM configuration" },
  { value: "cooling", label: "Cooling" },
  { value: "price-availability", label: "Price or availability" },
  { value: "other", label: "Something else" },
] as const;

export type SpecReportField = (typeof SPEC_REPORT_FIELDS)[number]["value"];

export function isSpecReportField(value: unknown): value is SpecReportField {
  return typeof value === "string"
    && SPEC_REPORT_FIELDS.some((field) => field.value === value);
}
