import type { Lang } from "@/lib/i18n";

export const REQUEST_TYPES = [
  "tender",
  "price_quotation",
  "maintenance",
  "service",
  "project",
  "contract_renewal",
  "technical_evaluation",
  "emergency",
] as const;
export type RequestType = (typeof REQUEST_TYPES)[number];

export const requestTypeLabel = (t: RequestType, lang: Lang) => {
  const map: Record<RequestType, { en: string; ar: string }> = {
    tender: { en: "Tender", ar: "مناقصة" },
    price_quotation: { en: "Price Quotation", ar: "عرض سعر" },
    maintenance: { en: "Maintenance", ar: "صيانة" },
    service: { en: "Service", ar: "خدمة" },
    project: { en: "Project", ar: "مشروع" },
    contract_renewal: { en: "Contract Renewal", ar: "تجديد عقد" },
    technical_evaluation: { en: "Technical Evaluation", ar: "تقييم فني" },
    emergency: { en: "Emergency", ar: "طارئ" },
  };
  return lang === "ar" ? map[t].ar : map[t].en;
};

export const PROPOSAL_STATUSES = [
  "submitted",
  "under_review",
  "technical_eval",
  "financial_eval",
  "approved",
  "rejected",
  "awarded",
] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const proposalStatusLabel = (s: ProposalStatus, lang: Lang) => {
  const map: Record<ProposalStatus, { en: string; ar: string }> = {
    submitted: { en: "Submitted", ar: "تم التقديم" },
    under_review: { en: "Under Review", ar: "قيد المراجعة" },
    technical_eval: { en: "Technical Evaluation", ar: "تقييم فني" },
    financial_eval: { en: "Financial Evaluation", ar: "تقييم مالي" },
    approved: { en: "Approved", ar: "موافق" },
    rejected: { en: "Rejected", ar: "مرفوض" },
    awarded: { en: "Awarded", ar: "مُرسى" },
  };
  return lang === "ar" ? map[s].ar : map[s].en;
};

export const proposalStatusColor = (s: ProposalStatus): string => {
  const map: Record<ProposalStatus, string> = {
    submitted: "bg-secondary text-secondary-foreground border-border",
    under_review: "bg-accent/15 text-accent-foreground border-accent/30",
    technical_eval: "bg-accent/15 text-accent-foreground border-accent/30",
    financial_eval: "bg-accent/15 text-accent-foreground border-accent/30",
    approved: "bg-success/15 text-success border-success/30",
    rejected: "bg-destructive/10 text-destructive border-destructive/30",
    awarded: "bg-primary/15 text-primary border-primary/30",
  };
  return map[s];
};

export const PARTNER_STATUSES = ["pending", "active", "suspended", "rejected"] as const;
export type PartnerStatus = (typeof PARTNER_STATUSES)[number];

export const partnerStatusLabel = (s: PartnerStatus, lang: Lang) => {
  const map: Record<PartnerStatus, { en: string; ar: string }> = {
    pending: { en: "Pending Approval", ar: "بانتظار الموافقة" },
    active: { en: "Active", ar: "نشط" },
    suspended: { en: "Suspended", ar: "موقوف" },
    rejected: { en: "Rejected", ar: "مرفوض" },
  };
  return lang === "ar" ? map[s].ar : map[s].en;
};

export const CONTRACT_STATUSES = ["draft", "active", "expired", "terminated", "renewed"] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export const contractStatusLabel = (s: ContractStatus, lang: Lang) => {
  const map: Record<ContractStatus, { en: string; ar: string }> = {
    draft: { en: "Draft", ar: "مسودة" },
    active: { en: "Active", ar: "ساري" },
    expired: { en: "Expired", ar: "منتهي" },
    terminated: { en: "Terminated", ar: "منهي" },
    renewed: { en: "Renewed", ar: "مُجدد" },
  };
  return lang === "ar" ? map[s].ar : map[s].en;
};

export const daysUntil = (dateStr?: string | null) => {
  if (!dateStr) return null;
  const ms = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(ms / 86400000);
};
