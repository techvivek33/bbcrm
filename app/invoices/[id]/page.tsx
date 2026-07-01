import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { ArrowLeft, Mail, Phone, MapPin, Landmark, QrCode } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { inr, dateLong } from "@/lib/format";
import { initials } from "@/lib/utils";
import { meta, INVOICE_STATUS } from "@/lib/enums";
import { AGENCY, upiPaymentUri } from "@/lib/agency";
import { InvoiceStatusActions } from "@/components/invoices/InvoiceStatusActions";

export const dynamic = "force-dynamic";

type LineItem = { desc?: string; qty?: number; rate?: number };

export default async function InvoiceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { brand: true, creator: true, campaign: { select: { id: true, name: true } } },
  });
  if (!invoice) notFound();

  const s = meta(INVOICE_STATUS, invoice.status);

  let items: LineItem[] = [];
  try {
    const parsed = JSON.parse(invoice.items || "[]");
    if (Array.isArray(parsed)) items = parsed as LineItem[];
  } catch {
    items = [];
  }

  // Bill-To party — brand takes priority, else creator.
  const billName = invoice.brand?.companyName ?? invoice.creator?.name ?? "—";
  const billColor = invoice.brand?.logoColor ?? invoice.creator?.avatarColor ?? "#64748b";
  const billEmail = invoice.brand?.email ?? invoice.creator?.email ?? null;
  const billPhone = invoice.brand?.phone ?? invoice.creator?.phone ?? null;
  const billLocation = invoice.creator?.location ?? null;
  const billGst = invoice.brand ? null : invoice.creator?.gstNumber ?? null;
  const billPan = invoice.creator?.panNumber ?? null;

  // UPI payment QR (rendered as inline SVG — prints cleanly).
  const upiUri = upiPaymentUri(invoice.total, invoice.number);
  const qrSvg = await QRCode.toString(upiUri, {
    type: "svg",
    margin: 0,
    width: 136,
    color: { dark: "#0f172a", light: "#ffffff" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/invoices" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" /> Back to Invoices
        </Link>
        <InvoiceStatusActions invoiceId={invoice.id} status={invoice.status} />
      </div>

      {/* Printable invoice document */}
      <div className="card mx-auto mt-4 max-w-3xl bg-white p-8 sm:p-12">
        {/* Letterhead — agency logo + INVOICE meta */}
        <div className="flex flex-wrap items-start justify-between gap-6 border-b border-slate-100 pb-8">
          <div className="flex items-start gap-3">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
              style={{ backgroundColor: AGENCY.logoColor }}
            >
              {initials(AGENCY.name)}
            </span>
            <div>
              <p className="text-xl font-bold tracking-tight text-slate-900">{AGENCY.name}</p>
              <p className="text-sm text-slate-500">{AGENCY.tagline}</p>
              <p className="mt-1 text-xs text-slate-400">{AGENCY.address}</p>
              <p className="text-xs text-slate-400">{AGENCY.email} · {AGENCY.phone}</p>
              <p className="text-xs text-slate-400">GSTIN: {AGENCY.gstin}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold uppercase tracking-tight text-slate-300">Invoice</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{invoice.number}</p>
            <div className="mt-2 flex justify-end gap-2">
              <Badge tone="gray">{invoice.type}</Badge>
              <Badge tone={s.tone} dot>{s.label}</Badge>
            </div>
          </div>
        </div>

        {/* Bill To (with client logo) + dates */}
        <div className="grid grid-cols-1 gap-8 py-8 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bill To</p>
            <div className="mt-2 flex items-start gap-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                style={{ backgroundColor: billColor }}
              >
                {billName.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <p className="text-base font-semibold text-slate-900">{billName}</p>
                <div className="mt-1 space-y-0.5 text-sm text-slate-600">
                  {billEmail && <p className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-400" /> {billEmail}</p>}
                  {billPhone && <p className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-400" /> {billPhone}</p>}
                  {billLocation && <p className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400" /> {billLocation}</p>}
                  {billGst && <p className="text-xs text-slate-500">GSTIN: {billGst}</p>}
                  {billPan && <p className="text-xs text-slate-500">PAN: {billPan}</p>}
                </div>
              </div>
            </div>
            {invoice.campaign && (
              <p className="mt-3 text-xs text-slate-500">
                Campaign:{" "}
                <Link href={`/campaigns/${invoice.campaign.id}`} className="font-medium text-brand-600 hover:underline print:text-slate-700 print:no-underline">
                  {invoice.campaign.name}
                </Link>
              </p>
            )}
          </div>
          <div className="space-y-3 sm:text-right">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Issued Date</p>
              <p className="text-sm text-slate-800">{dateLong(invoice.issuedDate)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Due Date</p>
              <p className="text-sm text-slate-800">{invoice.dueDate ? dateLong(invoice.dueDate) : "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Amount Due</p>
              <p className="text-lg font-bold text-slate-900">{inr(invoice.total)}</p>
            </div>
          </div>
        </div>

        {/* Line items */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              <th className="py-3 pr-3">Description</th>
              <th className="px-3 py-3 text-right">Qty</th>
              <th className="px-3 py-3 text-right">Rate</th>
              <th className="py-3 pl-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(items.length === 0 ? [{ desc: "Services rendered", qty: 1, rate: invoice.amount }] : items).map((it, idx) => {
              const qty = it.qty ?? 1;
              const rate = it.rate ?? 0;
              return (
                <tr key={idx}>
                  <td className="py-3.5 pr-3 text-slate-700">{it.desc ?? "Services rendered"}</td>
                  <td className="px-3 py-3.5 text-right text-slate-600">{qty}</td>
                  <td className="px-3 py-3.5 text-right text-slate-600">{inr(rate)}</td>
                  <td className="py-3.5 pl-3 text-right font-medium text-slate-800">{inr(qty * rate)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-medium text-slate-800">{inr(invoice.amount)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">GST ({invoice.taxRate}%)</span>
              <span className="font-medium text-slate-800">{inr(invoice.taxAmount)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-base">
              <span className="font-semibold text-slate-900">Total</span>
              <span className="font-bold text-slate-900">{inr(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* Payment details: bank + UPI + QR */}
        <div className="mt-10 grid grid-cols-1 gap-6 rounded-xl border border-slate-100 bg-slate-50/60 p-5 sm:grid-cols-[1fr_auto]">
          <div>
            <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Landmark className="h-3.5 w-3.5" /> Bank Transfer
            </p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <dt className="text-slate-400">Account Name</dt><dd className="font-medium text-slate-800">{AGENCY.bank.holder}</dd>
              <dt className="text-slate-400">Bank</dt><dd className="font-medium text-slate-800">{AGENCY.bank.name}</dd>
              <dt className="text-slate-400">A/C No.</dt><dd className="font-mono font-medium text-slate-800">{AGENCY.bank.account}</dd>
              <dt className="text-slate-400">IFSC</dt><dd className="font-mono font-medium text-slate-800">{AGENCY.bank.ifsc}</dd>
              <dt className="text-slate-400">Branch</dt><dd className="font-medium text-slate-800">{AGENCY.bank.branch}</dd>
            </dl>
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <QrCode className="h-3.5 w-3.5" /> UPI
            </p>
            <p className="mt-1 font-mono text-sm font-medium text-slate-800">{AGENCY.upi.id}</p>
          </div>
          <div className="flex flex-col items-center justify-center gap-1.5 sm:pl-4">
            <div className="rounded-lg border border-slate-200 bg-white p-2" style={{ width: 136, height: 136 }} dangerouslySetInnerHTML={{ __html: qrSvg }} />
            <p className="text-xs font-medium text-slate-600">Scan to pay {inr(invoice.total)}</p>
            <p className="text-[10px] text-slate-400">via any UPI app</p>
          </div>
        </div>

        {/* Signature */}
        <div className="mt-10 flex items-end justify-between gap-6">
          <p className="max-w-xs text-xs text-slate-400">
            Payment due {invoice.dueDate ? `by ${dateLong(invoice.dueDate)}` : "on receipt"}. Please reference invoice{" "}
            {invoice.number} with your payment. Thank you for partnering with {AGENCY.name}.
          </p>
          <div className="text-right">
            <p className="text-2xl leading-none text-slate-700" style={{ fontFamily: '"Segoe Script", "Brush Script MT", cursive' }}>
              {AGENCY.name}
            </p>
            <div className="ml-auto mt-1 w-48 border-t border-slate-300" />
            <p className="mt-1 text-xs font-semibold text-slate-700">{AGENCY.signatureName}</p>
            <p className="text-[11px] text-slate-400">for {AGENCY.legalName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
