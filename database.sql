-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create tables in specified order

-- users table (extends auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    phone TEXT,
    full_name TEXT,
    avatar_url TEXT,
    city TEXT,
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- addresses table
CREATE TABLE public.addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    city TEXT NOT NULL,
    street TEXT NOT NULL,
    house TEXT NOT NULL,
    apartment TEXT,
    postal_code TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- products table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    billz_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    brand TEXT,
    price NUMERIC(10,2) NOT NULL,
    sale_price NUMERIC(10,2),
    images TEXT[],
    youtube_url TEXT,
    composition TEXT,
    care TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    badges TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- product_variants table
CREATE TABLE public.product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    size TEXT NOT NULL,
    color TEXT NOT NULL,
    color_hex TEXT,
    stock INTEGER DEFAULT 0,
    billz_variant_id TEXT UNIQUE NOT NULL
);

-- orders table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    total_amount NUMERIC(10,2) NOT NULL,
    delivery_cost NUMERIC(10,2) DEFAULT 0,
    promo_code TEXT,
    discount_amount NUMERIC(10,2) DEFAULT 0,
    delivery_method TEXT,
    delivery_address JSONB,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
    kommo_lead_id TEXT,
    referral_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- order_items table
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    variant_id UUID REFERENCES public.product_variants(id),
    quantity INTEGER NOT NULL,
    price NUMERIC(10,2) NOT NULL
);

-- reviews table
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    text TEXT,
    photos TEXT[],
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- promo_codes table
CREATE TABLE public.promo_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
    discount_value NUMERIC(10,2) NOT NULL,
    min_order NUMERIC(10,2),
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- wishlist table
CREATE TABLE public.wishlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- referrals table
CREATE TABLE public.referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    balance NUMERIC(10,2) DEFAULT 0,
    total_earned NUMERIC(10,2) DEFAULT 0,
    total_withdrawn NUMERIC(10,2) DEFAULT 0
);

-- referral_transactions table
CREATE TABLE public.referral_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    referee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    order_amount NUMERIC(10,2) NOT NULL,
    commission NUMERIC(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- withdrawal_requests table
CREATE TABLE public.withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    kaspi_phone TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    admin_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- blog_posts table
CREATE TABLE public.blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT,
    preview_image TEXT,
    category TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- notifications_queue table
CREATE TABLE public.notifications_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('telegram', 'email', 'push')),
    payload JSONB,
    sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Triggers

-- Function to generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
BEGIN
    LOOP
        code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE referral_code = code);
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-creating users on auth.users insert
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, referral_code)
    VALUES (NEW.id, NEW.email, generate_referral_code());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger for auto-creating referrals on users insert
CREATE OR REPLACE FUNCTION handle_new_user_referral()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.referrals (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created
    AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user_referral();

-- Trigger for updating referral_transactions on order status change
CREATE OR REPLACE FUNCTION handle_order_delivered()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
        UPDATE public.referral_transactions
        SET status = 'approved'
        WHERE order_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_order_delivered
    AFTER UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION handle_order_delivered();

-- Function for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_queue ENABLE ROW LEVEL SECURITY;

-- users policies
CREATE POLICY "Users can read and update their own profile" ON public.users
    FOR ALL USING (auth.uid() = id);

-- addresses policies
CREATE POLICY "Users can manage their own addresses" ON public.addresses
    FOR ALL USING (auth.uid() = user_id);

-- products policies
CREATE POLICY "Anyone can read active products" ON public.products
    FOR SELECT USING (is_active = true);
CREATE POLICY "Service role can manage products" ON public.products
    FOR ALL USING (auth.role() = 'service_role');

-- product_variants policies
CREATE POLICY "Anyone can read product variants" ON public.product_variants
    FOR SELECT USING (true);
CREATE POLICY "Service role can manage product variants" ON public.product_variants
    FOR ALL USING (auth.role() = 'service_role');

-- orders policies
CREATE POLICY "Users can read and update their own orders" ON public.orders
    FOR ALL USING (auth.uid() = user_id);

-- order_items policies
CREATE POLICY "Users can read order items for their orders" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- reviews policies
CREATE POLICY "Anyone can read approved reviews" ON public.reviews
    FOR SELECT USING (is_approved = true);
CREATE POLICY "Users can create reviews for their orders" ON public.reviews
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = reviews.order_id
            AND orders.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can update their own reviews" ON public.reviews
    FOR UPDATE USING (auth.uid() = user_id);

-- promo_codes policies
CREATE POLICY "Anyone can read active promo codes" ON public.promo_codes
    FOR SELECT USING (is_active = true);
CREATE POLICY "Service role can manage promo codes" ON public.promo_codes
    FOR ALL USING (auth.role() = 'service_role');

-- wishlist policies
CREATE POLICY "Users can manage their own wishlist" ON public.wishlist
    FOR ALL USING (auth.uid() = user_id);

-- referrals policies
CREATE POLICY "Users can read their own referral data" ON public.referrals
    FOR ALL USING (auth.uid() = user_id);

-- referral_transactions policies
CREATE POLICY "Users can read their own referral transactions" ON public.referral_transactions
    FOR SELECT USING (auth.uid() = referrer_id);

-- withdrawal_requests policies
CREATE POLICY "Users can manage their own withdrawal requests" ON public.withdrawal_requests
    FOR ALL USING (auth.uid() = user_id);

-- blog_posts policies
CREATE POLICY "Anyone can read published blog posts" ON public.blog_posts
    FOR SELECT USING (is_published = true);
CREATE POLICY "Service role can manage blog posts" ON public.blog_posts
    FOR ALL USING (auth.role() = 'service_role');

-- notifications_queue policies
CREATE POLICY "Service role can manage notifications" ON public.notifications_queue
    FOR ALL USING (auth.role() = 'service_role');

-- Indexes

-- products indexes
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_brand ON public.products(brand);
CREATE INDEX idx_products_is_active ON public.products(is_active);

-- product_variants indexes
CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX idx_product_variants_stock ON public.product_variants(stock);

-- orders indexes
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);

-- referral_transactions indexes
CREATE INDEX idx_referral_transactions_referrer_id ON public.referral_transactions(referrer_id);
CREATE INDEX idx_referral_transactions_status ON public.referral_transactions(status);

-- blog_posts indexes
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_is_published ON public.blog_posts(is_published);

-- Storage buckets

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('product-images', 'product-images', true),
    ('review-photos', 'review-photos', true),
    ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (assuming storage extension is enabled)
-- For product-images
CREATE POLICY "Anyone can view product images" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Service role can manage product images" ON storage.objects
    FOR ALL USING (bucket_id = 'product-images' AND auth.role() = 'service_role');

-- For review-photos
CREATE POLICY "Anyone can view review photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'review-photos');

CREATE POLICY "Authenticated users can upload review photos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'review-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own review photos" ON storage.objects
    FOR UPDATE USING (bucket_id = 'review-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Service role can manage review photos" ON storage.objects
    FOR ALL USING (bucket_id = 'review-photos' AND auth.role() = 'service_role');

-- For avatars
CREATE POLICY "Anyone can view avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own avatars" ON storage.objects
    FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Service role can manage avatars" ON storage.objects
    FOR ALL USING (bucket_id = 'avatars' AND auth.role() = 'service_role');