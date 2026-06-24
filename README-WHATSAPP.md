# دليل تشغيل سيرفر الواتساب (Evolution API) على الـ VPS

بما أننا قمنا ببرمجة النظام ليعمل مع `Evolution API` كخادم للواتساب ليكون **مجاني تماماً ولا يحتاج اشتراكات شهرية**، ستحتاج إلى تشغيل هذا السيرفر على استضافة VPS خاصة بك (مثل DigitalOcean أو Hetzner).

## الخطوات لتشغيل السيرفر

بعد شراء سيرفر الـ VPS والدخول إليه عبر الشاشة السوداء (SSH)، اتبع هذه الأوامر بالترتيب:

### 1. تثبيت Docker و Docker Compose
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install docker.io docker-compose -y
sudo systemctl enable docker
sudo systemctl start docker
```

### 2. إعداد مجلد Evolution API
```bash
mkdir evolution-api
cd evolution-api
```

### 3. إنشاء ملف التكوين (docker-compose.yml)
اكتب الأمر التالي:
```bash
nano docker-compose.yml
```
ثم انسخ هذا الكود والصقه داخل الملف:

```yaml
version: '3.3'

services:
  evolution-api:
    image: atendai/evolution-api:latest
    container_name: evolution-api
    restart: always
    ports:
      - "8080:8080"
    environment:
      - SERVER_URL=http://localhost:8080
      - AUTHENTICATION_TYPE=apikey
      - AUTHENTICATION_API_KEY=SUPER_SECRET_KEY_12345
      - AUTHENTICATION_EXPOSE_IN_REQ=true
    volumes:
      - ./evolution-instances:/evolution/instances
      - ./evolution-store:/evolution/store
```
*قم بتغيير `SUPER_SECRET_KEY_12345` إلى أي رقم سري تريده (هذا هو مفتاح API Key الذي ستضعه في لوحة تحكم موقعك).*
اضغط `Ctrl+X` ثم `Y` ثم `Enter` للحفظ.

### 4. تشغيل السيرفر
```bash
sudo docker-compose up -d
```

---

## كيف تربطه بلوحة تحكم موقعك؟

بعد تشغيل السيرفر بنجاح، اذهب إلى لوحة تحكم قمر الفيحاء > الإعدادات > ربط واتساب:

1. **رابط السيرفر (API URL):** اكتب `http://رقم_الأيبي_الخاص_بالسيرفر:8080` (مثال: `http://142.15.55.12:8080`).
2. **مفتاح الاتصال (API Key):** اكتب الرمز السري الذي وضعته في الملف (مثال: `SUPER_SECRET_KEY_12345`).
3. اضغط **"حفظ الإعدادات"**.
4. اضغط **"جلب الباركود الآن"**، سيظهر لك الـ QR Code الخاص بواتساب، امسحه بكاميرا هاتفك من خيار (الأجهزة المرتبطة).

انتهى! سيبدأ النظام الآن بإرسال الرسائل تلقائياً عند أي تغيير في الشحنات.
