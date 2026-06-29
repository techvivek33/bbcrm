import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { inr, dateLong } from "@/lib/format";
import { meta, INVOICE_STATUS } from "@/lib/enums";
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
  const billEmail = invoice.brand?.email ?? invoice.creator?.email ?? null;
  const billPhone = invoice.brand?.phone ?? invoice.creator?.phone ?? null;
  const billLocation = invoice.creator?.location ?? null;
  const billGst = invoice.brand ? null : invoice.creator?.gstNumber ?? null;
  const billPan = invoice.creator?.panNumber ?? null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/invoices" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" /> Back to Invoices
        </Link>
        <InvoiceStatusActions invoiceId={invoice.id} status={invoice.status} />
      </div>

      {/* Printable invoice document */}
      <div className="card mx-auto mt-4 max-w-3xl bg-white p-8 sm:p-10">
        {/* Letterhead */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <p className="text-2xl font-bold tracking-tight text-brand-600">Agency OS</p>
            <p className="mt-1 text-sm text-slate-500">Influencer Marketing Agency</p>
            <p className="text-xs text-slate-400">Mumbai, India · billing@agencyos.in</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Invoice</p>
            <p className="text-lg font-bold text-slate-900">{invoice.number}</p>
            <div className="mt-2 flex justify-end">
              <Badge tone={s.tone} dot>{s.label}</Badge>
            </div>
            <Badge tone="gray" className="mt-2">{invoice.type}</Badge>
          </div>
        </div>

        {/* Bill To + dates */}
        <div className="grid grid-cols-1 gap-6 py-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bill To</p>
            <p className="mt-1 text-base font-semibold text-slate-900">{billName}</p>
            <div className="mt-2 space-y-1 text-sm text-slate-600">
              {billEmail && <p className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-400" /> {billEmail}</p>}
              {billPhone && <p className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-400" /> {billPhone}</p>}
              {billLocation && <p className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400" /> {billLocation}</p>}
              {billGst && <p className="text-xs text-slate-500">GSTIN: {billGst}</p>}
              {billPan && <p className="text-xs text-slate-500">PAN: {billPan}</p>}
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
          <div className="sm:text-right">
            <div className="space-y-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Issued Date</p>
                <p className="text-sm text-slate-800">{dateLong(invoice.issuedDate)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Due Date</p>
                <p className="text-sm text-slate-800">{invoice.dueDate ? dateLong(invoice.dueDate) : "—"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Line items */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              <th className="py-2.5 pr-3">Description</th>
              <th className="py-2.5 px-3 text-right">Qty</th>
              <th className="py-2.5 px-3 text-right">Rate</th>
              <th className="py-2.5 pl-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td className="py-3 pr-3 text-slate-700">Services rendered</td>
                <td className="py-3 px-3 text-right text-slate-600">1</td>
                <td className="py-3 px-3 text-right text-slate-600">{inr(invoice.amount)}</td>
                <td className="py-3 pl-3 text-right font-medium text-slate-800">{inr(invoice.amount)}</td>
              </tr>
            ) : (
              items.map((it, idx) => {
                const qty = it.qty ?? 1;
                const rate = it.rate ?? 0;
                return (
                  <tr key={idx}>
                    <td className="py-3 pr-3 text-slate-700">{it.desc ?? "Services rendered"}</td>
                    <td className="py-3 px-3 text-right text-slate-600">{qty}</td>
                    <td className="py-3 px-3 text-right text-slate-600">{inr(rate)}</td>
                    <td className="py-3 pl-3 text-right font-medium text-slate-800">{inr(qty * rate)}</td>
                  </tr>
                );
              })
            )}
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
            <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base">
              <span className="font-semibold text-slate-900">Total</span>
              <span className="font-bold text-slate-900">{inr(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 border-t border-slate-100 pt-5 text-xs text-slate-400">
          <p>Payment due {invoice.dueDate ? `by ${dateLong(invoice.dueDate)}` : "on receipt"}. Please reference invoice {invoice.number} with your payment.</p>
          <p className="mt-1">Thank you for partnering with Agency OS.</p>
        </div>
      </div>
    </div>
  );
}
