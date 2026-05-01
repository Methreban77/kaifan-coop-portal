
## المشكلة

الـ edge function `user-roles` يُرجع 500 بشكل متقطع، مما يسبب شاشة فارغة في `/admin` ويمنع تحميل بيانات الشركاء.

## السبب الجذري

الـ function يستخدم مكتبة `postgres@3.4.5` من esm.sh للاتصال المباشر بقاعدة البيانات عبر `SUPABASE_DB_URL`. عندما تُعيد Lovable Cloud تشغيل قاعدة البيانات (كما حدث للتو)، تنقطع جلسة TLS فيتعطّل الـ event loop:

```
event loop error: TypeError: Cannot read properties of null (reading '$t')
  at __clearImmediate$ (postgres.mjs)
user-roles function failed UnexpectedEof: unexpected end of file
```

الاتصال المتعطّل يبقى cached في الـ module-level `sql` instance، فتفشل الطلبات اللاحقة أيضاً حتى يُعاد إقلاع الـ function.

بالإضافة لذلك، طلبات REST مباشرة (`/rest/v1/partner_profiles`, `/rest/v1/quotations`, إلخ) تُرجع 503 مع `PGRST001/PGRST002` بسبب انقطاع schema cache المؤقت في PostgREST بعد الـ restart.

## الحل

### 1) إعادة كتابة `supabase/functions/user-roles/index.ts`
- إزالة `postgres@3.4.5` كلياً.
- استخدام `supabase-js` مع `SUPABASE_SERVICE_ROLE_KEY` للاستعلام عن `user_roles` (يتجاوز RLS بأمان لأن الـ function يتحقق من JWT أولاً).
- عدم الاحتفاظ بأي اتصال على مستوى الـ module — كل طلب يُنشئ client جديد، فلا يبقى socket تالف.

### 2) إضافة معالجة أفضل في الواجهة
- في `src/lib/roles.ts` و `src/hooks/useUserRoles.ts`: حالياً عند فشل 500 يتم رمي خطأ `Unable to load roles`. التحسين:
  - عند 5xx: عرض رسالة "الخادم يُعيد التشغيل، حاولي مرة أخرى" بدلاً من إعادة التوجيه إلى `/unauthorized`.
  - زيادة `retry` إلى 5 مع backoff أطول للأخطاء العابرة.

### 3) (اختياري) فحص حالة Cloud
استخدام `cloud_status` للتأكد أن الـ backend عاد إلى `ACTIVE_HEALTHY` قبل التحقق النهائي.

## النتيجة المتوقعة

- اختفاء الخطأ 500 من `/functions/v1/user-roles`.
- صفحة `/admin` تُحمَّل بشكل ثابت دون شاشة فارغة.
- تبويب "الشركاء" يعرض طلب `Test Vendor Co.` المعلّق.

هل توافقين على تنفيذ هذه الخطة؟
