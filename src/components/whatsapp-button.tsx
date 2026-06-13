type WhatsAppButtonProps = {
  phoneNumber: string;
  label: string;
  className?: string;
  prefillText?: string;
  labelClassName?: string;
};

function normalizeWhatsAppPhone(phoneNumber: string) {
  return phoneNumber.replace(/\D/g, "");
}

export function buildWhatsAppUrl(phoneNumber: string, prefillText?: string) {
  const normalizedPhone = normalizeWhatsAppPhone(phoneNumber);
  const baseUrl = `https://wa.me/${normalizedPhone}`;

  if (!prefillText) {
    return baseUrl;
  }

  return `${baseUrl}?text=${encodeURIComponent(prefillText)}`;
}

export function WhatsAppButton({
  phoneNumber,
  label,
  className,
  prefillText,
  labelClassName,
}: WhatsAppButtonProps) {
  return (
    <a
      href={buildWhatsAppUrl(phoneNumber, prefillText)}
      target="_blank"
      rel="noreferrer"
      className={className}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
        <path d="M19.11 4.93A9.9 9.9 0 0 0 12.04 2C6.56 2 2.1 6.44 2.1 11.93c0 1.75.46 3.46 1.33 4.97L2 22l5.24-1.37a9.93 9.93 0 0 0 4.79 1.22h.01c5.48 0 9.94-4.44 9.94-9.93a9.87 9.87 0 0 0-2.87-6.99Zm-7.07 15.24h-.01a8.23 8.23 0 0 1-4.19-1.15l-.3-.18-3.11.81.83-3.03-.2-.31a8.2 8.2 0 0 1-1.27-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.85 5.82 2.4a8.16 8.16 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.23 8.24Zm4.51-6.17c-.25-.12-1.47-.72-1.7-.8-.23-.08-.4-.12-.57.12-.17.25-.65.8-.8.97-.15.17-.3.19-.55.06-.25-.12-1.07-.39-2.03-1.24a7.66 7.66 0 0 1-1.4-1.74c-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.57-1.37-.78-1.88-.2-.49-.41-.42-.57-.43h-.49c-.17 0-.43.06-.66.31-.23.25-.86.84-.86 2.05 0 1.21.88 2.39 1 2.55.12.17 1.73 2.64 4.18 3.7.58.25 1.04.4 1.4.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29Z" />
      </svg>
      <span className={labelClassName}>{label}</span>
    </a>
  );
}
