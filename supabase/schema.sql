-- ==============================================================================
-- BASE DE DATOS SUPABASE - ROSQUETES CANARIOS (MARACAY / ARAGUA)
-- Esquema completo de tablas, índices, políticas RLS y datos iniciales (Seed Data).
-- ==============================================================================

-- 1. HABILITAR EXTENSIONES NECESARIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA DE SUPER ADMINISTRADORES
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- PIN / Contraseña de acceso (ej. admin2026)
    role VARCHAR(50) DEFAULT 'super_admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- 3. TABLA DE CONFIGURACIÓN DE TIENDA Y BRANDING
CREATE TABLE IF NOT EXISTS store_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'main',
    store_name VARCHAR(255) NOT NULL DEFAULT 'Rosquetes Canarios',
    store_badge VARCHAR(100) DEFAULT 'Don Rosquetico',
    store_tagline TEXT DEFAULT 'Tradición Artesanal Canario-Aragüeña en Maracay y todo Aragua',
    store_logo_type VARCHAR(20) DEFAULT 'emoji', -- 'emoji' o 'image'
    store_logo_value TEXT DEFAULT '🍩',
    store_address TEXT DEFAULT 'Calle San Miguel, Local #4, Sector Base Aragua, Maracay, Edo. Aragua',
    exchange_rate_ves NUMERIC(10, 2) NOT NULL DEFAULT 36.50,
    dispatch_mode VARCHAR(20) NOT NULL DEFAULT 'both', -- 'whatsapp', 'email', 'both'
    whatsapp_number VARCHAR(50) NOT NULL DEFAULT '584125558822',
    email_recipient VARCHAR(255) NOT NULL DEFAULT 'pedidos.rosquetes@gmail.com',
    whatsapp_message_template TEXT,
    pago_movil_bank VARCHAR(100) DEFAULT '0108 - Banco Provincial',
    pago_movil_rif VARCHAR(50) DEFAULT 'J-501234567',
    pago_movil_phone VARCHAR(50) DEFAULT '04125558822',
    pago_movil_owner VARCHAR(255) DEFAULT 'Rosquetes Canarios C.A.',
    online_payments_enabled BOOLEAN DEFAULT TRUE,
    auto_verify_online_payments BOOLEAN DEFAULT TRUE,
    payment_methods JSONB NOT NULL DEFAULT '[]'::jsonb,
    delivery_zones JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABLA DE CATÁLOGO DE PRODUCTOS Y INVENTARIO ELABORADO
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_usd NUMERIC(10, 2) NOT NULL,
    unit_type VARCHAR(100) NOT NULL, -- ej. "Docena (12 u.)", "Bolsa 250g"
    image TEXT NOT NULL,
    stock_elaborado INT NOT NULL DEFAULT 0,
    category VARCHAR(50) NOT NULL DEFAULT 'tradicional', -- 'tradicional', 'mini', 'regalo', 'especial'
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABLA DE INVENTARIO DE INGREDIENTES Y MATERIA PRIMA
CREATE TABLE IF NOT EXISTS ingredients (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'harina', 'azucar', 'especias', 'liquidos', 'empaque', 'otros'
    stock_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    unit VARCHAR(20) NOT NULL, -- 'kg', 'g', 'litros', 'unidades'
    min_alert_threshold NUMERIC(10, 2) NOT NULL DEFAULT 5,
    cost_per_unit_usd NUMERIC(10, 2) NOT NULL DEFAULT 0,
    last_restocked TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. TABLA DE CLIENTES Y CRM DE VENTAS
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    city VARCHAR(100) DEFAULT 'Maracay',
    address TEXT,
    favorite_product VARCHAR(255),
    total_orders INT DEFAULT 0,
    total_spent_usd NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- 7. TABLA DE PEDIDOS Y VENTAS REGISTRADAS
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(100) PRIMARY KEY,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_email VARCHAR(255),
    delivery_zone VARCHAR(100) NOT NULL,
    delivery_city VARCHAR(100) NOT NULL,
    address_detail TEXT NOT NULL,
    delivery_fee_usd NUMERIC(10, 2) NOT NULL DEFAULT 0,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_usd NUMERIC(10, 2) NOT NULL,
    exchange_rate_ves NUMERIC(10, 2) NOT NULL,
    total_ves NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_reference VARCHAR(100),
    payment_verified BOOLEAN DEFAULT FALSE,
    paid_online BOOLEAN DEFAULT FALSE,
    payment_details JSONB,
    status VARCHAR(50) NOT NULL DEFAULT 'pendiente', -- 'pendiente', 'confirmado', 'en_preparacion', 'listo', 'entregado', 'cancelado'
    dispatch_method_used VARCHAR(20) NOT NULL DEFAULT 'whatsapp',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. TABLA DE LOTES DE PRODUCCIÓN
CREATE TABLE IF NOT EXISTS production_batches (
    id VARCHAR(100) PRIMARY KEY,
    batch_number VARCHAR(100) NOT NULL,
    product_id VARCHAR(100) REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    units_produced INT NOT NULL,
    cost_total_usd NUMERIC(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- POLÍTICAS DE SEGURIDAD ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_batches ENABLE ROW LEVEL SECURITY;

-- Permite lectura pública a catálogos y configuración de tienda
CREATE POLICY "Public Read Store Settings" ON store_settings FOR SELECT USING (true);
CREATE POLICY "Public Read Products" ON products FOR SELECT USING (true);
CREATE POLICY "Public Create Orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Public Update Orders" ON orders FOR UPDATE USING (true);

-- Permite acceso total para clientes autenticados / administradores
CREATE POLICY "Admin Full Access Settings" ON store_settings FOR ALL USING (true);
CREATE POLICY "Admin Full Access Products" ON products FOR ALL USING (true);
CREATE POLICY "Admin Full Access Ingredients" ON ingredients FOR ALL USING (true);
CREATE POLICY "Admin Full Access Customers" ON customers FOR ALL USING (true);
CREATE POLICY "Admin Full Access Admin Users" ON admin_users FOR ALL USING (true);
CREATE POLICY "Admin Full Access Batches" ON production_batches FOR ALL USING (true);

-- ==============================================================================
-- DATOS INICIALES (SEED DATA)
-- ==============================================================================

-- 1. SUPER ADMINISTRADOR PREDETERMINADO
INSERT INTO admin_users (full_name, email, password_hash, role)
VALUES ('Super Administrador Rosquetes', 'admin@rosquetes.com', 'admin2026', 'super_admin')
ON CONFLICT (email) DO UPDATE SET password_hash = 'admin2026';

-- 2. CONFIGURACIÓN PRINCIPAL DE LA TIENDA Y MARCA
INSERT INTO store_settings (
    id, store_name, store_badge, store_tagline, store_logo_type, store_logo_value,
    store_address, exchange_rate_ves, dispatch_mode, whatsapp_number, email_recipient
) VALUES (
    'main',
    'Rosquetes Canarios',
    'Don Rosquetico',
    'Tradición Artesanal Canario-Aragüeña en Maracay y todo Aragua',
    'emoji',
    '🍩',
    'Calle San Miguel, Local #4, Sector Base Aragua, Maracay, Edo. Aragua',
    36.50,
    'both',
    '584125558822',
    'pedidos.rosquetes@gmail.com'
) ON CONFLICT (id) DO NOTHING;

-- 3. PRODUCTOS DEL CATÁLOGO INICIAL
INSERT INTO products (id, name, description, price_usd, unit_type, image, stock_elaborado, category, featured)
VALUES
('rosquete-glaseado-docena', 'Rosquetes Canarios Glaseados', 'Rosquetes horneados esponjosos recubiertos de un dulce glaseado blanco artesanal.', 8.50, 'Docena (12 u.)', '/images/rosquetes_hero_1786559273650.jpg', 42, 'tradicional', true),
('rosquete-limon-anis-docena', 'Rosquetes de Limón y Matalahúva (Anís)', 'Receta tradicional canaria infusionada con ralladura de limón verde aragüeño y matalahúva pura.', 9.00, 'Docena (12 u.)', '/images/rosquetes_product_1786559285375.jpg', 30, 'tradicional', true),
('mini-rosqueticos-bolsa', 'Mini Rosqueticos Crocantes (Bolsa 250g)', 'Bocaditos crujientes ideales para acompañar con café matutino o merienda familiar.', 4.50, 'Bolsa 250g', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800&auto=format&fit=crop', 60, 'mini', false),
('caja-regalo-canaria', 'Caja Regalo "Recuerdo Canario-Aragüeño"', 'Hermosa presentación tipo regalo con 18 rosquetes surtidos y moño artesanal de yute.', 15.00, 'Caja Especial 18 u.', 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?q=80&w=800&auto=format&fit=crop', 15, 'regalo', true)
ON CONFLICT (id) DO NOTHING;

-- 4. INGREDIENTES INICIALES DE INVENTARIO
INSERT INTO ingredients (id, name, category, stock_amount, unit, min_alert_threshold, cost_per_unit_usd)
VALUES
('harina-trigo-todo-uso', 'Harina de Trigo Todo Uso (Saco 45kg)', 'harina', 12.0, 'sacos', 3.0, 32.00),
('azucar-refinada', 'Azúcar Refinada (Saco 50kg)', 'azucar', 8.5, 'sacos', 2.0, 42.00),
('matalahuva-anis', 'Semillas de Matalahúva / Anís Dulce', 'especias', 4.2, 'kg', 1.0, 15.00),
('huevos-frescos', 'Cartón de Huevos Frescos (30 u.)', 'liquidos', 25.0, 'cartones', 5.0, 4.50),
('aceite-vegetal', 'Aceite Vegetal de Maíz (Caja 12L)', 'liquidos', 6.0, 'cajas', 2.0, 28.00),
('limon-fresco', 'Limones Verdes de Huerta (Malla 5kg)', 'especias', 10.0, 'mallas', 3.0, 3.50)
ON CONFLICT (id) DO NOTHING;

-- Mensaje de confirmación en la consola
SELECT 'Base de datos de Rosquetes Canarios configurada exitosamente para Supabase' AS status;

-- ==============================================================================
-- MIGRACIÓN: Columnas adicionales (ejecutar si la tabla ya existía)
-- Estas sentencias son seguras (IF NOT EXISTS) y puedes ejecutarlas siempre.
-- ==============================================================================
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS admin_username VARCHAR(100) DEFAULT 'admin';
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS admin_password VARCHAR(255) DEFAULT 'admin2026';
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS last_bcv_sync_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS auto_sync_bcv_rate BOOLEAN DEFAULT TRUE;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS hero_image_url TEXT;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS feature_cards JSONB DEFAULT '[]'::jsonb;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS zelle_email VARCHAR(255);
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS zelle_owner VARCHAR(255);
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS hero_badge_text VARCHAR(255);
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS hero_star_title VARCHAR(255);
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS hero_star_price_usd NUMERIC(10,2) DEFAULT 4.50;

SELECT 'Migración completada' AS status;

