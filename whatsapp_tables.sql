-- جدول إعدادات الواتساب
CREATE TABLE whatsapp_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_url TEXT,              -- رابط سيرفر الـ VPS (مثل http://123.45.67.89:3001)
  api_key TEXT,              -- الرمز السري للاتصال بالـ API (نضعه في سيرفر الـ VPS)
  instance_name TEXT,        -- اسم الجلسة (مثلاً qamar_main)
  is_connected BOOLEAN DEFAULT false, -- هل الرقم متصل؟
  
  -- إعدادات القوالب (التشغيل والإطفاء)
  notify_new_shipment BOOLEAN DEFAULT true,
  notify_status_change BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إدراج صف افتراضي لضمان وجود إعدادات عند فتح الصفحة لأول مرة
INSERT INTO whatsapp_settings (instance_name, is_connected) 
VALUES ('qamar_main', false);

-- جدول سجل الرسائل (Logs)
CREATE TABLE whatsapp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL,
  recipient_phone TEXT NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending | sent | failed
  error TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
