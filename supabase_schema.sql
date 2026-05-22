-- ==================== CLEANFLOW DATABASE SCHEMA & SEED DATA ====================
-- Salin seluruh script ini dan jalankan di SQL Editor Supabase Anda.

-- Hapus tabel lama jika ada (untuk memulai dari awal)
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS treatments CASCADE;
DROP TABLE IF EXISTS durations CASCADE;
DROP TABLE IF EXISTS cf_users CASCADE;

-- 1. TABEL PENGGUNA (cf_users)
CREATE TABLE cf_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- Di simpan dalam bentuk plain text/hash sederhana demi kemudahan demo web
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'courier', 'customer')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABEL LAYANAN LAUNDRY (services)
CREATE TABLE services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Kiloan', 'Satuan')),
    base_price NUMERIC NOT NULL
);

-- 3. TABEL METODE PERLAKUAN (treatments)
CREATE TABLE treatments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    multiplier NUMERIC NOT NULL
);

-- 4. TABEL DURASI PAKET (durations)
CREATE TABLE durations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    multiplier NUMERIC NOT NULL,
    hours INT NOT NULL
);

-- 5. TABEL ALAMAT PELANGGAN (addresses)
CREATE TABLE addresses (
    id TEXT PRIMARY KEY DEFAULT 'addr-' || gen_random_uuid(),
    user_id UUID REFERENCES cf_users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    details TEXT NOT NULL
);

-- 6. TABEL TRANSAKSI/PESANAN (orders)
CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    customer_id UUID REFERENCES cf_users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    service_id TEXT REFERENCES services(id),
    treatment_id TEXT REFERENCES treatments(id),
    duration_id TEXT REFERENCES durations(id),
    qty NUMERIC NOT NULL,
    price NUMERIC NOT NULL,
    address TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending-pickup', 'pickup-inprogress', 'washing', 'ready', 'delivering', 'completed')),
    courier_id UUID REFERENCES cf_users(id) ON DELETE SET NULL,
    notes TEXT,
    pickup_date TEXT NOT NULL,
    pickup_time TEXT NOT NULL,
    delivery_date TEXT NOT NULL,
    delivery_time TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL CHECK (payment_status IN ('paid', 'unpaid')),
    rating INT CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    date_created TIMESTAMPTZ DEFAULT now()
);

-- 7. TABEL LOGISTIK/INVENTARIS (inventory)
CREATE TABLE inventory (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    stock NUMERIC NOT NULL,
    min_stock NUMERIC NOT NULL,
    unit TEXT NOT NULL
);


-- ==================== DATA SEED (DATA AWAL) ====================

-- Input Akun Bawaan (Menggunakan Fixed UUID agar konsisten dengan relasi)
INSERT INTO cf_users (id, email, password, name, phone, role) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@cleanflow.com', 'admin123', 'Owner CleanFlow', '081198765432', 'admin'),
('22222222-2222-2222-2222-222222222222', 'riko@cleanflow.com', 'password', 'Riko (Kurir)', '082212345678', 'courier'),
('33333333-3333-3333-3333-333333333333', 'toni@cleanflow.com', 'password', 'Toni (Kurir)', '083387654321', 'courier'),
('44444444-4444-4444-4444-444444444444', 'budi@cleanflow.com', 'password', 'Budi Santoso', '08123456789', 'customer');

-- Input Layanan Laundry
INSERT INTO services (id, name, category, base_price) VALUES
('kiloan', 'Cuci Kiloan', 'Kiloan', 8000),
('jas', 'Cuci Jas / Blazer', 'Satuan', 35000),
('selimut', 'Bed Cover / Selimut', 'Satuan', 25000),
('sepatu', 'Cuci Sepatu Premium', 'Satuan', 30000),
('karpet', 'Cuci Karpet Bulu', 'Satuan', 40000),
('boneka', 'Cuci Boneka', 'Satuan', 15000);

-- Input Perlakuan
INSERT INTO treatments (id, name, multiplier) VALUES
('cuci-lipat', 'Cuci Kering Lipat', 1.0),
('cuci-setrika', 'Cuci Kering Setrika', 1.2),
('setrika', 'Setrika Saja', 0.8);

-- Input Paket Durasi
INSERT INTO durations (id, name, multiplier, hours) VALUES
('reguler', 'Reguler (2-3 Hari)', 1.0, 72),
('ekspres', 'Ekspres (24 Jam)', 1.5, 24),
('flash', 'Flash (6 Jam)', 2.0, 6);

-- Input Alamat Budi
INSERT INTO addresses (id, user_id, name, phone, details) VALUES
('addr-1', '44444444-4444-4444-4444-444444444444', 'Rumah Utama', '08123456789', 'Jl. Sudirman No. 12, Kebayoran Baru, Jakarta Selatan'),
('addr-2', '44444444-4444-4444-4444-444444444444', 'Kantor', '08123456789', 'Menara BCA Lt. 30, Menteng, Jakarta Pusat');

-- Input Inventaris Bahan Baku
INSERT INTO inventory (id, name, stock, min_stock, unit) VALUES
('inv-1', 'Deterjen Liquid Lavender', 12, 5, 'Liter'),
('inv-2', 'Pewangi Premium Sakura', 3, 5, 'Liter'), -- Low stock
('inv-3', 'Plastik Kemasan (Sedang)', 120, 50, 'Pcs'),
('inv-4', 'Label Tag Barcode', 25, 50, 'Pcs'); -- Low stock

-- Input Transaksi Awal
INSERT INTO orders (id, customer_id, customer_name, customer_phone, service_id, treatment_id, duration_id, qty, price, address, status, courier_id, notes, pickup_date, pickup_time, delivery_date, delivery_time, payment_method, payment_status, rating, review_text, date_created) VALUES
('TR-1001', '44444444-4444-4444-4444-444444444444', 'Budi Santoso', '08123456789', 'kiloan', 'cuci-setrika', 'reguler', 4.5, 43200, 'Jl. Sudirman No. 12, Kebayoran Baru, Jakarta Selatan', 'washing', '22222222-2222-2222-2222-222222222222', 'Jangan dicampur pakaian putih', '2026-05-22', '09:00 - 11:00', '2026-05-25', '14:00 - 16:00', 'cod', 'unpaid', NULL, NULL, now() - INTERVAL '3 hours'),
('TR-1002', '44444444-4444-4444-4444-444444444444', 'Budi Santoso', '08123456789', 'sepatu', 'cuci-lipat', 'ekspres', 2, 90000, 'Jl. Sudirman No. 12, Kebayoran Baru, Jakarta Selatan', 'pending-pickup', '22222222-2222-2222-2222-222222222222', 'Sepatu sneakers putih, harap hati-hati solnya', '2026-05-23', '11:00 - 13:00', '2026-05-24', '16:00 - 18:00', 'qris', 'paid', NULL, NULL, now() - INTERVAL '1 hours'),
('TR-0995', '44444444-4444-4444-4444-444444444444', 'Budi Santoso', '08123456789', 'jas', 'cuci-setrika', 'reguler', 1, 42000, 'Jl. Sudirman No. 12, Kebayoran Baru, Jakarta Selatan', 'completed', '22222222-2222-2222-2222-222222222222', 'Digantung rapi', '2026-05-18', '09:00 - 11:00', '2026-05-21', '14:00 - 16:00', 'qris', 'paid', 5, 'Sangat wangi dan cepat! Jas tidak kusut sama sekali.', now() - INTERVAL '4 days'),
('TR-0996', '44444444-4444-4444-4444-444444444444', 'Agus Pratama (Offline)', '08779876543', 'kiloan', 'cuci-lipat', 'reguler', 6.2, 49600, 'Transaksi Langsung di Outlet (Offline)', 'completed', NULL, 'Rapi dilipat', '2026-05-19', '14:00 - 16:00', '2026-05-22', '16:00 - 18:00', 'cash', 'paid', 4, 'Cukup bagus dan tepat waktu.', now() - INTERVAL '3 days'),
('TR-0997', '44444444-4444-4444-4444-444444444444', 'Budi Santoso', '08123456789', 'selimut', 'cuci-setrika', 'ekspres', 1, 45000, 'Jl. Sudirman No. 12, Kebayoran Baru, Jakarta Selatan', 'completed', '22222222-2222-2222-2222-222222222222', 'Bed cover wangi sakura', '2026-05-20', '11:00 - 13:00', '2026-05-21', '16:00 - 18:00', 'cod', 'paid', 5, 'Sprei wangi banget dan bersih noda cokelatnya hilang.', now() - INTERVAL '2 days');
