import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Lang = "en" | "ar";

type Dict = Record<string, { en: string; ar: string }>;

export const dict: Dict = {
  // Nav
  "nav.home": { en: "Home", ar: "الرئيسية" },
  "nav.tenders": { en: "Tenders", ar: "المناقصات" },
  "nav.services": { en: "Services", ar: "الخدمات" },
  "nav.contact": { en: "Contact", ar: "تواصل معنا" },
  "nav.signin": { en: "Sign In", ar: "دخول" },
  "nav.services.vendor": { en: "Vendor Portal", ar: "بوابة الموردين" },
  "nav.services.employee": { en: "Employee Portal", ar: "بوابة الموظفين" },
  "nav.services.shareholder": { en: "Shareholder Portal", ar: "بوابة المساهمين" },
  "nav.about": { en: "About", ar: "من نحن" },
  "nav.board": { en: "Board", ar: "مجلس الإدارة" },
  "nav.requirements": { en: "Tenders", ar: "المناقصات" },
  "nav.vendor_login": { en: "Vendor Login", ar: "دخول الموردين" },
  "nav.vendor_signup": { en: "Vendor Signup", ar: "تسجيل مورد" },
  "nav.employee_login": { en: "Employees", ar: "الموظفون" },
  "nav.shareholder_login": { en: "Shareholders", ar: "المساهمون" },
  "nav.dashboard": { en: "Dashboard", ar: "لوحة التحكم" },
  "nav.logout": { en: "Logout", ar: "تسجيل خروج" },

  // Hero
  "hero.title": { en: "Kaifan Co-operative Society", ar: "جمعية كيفان التعاونية" },
  "hero.subtitle": {
    en: "Serving our community since 1973. Trusted by thousands of shareholders, partnered with hundreds of vendors.",
    ar: "نخدم مجتمعنا منذ عام 1973. موثوق بنا من قبل آلاف المساهمين وشركاء مع مئات الموردين.",
  },
  "hero.cta_vendor": { en: "Apply as Vendor", ar: "تقدم كمورد" },
  "hero.cta_view": { en: "View Tenders", ar: "عرض المناقصات" },

  // Stats
  "stats.established": { en: "Established", ar: "تأسست" },
  "stats.shareholders": { en: "Shareholders", ar: "المساهمون" },
  "stats.branches": { en: "Branches", ar: "الفروع" },
  "stats.vendors": { en: "Active Vendors", ar: "الموردون النشطون" },

  // About
  "about.title": { en: "About Kaifan Co-operative", ar: "عن جمعية كيفان التعاونية" },
  "about.body": {
    en: "Kaifan Co-operative Society is one of Kuwait's leading consumer co-operatives, established in 1973. We operate a network of supermarkets and service centers serving the Kaifan community and beyond. Owned by our shareholders, we are committed to quality, fair pricing, and supporting local businesses through transparent procurement.",
    ar: "جمعية كيفان التعاونية هي إحدى الجمعيات التعاونية الاستهلاكية الرائدة في الكويت، تأسست عام 1973. نحن ندير شبكة من الأسواق المركزية ومراكز الخدمة لخدمة مجتمع كيفان وما حوله. مملوكة لمساهمينا، ونحن ملتزمون بالجودة والأسعار العادلة ودعم الشركات المحلية من خلال المشتريات الشفافة.",
  },

  // Board
  "board.title": { en: "Board of Directors", ar: "مجلس الإدارة" },
  "board.subtitle": { en: "Elected by our shareholders to lead with integrity", ar: "منتخبون من مساهمينا لقيادة بنزاهة" },
  "board.chairman": { en: "Chairman", ar: "رئيس مجلس الإدارة" },
  "board.vice": { en: "Vice Chairman", ar: "نائب الرئيس" },
  "board.treasurer": { en: "Treasurer", ar: "أمين الصندوق" },
  "board.secretary": { en: "Secretary", ar: "أمين السر" },
  "board.member": { en: "Board Member", ar: "عضو مجلس الإدارة" },

  // Requirements
  "req.title": { en: "Current HO Requirements", ar: "احتياجات الإدارة العامة الحالية" },
  "req.subtitle": {
    en: "Open tenders. Submit your quotation — lowest approved bid wins.",
    ar: "مناقصات مفتوحة. قدم عرض الأسعار الخاص بك — يفوز العرض الأقل المعتمد.",
  },
  "req.deadline": { en: "Deadline", ar: "الموعد النهائي" },
  "req.submit": { en: "Submit Quotation", ar: "تقديم عرض سعر" },
  "req.no_open": { en: "No open tenders right now. Please check back soon.", ar: "لا توجد مناقصات مفتوحة حالياً. يرجى التحقق لاحقاً." },
  "req.status.open": { en: "Open", ar: "مفتوح" },
  "req.status.closed": { en: "Closed", ar: "مغلق" },
  "req.status.awarded": { en: "Awarded", ar: "تم الترسية" },

  // Auth
  "auth.signin": { en: "Sign In", ar: "تسجيل الدخول" },
  "auth.signup": { en: "Create Vendor Account", ar: "إنشاء حساب مورد" },
  "auth.email": { en: "Email", ar: "البريد الإلكتروني" },
  "auth.password": { en: "Password", ar: "كلمة المرور" },
  "auth.full_name": { en: "Full Name", ar: "الاسم الكامل" },
  "auth.company": { en: "Company Name", ar: "اسم الشركة" },
  "auth.phone": { en: "Phone", ar: "الهاتف" },
  "auth.have_account": { en: "Already have an account?", ar: "لديك حساب بالفعل؟" },
  "auth.no_account": { en: "Don't have an account?", ar: "ليس لديك حساب؟" },
  "auth.processing": { en: "Processing…", ar: "جاري المعالجة…" },
  "auth.welcome": { en: "Vendor Portal", ar: "بوابة الموردين" },

  // Dashboard
  "dash.title": { en: "Vendor Dashboard", ar: "لوحة المورد" },
  "dash.open_tenders": { en: "Open Tenders", ar: "المناقصات المفتوحة" },
  "dash.my_quotations": { en: "My Quotations", ar: "عروضي" },
  "dash.notifications": { en: "Notifications", ar: "الإشعارات" },
  "dash.no_quotations": { en: "You have not submitted any quotations yet.", ar: "لم تقم بتقديم أي عروض بعد." },
  "dash.no_notifications": { en: "No notifications.", ar: "لا توجد إشعارات." },

  // Quotation form
  "qf.title": { en: "Submit Quotation", ar: "تقديم عرض سعر" },
  "qf.price": { en: "Price (KWD)", ar: "السعر (د.ك)" },
  "qf.notes": { en: "Notes / Specifications", ar: "ملاحظات / المواصفات" },
  "qf.documents": { en: "Attach Documents (PDF, images, etc.)", ar: "إرفاق المستندات (PDF، صور، إلخ.)" },
  "qf.submit": { en: "Submit", ar: "إرسال" },
  "qf.success": { en: "Quotation submitted successfully", ar: "تم تقديم العرض بنجاح" },

  // Status
  "status.pending": { en: "Pending", ar: "قيد المراجعة" },
  "status.approved": { en: "Approved", ar: "معتمد" },
  "status.rejected": { en: "Rejected", ar: "مرفوض" },

  // Footer
  "footer.contact": { en: "Contact", ar: "اتصل بنا" },
  "footer.address": { en: "Kaifan, Kuwait City, Kuwait", ar: "كيفان، مدينة الكويت، الكويت" },
  "footer.rights": { en: "© 2026 Kaifan Co-operative Society. All rights reserved.", ar: "© 2026 جمعية كيفان التعاونية. جميع الحقوق محفوظة." },
};

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof dict) => string;
  dir: "ltr" | "rtl";
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem("kaifan-lang") as Lang) || "en");

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    localStorage.setItem("kaifan-lang", lang);
  }, [lang]);

  const setLang = (l: Lang) => setLangState(l);
  const t = (key: keyof typeof dict) => dict[key]?.[lang] ?? String(key);
  const dir = lang === "ar" ? "rtl" : "ltr";

  return <Ctx.Provider value={{ lang, setLang, t, dir }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
