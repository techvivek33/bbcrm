import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Megaphone, Building2, User, Download, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Field } from "@/components/ui/misc";
import { dateLong, dateShort, daysUntil } from "@/lib/format";
import { meta, CONTRACT_STATUS } from "@/lib/enums";
import { ContractStatusActions } from "@/components/contracts/ContractStatusActions";

export const dynamic = "force-dynamic";

export default async function ContractDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      brand: { select: { id: true, companyName: true } },
      creator: { select: { id: true, name: true } },
      campaign: { select: { id: true, name: true } },
    },
  });
  if (!contract) notFound();

  const s = meta(CONTRACT_STATUS, contract.status);

  const partyName = contract.brand?.companyName ?? contract.creator?.name ?? "—";
  const partyHref = contract.brand
    ? `/brands/${contract.brand.id}`
    : contract.creator
    ? `/creators/${contract.creator.id}`
    : null;

  const expDays = daysUntil(contract.expiryDate);
  const expiringWarn = expDays !== null && expDays >= 0 && expDays < 30 && contract.status !== "EXPIRED";
  const expiredAlready = expDays !== null && expDays < 0 && contract.status !== "EXPIRED";

  return (
    <div>
      <Link href="/contracts" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Back to Contracts
      </Link>

      {/* Header */}
      <div className="card card-pad mb-6 flex flex-wrap items-start gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <FileText className="h-7 w-7" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{contract.title}</h1>
            <Badge tone={s.tone} dot>{s.label}</Badge>
            <Badge tone="gray">{contract.type}</Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              {contract.brand ? <Building2 className="h-4 w-4 text-slate-400" /> : <User className="h-4 w-4 text-slate-400" />}
              {partyHref ? (
                <Link href={partyHref} className="font-medium hover:text-brand-600">{partyName}</Link>
              ) : (
                partyName
              )}
            </span>
            {contract.campaign && (
              <Link href={`/campaigns/${contract.campaign.id}`} className="inline-flex items-center gap-1.5 hover:text-brand-600">
                <Megaphone className="h-4 w-4 text-slate-400" /> {contract.campaign.name}
              </Link>
            )}
          </div>
        </div>
      </div>

      {(expiringWarn || expiredAlready) && (
        <div className={`mb-6 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${expiredAlready ? "border-rose-200 bg-rose-50 text-rose-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {expiredAlready
            ? `This contract's expiry date passed ${Math.abs(expDays as number)} day(s) ago — review for renewal.`
            : `This contract expires in ${expDays} day(s) — consider initiating a renewal.`}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Metadata */}
          <Card>
            <CardHeader title="Contract Details" subtitle="Key terms and parties" />
            <dl className="grid grid-cols-2 gap-4 p-5">
              <Field label="Type">{contract.type}</Field>
              <Field label="Status">
                <Badge tone={s.tone}>{s.label}</Badge>
              </Field>
              <Field label="Party">
                {partyHref ? (
                  <Link href={partyHref} className="font-medium text-brand-600 hover:underline">{partyName}</Link>
                ) : (
                  partyName
                )}
              </Field>
              <Field label="Campaign">
                {contract.campaign ? (
                  <Link href={`/campaigns/${contract.campaign.id}`} className="font-medium text-brand-600 hover:underline">
                    {contract.campaign.name}
                  </Link>
                ) : (
                  "—"
                )}
              </Field>
              <Field label="Signed Date">{contract.signedDate ? dateLong(contract.signedDate) : "—"}</Field>
              <Field label="Expiry Date">
                <span className={expiringWarn || expiredAlready ? "font-semibold text-rose-600" : undefined}>
                  {contract.expiryDate ? dateLong(contract.expiryDate) : "—"}
                </span>
              </Field>
              <Field label="Renewal Reminder">{contract.renewalReminderDate ? dateLong(contract.renewalReminderDate) : "—"}</Field>
              <Field label="Created">{dateShort(contract.createdAt)}</Field>
            </dl>
          </Card>

          {/* Document preview placeholder */}
          <Card>
            <CardHeader
              title="Document Preview"
              subtitle="The agreement PDF renders here"
              action={
                contract.fileUrl ? (
                  <a
                    href={contract.fileUrl}
                    target="_blank"
                    className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </a>
                ) : undefined
              }
            />
            <div className="px-5 pb-5">
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-16 text-center">
                <FileText className="mb-3 h-10 w-10 text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">
                  {contract.fileUrl ? "Document attached" : "No document uploaded"}
                </p>
                <p className="mt-1 max-w-sm text-xs text-slate-400">
                  {contract.fileUrl
                    ? "A signed PDF is on file. Use the download button above to view it."
                    : "Once a signed PDF is uploaded it will preview here. The e-signature panel records the executed status in the meantime."}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar — e-signature */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Signature" subtitle="Send and e-sign this agreement" />
            <div className="p-5">
              <ContractStatusActions contractId={contract.id} status={contract.status} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
