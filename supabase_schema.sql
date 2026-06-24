-- ============================================
-- ENUMS & CUSTOM TYPES
-- ============================================

CREATE TYPE user_role AS ENUM ('admin', 'manager', 'employee');
CREATE TYPE pricing_type AS ENUM ('per_order', 'per_kg');
CREATE TYPE shipment_status AS ENUM ('new', 'picked_up', 'at_waseet_office', 'out_for_delivery', 'delivered', 'returned', 'failed_delivery', 'cancelled');
CREATE TYPE payment_type AS ENUM ('cod', 'delivery_fee', 'refund', 'other');

-- ============================================
-- PROFILES (Users)
-- ============================================
-- Note: Requires Supabase Auth to be enabled. user_id links to auth.users.id
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'employee',
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- CLIENTS
-- ============================================
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    phones TEXT[] NOT NULL,
    governorate TEXT NOT NULL,
    district TEXT,
    pricing_type pricing_type NOT NULL DEFAULT 'per_order',
    delivery_price NUMERIC NOT NULL DEFAULT 5000,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- WAREHOUSES
-- ============================================
CREATE TABLE public.warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    governorate TEXT,
    district TEXT,
    address TEXT,
    phone TEXT,
    features TEXT[] DEFAULT '{}',
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- SHELVES
-- ============================================
CREATE TABLE public.shelves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'created', -- 'created', 'sent', 'received_by_waseet', 'completed'
    waseet_batch_id TEXT,
    shipments_count INTEGER DEFAULT 0,
    sent_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- SHIPMENTS
-- ============================================
CREATE TABLE public.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number TEXT NOT NULL UNIQUE, -- SHL_XXX
    client_id UUID NOT NULL REFERENCES public.clients(id),
    recipient_name TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    governorate TEXT NOT NULL,
    district TEXT,
    weight NUMERIC,
    item_price NUMERIC NOT NULL DEFAULT 0,
    delivery_fee NUMERIC NOT NULL DEFAULT 5000,
    cod_amount NUMERIC NOT NULL DEFAULT 0,
    status shipment_status NOT NULL DEFAULT 'new',
    waseet_id TEXT,
    waseet_status TEXT,
    warehouse_id UUID REFERENCES public.warehouses(id),
    shelf_id UUID REFERENCES public.shelves(id),
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- SHIPMENT LOGS
-- ============================================
CREATE TABLE public.shipment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    old_status shipment_status,
    new_status shipment_status NOT NULL,
    changed_by UUID REFERENCES public.profiles(id),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- CASH BOXES
-- ============================================
CREATE TABLE public.cash_boxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'IQD', -- IQD, USD, KWD
    balance NUMERIC NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- PAYMENTS
-- ============================================
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES public.shipments(id),
    cash_box_id UUID NOT NULL REFERENCES public.cash_boxes(id),
    amount NUMERIC NOT NULL,
    type payment_type NOT NULL,
    note TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id), -- Null means system-wide
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL, -- 'shipment', 'payment', 'system', 'whatsapp'
    entity_type TEXT,
    entity_id TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- WHATSAPP LOGS
-- ============================================
CREATE TABLE public.whatsapp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_phone TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'sent', 'failed', 'pending'
    shipment_id UUID REFERENCES public.shipments(id),
    error TEXT,
    sent_at TIMESTAMPTZ
);

-- ============================================
-- ACTIVITY LOGS (Audit)
-- ============================================
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Auto update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_modtime BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shipments_modtime BEFORE UPDATE ON public.shipments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto create profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, username, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    'employee'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- RLS (Row Level Security) - Basic Setup
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- Allow read for authenticated users (Simplify for now, tighten later)
CREATE POLICY "Allow authenticated read" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON public.shipments FOR SELECT TO authenticated USING (true);

-- Allow all for admins (Example)
CREATE POLICY "Allow admin all" ON public.shipments TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);
