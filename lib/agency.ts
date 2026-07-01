// Your agency's billing profile — shown on invoices (letterhead, bank, UPI,
// signature). Edit these values to match your registered business details.
export const AGENCY = {
  name: "Agency OS",
  tagline: "Influencer Marketing Agency",
  legalName: "Agency OS Media Pvt. Ltd.",
  logoColor: "#4f46e5",
  email: "billing@agencyos.in",
  phone: "+91 98200 00000",
  address: "Andheri West, Mumbai 400053, India",
  gstin: "27AAAAA0000A1Z5",

  bank: {
    holder: "Agency OS Media Pvt. Ltd.",
    name: "HDFC Bank",
    account: "50100123456789",
    ifsc: "HDFC0000123",
    branch: "Andheri West, Mumbai",
  },

  upi: {
    id: "agencyos@hdfcbank",
    payeeName: "Agency OS Media",
  },

  signatureName: "Authorised Signatory",
};

/** Build a UPI deep-link (upi://pay?...) for the QR / payment intent. */
export function upiPaymentUri(amount: number, note: string): string {
  const params = new URLSearchParams({
    pa: AGENCY.upi.id,
    pn: AGENCY.upi.payeeName,
    am: String(amount),
    cu: "INR",
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
}
