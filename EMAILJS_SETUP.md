# إعداد EmailJS لإرسال الرسائل إلى البريد الإلكتروني

## الخطوات:

### 1. إنشاء حساب في EmailJS
- اذهب إلى [EmailJS.com](https://www.emailjs.com/)
- سجل حساب جديد (مجاني)

### 2. إضافة خدمة البريد الإلكتروني
- بعد تسجيل الدخول، اذهب إلى **Email Services**
- اختر **Add New Service**
- اختر **Gmail** (أو أي خدمة بريد أخرى)
- اتبع التعليمات لإضافة حساب Gmail الخاص بك

### 3. إنشاء قالب للانضمام كحرفي
- اذهب إلى **Email Templates**
- اضغط **Create New Template**
- استخدم القالب التالي:

**Subject:**
```
طلب انضمام جديد كحرفي
```

**Content:**
```
طلب انضمام جديد كحرفي

الاسم: {{from_name}}
الهاتف: {{from_phone}}
المهنة: {{profession}}
الموقع: {{location}}
الواتساب: {{whatsapp}}
البريد: {{email}}
الوصف: {{description}}
```

- احفظ القالب وانسخ **Template ID**

### 4. إنشاء قالب للرسائل
- أنشئ قالب جديد آخر
- استخدم القالب التالي:

**Subject:**
```
{{subject}}
```

**Content:**
```
رسالة جديدة من موقع الحرفيين

الاسم: {{from_name}}
رقم التلفون: {{from_phone}}
البريد الإلكتروني: {{from_email}}

الرسالة:
{{message}}
```

- احفظ القالب وانسخ **Template ID**

### 5. الحصول على Public Key
- اذهب إلى **Account** → **General**
- انسخ **Public Key**

### 6. تحديث الكود
افتح ملف `script.js` وحدّث القيم التالية:

```javascript
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID'; // Service ID من Email Services
const EMAILJS_TEMPLATE_ID_JOIN = 'YOUR_TEMPLATE_ID_JOIN'; // Template ID للانضمام
const EMAILJS_TEMPLATE_ID_MESSAGE = 'YOUR_TEMPLATE_ID_MESSAGE'; // Template ID للرسائل
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY'; // Public Key من Account
```

## ملاحظات:
- البريد الإلكتروني المستلم: `mahmod24yt@gmail.com` (مضبوط بالفعل)
- إذا لم تقم بإعداد EmailJS، سيتم استخدام رابط mailto كبديل
- الخدمة المجانية تسمح بـ 200 رسالة شهرياً

