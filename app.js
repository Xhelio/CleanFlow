// CleanFlow Laundry - Core Engine (Supabase with Dual-Database Fallback Mode)

import { createClient } from '@supabase/supabase-js';

// ==================== 1. DATABASE CONNECTION INITIALIZATION ====================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
let supabaseActive = false;

// Seed Data Fallback Constants
const DEFAULT_SERVICES = [
    { id: "kiloan", name: "Cuci Kiloan", category: "Kiloan", basePrice: 8000 },
    { id: "jas", name: "Cuci Jas / Blazer", category: "Satuan", basePrice: 35000 },
    { id: "selimut", name: "Bed Cover / Selimut", category: "Satuan", basePrice: 25000 },
    { id: "sepatu", name: "Cuci Sepatu Premium", category: "Satuan", basePrice: 30000 },
    { id: "karpet", name: "Cuci Karpet Bulu", category: "Satuan", basePrice: 40000 },
    { id: "boneka", name: "Cuci Boneka", category: "Satuan", basePrice: 15000 }
];
const DEFAULT_TREATMENTS = [
    { id: "cuci-lipat", name: "Cuci Kering Lipat", multiplier: 1.0 },
    { id: "cuci-setrika", name: "Cuci Kering Setrika", multiplier: 1.2 },
    { id: "setrika", name: "Setrika Saja", multiplier: 0.8 }
];
const DEFAULT_DURATIONS = [
    { id: "reguler", name: "Reguler (2-3 Hari)", multiplier: 1.0, hours: 72 },
    { id: "ekspres", name: "Ekspres (24 Jam)", multiplier: 1.5, hours: 24 },
    { id: "flash", name: "Flash (6 Jam)", multiplier: 2.0, hours: 6 }
];
const DEFAULT_ADDRESSES = [
    { id: "addr-1", user_id: "44444444-4444-4444-4444-444444444444", name: "Rumah Utama", details: "Jl. Sudirman No. 12, Kebayoran Baru, Jakarta Selatan", phone: "08123456789" },
    { id: "addr-2", user_id: "44444444-4444-4444-4444-444444444444", name: "Kantor", details: "Menara BCA Lt. 30, Menteng, Jakarta Pusat", phone: "08123456789" }
];
const DEFAULT_COURIERS = [
    { id: "22222222-2222-2222-2222-222222222222", name: "Riko", area: "Jakarta Selatan", role: "courier" },
    { id: "33333333-3333-3333-3333-333333333333", name: "Toni", area: "Jakarta Pusat", role: "courier" }
];
const DEFAULT_INVENTORY = [
    { id: "inv-1", name: "Deterjen Liquid Lavender", stock: 12, min_stock: 5, unit: "Liter" },
    { id: "inv-2", name: "Pewangi Premium Sakura", stock: 3, min_stock: 5, unit: "Liter" },
    { id: "inv-3", name: "Plastik Kemasan (Sedang)", stock: 120, min_stock: 50, unit: "Pcs" },
    { id: "inv-4", name: "Label Tag Barcode", stock: 25, min_stock: 50, unit: "Pcs" }
];
const DEFAULT_USERS = [
    { id: "11111111-1111-1111-1111-111111111111", email: "admin@cleanflow.com", password: "admin123", name: "Owner CleanFlow", phone: "081198765432", role: "admin" },
    { id: "22222222-2222-2222-2222-222222222222", email: "riko@cleanflow.com", password: "password", name: "Riko (Kurir)", phone: "082212345678", role: "courier" },
    { id: "33333333-3333-3333-3333-333333333333", email: "toni@cleanflow.com", password: "password", name: "Toni (Kurir)", phone: "083387654321", role: "courier" },
    { id: "44444444-4444-4444-4444-444444444444", email: "budi@cleanflow.com", password: "password", name: "Budi Santoso", phone: "08123456789", role: "customer" }
];
const DEFAULT_ORDERS = [
    { id: "TR-1001", customer_id: "44444444-4444-4444-4444-444444444444", customer_name: "Budi Santoso", customer_phone: "08123456789", service_id: "kiloan", treatment_id: "cuci-setrika", duration_id: "reguler", qty: 4.5, price: 43200, address: "Jl. Sudirman No. 12, Kebayoran Baru, Jakarta Selatan", status: "washing", courier_id: "22222222-2222-2222-2222-222222222222", notes: "Jangan dicampur pakaian putih", pickup_date: "2026-05-22", pickup_time: "09:00 - 11:00", delivery_date: "2026-05-25", delivery_time: "14:00 - 16:00", payment_method: "cod", payment_status: "unpaid", rating: null, review_text: null, date_created: new Date(Date.now() - 3600000 * 3).toISOString() },
    { id: "TR-1002", customer_id: "44444444-4444-4444-4444-444444444444", customer_name: "Budi Santoso", customer_phone: "08123456789", service_id: "sepatu", treatment_id: "cuci-lipat", duration_id: "ekspres", qty: 2, price: 90000, address: "Jl. Sudirman No. 12, Kebayoran Baru, Jakarta Selatan", status: "pending-pickup", courier_id: "22222222-2222-2222-2222-222222222222", notes: "Sepatu sneakers putih, harap hati-hati solnya", pickup_date: "2026-05-23", pickup_time: "11:00 - 13:00", delivery_date: "2026-05-24", delivery_time: "16:00 - 18:00", payment_method: "qris", payment_status: "paid", rating: null, review_text: null, date_created: new Date(Date.now() - 3600000).toISOString() },
    { id: "TR-0995", customer_id: "44444444-4444-4444-4444-444444444444", customer_name: "Budi Santoso", customer_phone: "08123456789", service_id: "jas", treatment_id: "cuci-setrika", duration_id: "reguler", qty: 1, price: 42000, address: "Jl. Sudirman No. 12, Kebayoran Baru, Jakarta Selatan", status: "completed", courier_id: "22222222-2222-2222-2222-222222222222", notes: "Digantung rapi", pickup_date: "2026-05-18", pickup_time: "09:00 - 11:00", delivery_date: "2026-05-21", delivery_time: "14:00 - 16:00", payment_method: "qris", payment_status: "paid", rating: 5, review_text: "Sangat wangi dan cepat! Jas tidak kusut sama sekali.", date_created: new Date(Date.now() - 3600000 * 24 * 4).toISOString() },
    { id: "TR-0996", customer_id: null, customer_name: "Agus Pratama", customer_phone: "08779876543", service_id: "kiloan", treatment_id: "cuci-lipat", duration_id: "reguler", qty: 6.2, price: 49600, address: "Transaksi Langsung di Outlet (Offline)", status: "completed", courier_id: null, notes: "Rapi dilipat", pickup_date: "2026-05-19", pickup_time: "14:00 - 16:00", delivery_date: "2026-05-22", delivery_time: "16:00 - 18:00", payment_method: "cash", payment_status: "paid", rating: 4, review_text: "Cukup bagus dan tepat waktu.", date_created: new Date(Date.now() - 3600000 * 24 * 3).toISOString() },
    { id: "TR-0997", customer_id: "44444444-4444-4444-4444-444444444444", customer_name: "Budi Santoso", customer_phone: "08123456789", service_id: "selimut", treatment_id: "cuci-setrika", duration_id: "ekspres", qty: 1, price: 45000, address: "Jl. Sudirman No. 12, Kebayoran Baru, Jakarta Selatan", status: "completed", courier_id: "22222222-2222-2222-2222-222222222222", notes: "Bed cover wangi sakura", pickup_date: "2026-05-20", pickup_time: "11:00 - 13:00", delivery_date: "2026-05-21", delivery_time: "16:00 - 18:00", payment_method: "cod", payment_status: "paid", rating: 5, review_text: "Sprei wangi banget dan bersih noda cokelatnya hilang.", date_created: new Date(Date.now() - 3600000 * 24 * 2).toISOString() }
];

// Check credential values to decide mode
if (supabaseUrl && supabaseUrl.indexOf("your-project-id") === -1 && supabaseAnonKey && supabaseAnonKey.indexOf("your-supabase-anon-key") === -1) {
    try {
        supabase = createClient(supabaseUrl, supabaseAnonKey);
        supabaseActive = true;
    } catch (e) {
        console.warn("Supabase failed to initialize, falling back to LocalStorage:", e);
    }
}

// Global visual connection feedback
function updateConnectionBadge() {
    const badge = document.getElementById("db-status-badge");
    if (supabaseActive) {
        badge.className = "db-status-badge connected";
        badge.innerHTML = `<i class="fa-solid fa-database"></i> Supabase Terkoneksi (Real Database)`;
    } else {
        badge.className = "db-status-badge disconnected";
        badge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Supabase Terputus (Mode LocalStorage)`;
    }
}

// LocalStorage Database Seeder if Supabase is offline
function checkLocalStorageSeed() {
    if (!supabaseActive && !localStorage.getItem("cf_local_db_seeded")) {
        localStorage.setItem("cf_services", JSON.stringify(DEFAULT_SERVICES));
        localStorage.setItem("cf_treatments", JSON.stringify(DEFAULT_TREATMENTS));
        localStorage.setItem("cf_durations", JSON.stringify(DEFAULT_DURATIONS));
        localStorage.setItem("cf_addresses", JSON.stringify(DEFAULT_ADDRESSES));
        localStorage.setItem("cf_couriers", JSON.stringify(DEFAULT_COURIERS));
        localStorage.setItem("cf_inventory", JSON.stringify(DEFAULT_INVENTORY));
        localStorage.setItem("cf_users", JSON.stringify(DEFAULT_USERS));
        localStorage.setItem("cf_orders", JSON.stringify(DEFAULT_ORDERS));
        localStorage.setItem("cf_local_db_seeded", "true");
    }
}

// ==================== 2. DUAL-MODE REUSABLE CONTROLLER WRAPPERS ====================

// Fetch generic listings
async function getCollection(table, fallbackKey) {
    if (supabaseActive) {
        const { data, error } = await supabase.from(table).select('*');
        if (!error) return data;
        console.error(`Error loading from Supabase table ${table}:`, error);
    }
    return JSON.parse(localStorage.getItem(fallbackKey)) || [];
}

// Update generic listings
async function saveCollection(table, fallbackKey, data) {
    if (supabaseActive) {
        // In real mode, individual insert/update functions are used, 
        // this is a fallback helper for simpler tables.
        console.warn(`Direct saveCollection called on ${table}. Ensure individual endpoints are implemented.`);
    }
    localStorage.setItem(fallbackKey, JSON.stringify(data));
}

// Specific wrappers mapped to Supabase columns (camelCase local -> snake_case supabase)
async function fetchServices() { return await getCollection('services', 'cf_services'); }
async function fetchTreatments() { return await getCollection('treatments', 'cf_treatments'); }
async function fetchDurations() { return await getCollection('durations', 'cf_durations'); }

async function fetchAddresses(userId) {
    if (supabaseActive) {
        const { data, error } = await supabase.from('addresses').select('*').eq('user_id', userId);
        if (!error) return data.map(d => ({ id: d.id, user_id: d.user_id, name: d.name, phone: d.phone, details: d.details }));
    }
    const local = JSON.parse(localStorage.getItem('cf_addresses')) || [];
    return local.filter(a => a.user_id === userId);
}

async function fetchInventory() { 
    if (supabaseActive) {
        const { data, error } = await supabase.from('inventory').select('*');
        if (!error) return data;
    }
    return JSON.parse(localStorage.getItem('cf_inventory')) || [];
}

async function fetchCouriers() {
    if (supabaseActive) {
        const { data, error } = await supabase.from('cf_users').select('*').eq('role', 'courier');
        if (!error) return data;
    }
    const local = JSON.parse(localStorage.getItem('cf_users')) || [];
    return local.filter(u => u.role === 'courier');
}

async function fetchOrders() {
    if (supabaseActive) {
        const { data, error } = await supabase.from('orders').select('*');
        if (!error) {
            // Map snake_case to camelCase for UI compatibility
            return data.map(o => ({
                id: o.id,
                customerName: o.customer_name,
                customerPhone: o.customer_phone,
                serviceId: o.service_id,
                treatmentId: o.treatment_id,
                durationId: o.duration_id,
                qty: parseFloat(o.qty),
                price: parseFloat(o.price),
                address: o.address,
                status: o.status,
                courierId: o.courier_id,
                notes: o.notes,
                pickupDate: o.pickup_date,
                pickupTime: o.pickup_time,
                deliveryDate: o.delivery_date,
                deliveryTime: o.delivery_time,
                paymentMethod: o.payment_method,
                paymentStatus: o.payment_status,
                rating: o.rating,
                reviewText: o.review_text,
                dateCreated: o.date_created,
                customer_id: o.customer_id
            }));
        }
    }
    return JSON.parse(localStorage.getItem('cf_orders')) || [];
}

// Insert address wrapper
async function insertAddress(addr) {
    if (supabaseActive) {
        const { error } = await supabase.from('addresses').insert([{
            user_id: addr.user_id,
            name: addr.name,
            phone: addr.phone,
            details: addr.details
        }]);
        if (!error) return true;
        console.error("Supabase insertAddress error:", error);
    }
    const local = JSON.parse(localStorage.getItem('cf_addresses')) || [];
    local.push(addr);
    localStorage.setItem('cf_addresses', JSON.stringify(local));
    return true;
}

// Insert order wrapper
async function insertOrder(order) {
    if (supabaseActive) {
        const { error } = await supabase.from('orders').insert([{
            id: order.id,
            customer_id: order.customer_id,
            customer_name: order.customerName,
            customer_phone: order.customerPhone,
            service_id: order.serviceId,
            treatment_id: order.treatmentId,
            duration_id: order.durationId,
            qty: order.qty,
            price: order.price,
            address: order.address,
            status: order.status,
            courier_id: order.courierId,
            notes: order.notes,
            pickup_date: order.pickupDate,
            pickup_time: order.pickupTime,
            delivery_date: order.deliveryDate,
            delivery_time: order.deliveryTime,
            payment_method: order.paymentMethod,
            payment_status: order.paymentStatus
        }]);
        if (!error) return true;
        console.error("Supabase insertOrder error:", error);
    }
    const local = JSON.parse(localStorage.getItem('cf_orders')) || [];
    local.push(order);
    localStorage.setItem('cf_orders', JSON.stringify(local));
    return true;
}

// Update order status wrapper
async function updateOrderFields(orderId, fields) {
    if (supabaseActive) {
        const mapped = {};
        if (fields.status !== undefined) mapped.status = fields.status;
        if (fields.courierId !== undefined) mapped.courier_id = fields.courierId;
        if (fields.qty !== undefined) mapped.qty = fields.qty;
        if (fields.price !== undefined) mapped.price = fields.price;
        if (fields.paymentStatus !== undefined) mapped.payment_status = fields.paymentStatus;
        if (fields.rating !== undefined) mapped.rating = fields.rating;
        if (fields.reviewText !== undefined) mapped.review_text = fields.reviewText;

        const { error } = await supabase.from('orders').update(mapped).eq('id', orderId);
        if (!error) return true;
        console.error("Supabase updateOrderFields error:", error);
    }
    const local = JSON.parse(localStorage.getItem('cf_orders')) || [];
    const idx = local.findIndex(o => o.id === orderId);
    if (idx !== -1) {
        local[idx] = { ...local[idx], ...fields };
        localStorage.setItem('cf_orders', JSON.stringify(local));
    }
    return true;
}

// Restock inventory wrapper
async function updateInventoryStock(itemId, newStock) {
    if (supabaseActive) {
        const { error } = await supabase.from('inventory').update({ stock: newStock }).eq('id', itemId);
        if (!error) return true;
    }
    const local = JSON.parse(localStorage.getItem('cf_inventory')) || [];
    const idx = local.findIndex(i => i.id === itemId);
    if (idx !== -1) {
        local[idx].stock = newStock;
        localStorage.setItem('cf_inventory', JSON.stringify(local));
    }
    return true;
}

// Add Service wrapper
async function insertService(service) {
    if (supabaseActive) {
        const { error } = await supabase.from('services').insert([{
            id: service.id,
            name: service.name,
            category: service.category,
            base_price: service.basePrice
        }]);
        if (!error) return true;
    }
    const local = JSON.parse(localStorage.getItem('cf_services')) || [];
    local.push(service);
    localStorage.setItem('cf_services', JSON.stringify(local));
    return true;
}

// Delete Service wrapper
async function deleteServiceFromDB(sid) {
    if (supabaseActive) {
        const { error } = await supabase.from('services').delete().eq('id', sid);
        if (!error) return true;
    }
    let local = JSON.parse(localStorage.getItem('cf_services')) || [];
    local = local.filter(s => s.id !== sid);
    localStorage.setItem('cf_services', JSON.stringify(local));
    return true;
}

// ==================== 3. USER AUTHENTICATION & SESSION FLOW ====================
let sessionUser = null;

// Authenticate logging in users
async function loginUser(email, password) {
    if (supabaseActive) {
        const { data, error } = await supabase.from('cf_users').select('*').eq('email', email).eq('password', password);
        if (!error && data.length > 0) {
            saveSession(data[0]);
            return { success: true, user: data[0] };
        }
    } else {
        const local = JSON.parse(localStorage.getItem('cf_users')) || [];
        const found = local.find(u => u.email === email && u.password === password);
        if (found) {
            saveSession(found);
            return { success: true, user: found };
        }
    }
    return { success: false, msg: "Email atau password salah!" };
}

// Register new customer account
async function registerUser(name, email, phone, password) {
    const newUser = {
        id: supabaseActive ? undefined : 'cust-' + Math.random().toString(36).substring(2, 9),
        email: email,
        password: password,
        name: name,
        phone: phone,
        role: 'customer'
    };

    if (supabaseActive) {
        // Check if email exists
        const { data: check } = await supabase.from('cf_users').select('id').eq('email', email);
        if (check && check.length > 0) {
            return { success: false, msg: "Email sudah terdaftar!" };
        }
        const { data, error } = await supabase.from('cf_users').insert([{
            email, password, name, phone, role: 'customer'
        }]).select();
        
        if (!error && data.length > 0) {
            saveSession(data[0]);
            return { success: true, user: data[0] };
        }
        return { success: false, msg: error.message };
    } else {
        const local = JSON.parse(localStorage.getItem('cf_users')) || [];
        const check = local.find(u => u.email === email);
        if (check) {
            return { success: false, msg: "Email sudah terdaftar!" };
        }
        local.push(newUser);
        localStorage.setItem('cf_users', JSON.stringify(local));
        saveSession(newUser);
        return { success: true, user: newUser };
    }
}

function saveSession(user) {
    sessionUser = user;
    localStorage.setItem("cf_session", JSON.stringify(user));
}

function checkActiveSession() {
    const cached = localStorage.getItem("cf_session");
    if (cached) {
        sessionUser = JSON.parse(cached);
    } else {
        sessionUser = null;
    }
    renderHeaderAuth();
}

function logoutUser() {
    sessionUser = null;
    localStorage.removeItem("cf_session");
    renderHeaderAuth();
    switchView("landing");
}

// Render dynamic authentication elements on header
function renderHeaderAuth() {
    const container = document.getElementById("nav-auth-container");
    if (sessionUser) {
        let roleBadgeStr = "Pelanggan";
        if (sessionUser.role === 'admin') roleBadgeStr = "Admin";
        if (sessionUser.role === 'courier') roleBadgeStr = "Kurir";

        container.innerHTML = `
            <div style="font-size:0.85rem; display:flex; flex-direction:column; align-items:flex-end;">
                <strong>${sessionUser.name}</strong>
                <span style="font-size:0.75rem; color:var(--primary); font-weight:600;">(${roleBadgeStr})</span>
            </div>
            <button class="btn btn-outline btn-sm" onclick="logoutUser()" style="padding:6px 12px; font-size:0.8rem;">
                <i class="fa-solid fa-right-from-bracket"></i> Keluar
            </button>
        `;
    } else {
        container.innerHTML = `
            <button class="btn btn-outline" onclick="switchView('login')" style="padding:8px 16px; font-size:0.9rem;">
                <i class="fa-solid fa-right-to-bracket"></i> Masuk / Daftar
            </button>
        `;
    }
}

// Protected route checks
function tryNavigateToRole(role, targetSubTab) {
    if (!sessionUser) {
        // Save redirection path in temp state
        window.cf_redirect_after_login = { role, subTab: targetSubTab };
        switchView("login");
        return;
    }

    if (sessionUser.role !== role) {
        alert(`Akses Ditolak! Anda masuk sebagai ${sessionUser.role}, tidak bisa mengakses halaman ${role}. Silakan logout terlebih dahulu.`);
        return;
    }

    switchView(role, targetSubTab);
}

// Universal tab switcher (views)
function switchView(viewId, targetSub) {
    // Hide all view panes
    document.querySelectorAll(".view-section").forEach(sec => sec.classList.remove("active"));
    
    // Toggle active
    const targetEl = document.getElementById(`${viewId}-view`);
    if (targetEl) {
        targetEl.classList.add("active");
    }

    // Secondary sub tab adjustments
    if (viewId === "customer") {
        renderCustomerProfileData();
        if (targetSub === "booking") {
            switchCustTab("cust-booking", document.querySelector('[onclick*="cust-booking"]'));
            initBookingWizard();
        } else {
            switchCustTab("cust-dashboard", document.querySelector('[onclick*="cust-dashboard"]'));
        }
    } else if (viewId === "admin") {
        switchAdminTab("admin-dashboard", document.querySelector('[onclick*="admin-dashboard"]'));
    } else if (viewId === "courier") {
        toggleCourierTasks('active');
    }
}

// Populate customer layout profile details
function renderCustomerProfileData() {
    if (!sessionUser) return;
    document.getElementById("cust-avatar-char").innerText = sessionUser.name.charAt(0).toUpperCase();
    document.getElementById("cust-profile-name").innerText = sessionUser.name;
    document.getElementById("cust-profile-label").innerHTML = `<i class="fa-solid fa-gem" style="color: gold;"></i> ${sessionUser.role.toUpperCase()} Member`;
}

// ==================== 4. INTEGRATED FRONTEND LOGIC (MAPPED TO SUPABASE) ====================
let currentCustomerTab = "cust-dashboard";
let currentAdminTab = "admin-dashboard";
let bookingWizardStep = 1;
let selectedBookingPayment = "cod";
let selectedCouponCode = null;

// Re-render dashboard components
async function refreshDashboardViews() {
    renderHeaderAuth();
    updateConnectionBadge();
    
    // Call async loads
    if (sessionUser) {
        if (sessionUser.role === 'customer') {
            await renderCustomerActiveOrders();
            await renderCustomerHistory();
            await renderAddressesSelection();
        } else if (sessionUser.role === 'admin') {
            await renderAdminOrders();
            await renderAdminServices();
            await renderAdminCRM();
            await renderAdminInventory();
            await renderAdminQueue();
            await drawRevenueChart();
        } else if (sessionUser.role === 'courier') {
            await renderCourierTasks();
        }
    }
}

// Switch Customer tab
window.switchCustTab = function(tabId, btnEl) {
    currentCustomerTab = tabId;
    const sidebar = btnEl ? btnEl.parentElement : null;
    if (sidebar) {
        sidebar.querySelectorAll(".sidebar-link").forEach(btn => btn.classList.remove("active"));
        btnEl.classList.add("active");
    }
    document.querySelectorAll(".cust-dashboard-section").forEach(sec => sec.classList.remove("active"));
    document.getElementById(tabId).classList.add("active");
};

// Switch Admin tab
window.switchAdminTab = function(tabId, btnEl) {
    currentAdminTab = tabId;
    const sidebar = btnEl ? btnEl.parentElement : null;
    if (sidebar) {
        sidebar.querySelectorAll(".sidebar-link").forEach(btn => btn.classList.remove("active"));
        btnEl.classList.add("active");
    }
    document.querySelectorAll(".admin-content-section").forEach(sec => sec.classList.remove("active"));
    document.getElementById(tabId).classList.add("active");
};

// ==================== 5. LANDING PAGE SIMULATOR CALCULATOR ====================
let calcSelectedTreatment = "cuci-lipat";
let calcSelectedDuration = "reguler";

async function initLandingServiceCalculator() {
    const services = await fetchServices();
    const select = document.getElementById("calc-service");
    if (select) {
        select.innerHTML = services.map(s => `<option value="${s.id}">${s.name} (${s.category})</option>`).join("");
    }

    const treatments = await fetchTreatments();
    const treatCont = document.getElementById("calc-treatment-container");
    if (treatCont) {
        treatCont.innerHTML = treatments.map((t, idx) => `
            <button type="button" class="treatment-btn ${idx === 0 ? 'active' : ''}" onclick="setCalcTreatment('${t.id}', this)">
                ${t.name} (${t.multiplier}x)
            </button>
        `).join("");
    }

    const durations = await fetchDurations();
    const durCont = document.getElementById("calc-duration-container");
    if (durCont) {
        durCont.innerHTML = durations.map((d, idx) => `
            <button type="button" class="duration-btn ${idx === 0 ? 'active' : ''}" onclick="setCalcDuration('${d.id}', this)">
                ${d.name} (${d.multiplier}x)
            </button>
        `).join("");
    }
    calculatePriceEstimate();
}

window.setCalcTreatment = function(id, btn) {
    calcSelectedTreatment = id;
    btn.parentElement.querySelectorAll(".treatment-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    calculatePriceEstimate();
};

window.setCalcDuration = function(id, btn) {
    calcSelectedDuration = id;
    btn.parentElement.querySelectorAll(".duration-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    calculatePriceEstimate();
};

async function calculatePriceEstimate() {
    const services = await fetchServices();
    const treatments = await fetchTreatments();
    const durations = await fetchDurations();

    const serviceId = document.getElementById("calc-service")?.value;
    const selectedService = services.find(s => s.id === serviceId);
    if (!selectedService) return;

    const qtyWrapper = document.getElementById("calc-qty-wrapper");
    const qtyLabel = document.getElementById("calc-qty-label");
    const qtyInput = document.getElementById("calc-qty");

    if (selectedService.category === "Satuan") {
        qtyLabel.innerText = "Estimasi Jumlah Barang (Pcs)";
        qtyInput.min = 1;
        qtyInput.step = 1;
    } else {
        qtyLabel.innerText = "Estimasi Berat (Kg)";
        qtyInput.min = 0.5;
        qtyInput.step = 0.1;
    }

    const qty = parseFloat(qtyInput.value) || 0;
    const treatment = treatments.find(t => t.id === calcSelectedTreatment);
    const duration = durations.find(d => d.id === calcSelectedDuration);

    if (treatment && duration) {
        const total = selectedService.basePrice * treatment.multiplier * duration.multiplier * qty;
        document.getElementById("calc-total-price").innerText = `Rp ${Math.round(total).toLocaleString("id-ID")}`;
    }
}

// ==================== 6. CUSTOMER BOOKING FLOW WIZARD ====================
let bookSelectedTreatment = "cuci-lipat";
let bookSelectedDuration = "reguler";
let bookSelectedItems = {};

async function initBookingWizard() {
    bookingWizardStep = 1;
    bookSelectedItems = {};
    selectedBookingPayment = "cod";
    selectedCouponCode = null;
    
    const ca = document.getElementById("coupon-alert");
    if (ca) ca.innerText = "";
    const bc = document.getElementById("book-coupon");
    if (bc) bc.value = "";
    
    // Set Tomorrow Date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    
    const pdate = document.getElementById("book-pickup-date");
    if (pdate) {
        pdate.value = `${yyyy}-${mm}-${dd}`;
        pdate.min = `${yyyy}-${mm}-${dd}`;
    }

    const services = await fetchServices();
    const select = document.getElementById("book-service");
    select.innerHTML = services.map(s => `<option value="${s.id}">${s.name} (${s.category})</option>`).join("");

    const treatments = await fetchTreatments();
    const treatCont = document.getElementById("book-treatment-container");
    treatCont.innerHTML = treatments.map((t, idx) => `
        <button type="button" class="treatment-btn ${idx === 0 ? 'active' : ''}" onclick="setBookTreatment('${t.id}', this)">
            ${t.name} (${t.multiplier}x)
        </button>
    `).join("");

    const durations = await fetchDurations();
    const durCont = document.getElementById("book-duration-container");
    durCont.innerHTML = durations.map((d, idx) => `
        <button type="button" class="duration-btn ${idx === 0 ? 'active' : ''}" onclick="setBookDuration('${d.id}', this)">
            ${d.name} (${d.multiplier}x)
        </button>
    `).join("");

    const satuanItemsContainer = document.getElementById("book-satuan-items");
    const satuanServices = services.filter(s => s.category === "Satuan");
    satuanItemsContainer.innerHTML = satuanServices.map(s => `
        <div class="item-card" id="sat-card-${s.id}">
            <div style="font-size: 1.1rem; margin-bottom: 5px;"><i class="fa-solid fa-shirt"></i></div>
            <div style="font-size:0.8rem; font-weight:600; min-height: 25px;">${s.name.replace("Cuci ", "")}</div>
            <div style="font-size:0.75rem; color:var(--text-muted)">Rp ${s.basePrice.toLocaleString("id-ID")}</div>
            <div class="item-qty">
                <button type="button" class="qty-btn" onclick="adjustItemQty('${s.id}', -1, event)">-</button>
                <span id="sat-qty-${s.id}" style="font-weight:700;">0</span>
                <button type="button" class="qty-btn" onclick="adjustItemQty('${s.id}', 1, event)">+</button>
            </div>
        </div>
    `).join("");

    await updateBookingWizardEstimates();
    updateWizardProgressBar();
}

window.setBookTreatment = function(id, btn) {
    bookSelectedTreatment = id;
    btn.parentElement.querySelectorAll(".treatment-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    updateBookingWizardEstimates();
};

window.setBookDuration = function(id, btn) {
    bookSelectedDuration = id;
    btn.parentElement.querySelectorAll(".duration-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    updateBookingWizardEstimates();
};

window.adjustItemQty = function(sid, amt, e) {
    e.stopPropagation();
    if (!bookSelectedItems[sid]) bookSelectedItems[sid] = 0;
    bookSelectedItems[sid] += amt;
    if (bookSelectedItems[sid] <= 0) {
        bookSelectedItems[sid] = 0;
        document.getElementById(`sat-card-${sid}`).classList.remove("selected");
    } else {
        document.getElementById(`sat-card-${sid}`).classList.add("selected");
    }
    document.getElementById(`sat-qty-${sid}`).innerText = bookSelectedItems[sid];
    updateBookingWizardEstimates();
};

async function updateBookingWizardEstimates() {
    const services = await fetchServices();
    const serviceId = document.getElementById("book-service").value;
    const selectedService = services.find(s => s.id === serviceId);
    if (!selectedService) return;

    if (selectedService.category === "Satuan") {
        document.getElementById("book-kiloan-qty-container").style.display = "none";
        document.getElementById("book-satuan-qty-container").style.display = "block";
    } else {
        document.getElementById("book-kiloan-qty-container").style.display = "block";
        document.getElementById("book-satuan-qty-container").style.display = "none";
    }

    const pickupDateVal = document.getElementById("book-pickup-date").value;
    if (pickupDateVal) {
        const date = new Date(pickupDateVal);
        const durations = await fetchDurations();
        const durObj = durations.find(d => d.id === bookSelectedDuration);
        if (durObj) {
            date.setHours(date.getHours() + durObj.hours);
            const dd = String(date.getDate()).padStart(2, '0');
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const yyyy = date.getFullYear();
            document.getElementById("book-delivery-date").value = `${dd}-${mm}-${yyyy} (Estimasi)`;
        }
    }
}

window.navigateWizard = async function(step) {
    if (step === 2) {
        const services = await fetchServices();
        const selService = services.find(s => s.id === document.getElementById("book-service").value);
        if (selService.category === "Satuan") {
            const hasItems = Object.values(bookSelectedItems).some(val => val > 0);
            if (!hasItems) {
                alert("Mohon pilih minimal 1 item satuan untuk dicuci!");
                return;
            }
        }
    }
    if (step === 4) {
        await buildBookingSummaryHTML();
    }
    bookingWizardStep = step;
    document.querySelectorAll(".wizard-pane").forEach(pane => pane.classList.remove("active"));
    document.getElementById(`wizard-pane-${step}`).classList.add("active");
    updateWizardProgressBar();
};

function updateWizardProgressBar() {
    for (let i = 1; i <= 4; i++) {
        const node = document.getElementById(`wizard-step-${i}`);
        if (i < bookingWizardStep) {
            node.className = "wizard-step-node completed";
            node.innerHTML = `<i class="fa-solid fa-check"></i>`;
        } else if (i === bookingWizardStep) {
            node.className = "wizard-step-node active";
            node.innerHTML = i;
        } else {
            node.className = "wizard-step-node";
            node.innerHTML = i;
        }
    }
    const pct = ((bookingWizardStep - 1) / 3) * 100;
    document.getElementById("booking-wizard-progress").style.width = `${pct}%`;
}

window.selectPaymentMethod = function(method, el) {
    selectedBookingPayment = method;
    el.parentElement.querySelectorAll(".item-card").forEach(c => c.classList.remove("selected"));
    el.classList.add("selected");
};

window.applyCouponCode = async function() {
    const input = document.getElementById("book-coupon").value.trim().toUpperCase();
    const alertSpan = document.getElementById("coupon-alert");
    if (input === "BARU20") {
        selectedCouponCode = "BARU20";
        alertSpan.innerText = "✓ Voucher berhasil digunakan! Diskon 20% diterapkan.";
        alertSpan.style.color = "var(--status-success)";
    } else {
        selectedCouponCode = null;
        alertSpan.innerText = "✗ Voucher tidak valid.";
        alertSpan.style.color = "var(--status-danger)";
    }
    await buildBookingSummaryHTML();
};

async function calculateBookingPrice() {
    const services = await fetchServices();
    const treatments = await fetchTreatments();
    const durations = await fetchDurations();

    const selectedServiceId = document.getElementById("book-service").value;
    const selectedService = services.find(s => s.id === selectedServiceId);
    const treatment = treatments.find(t => t.id === bookSelectedTreatment);
    const duration = durations.find(d => d.id === bookSelectedDuration);

    let price = 0;
    let qtyDetails = "";

    if (selectedService.category === "Kiloan") {
        const weight = parseFloat(document.getElementById("book-kiloan-qty").value) || 1;
        price = selectedService.basePrice * treatment.multiplier * duration.multiplier * weight;
        qtyDetails = `${weight} Kg`;
    } else {
        let subtotal = 0;
        const details = [];
        for (const [srvId, qty] of Object.entries(bookSelectedItems)) {
            if (qty > 0) {
                const itemSrv = services.find(s => s.id === srvId);
                subtotal += itemSrv.basePrice * qty;
                details.push(`${qty}x ${itemSrv.name.replace("Cuci ", "")}`);
            }
        }
        price = subtotal * treatment.multiplier * duration.multiplier;
        qtyDetails = details.join(", ");
    }

    let discount = 0;
    if (selectedCouponCode === "BARU20") {
        discount = price * 0.2;
    }
    const finalPrice = Math.max(0, price - discount);

    return {
        base: price,
        discount,
        final: Math.round(finalPrice),
        qtyDetails
    };
}

async function buildBookingSummaryHTML() {
    const priceDetails = await calculateBookingPrice();
    const services = await fetchServices();
    const treatments = await fetchTreatments();
    const durations = await fetchDurations();

    const selectedServiceId = document.getElementById("book-service").value;
    const selectedService = services.find(s => s.id === selectedServiceId);
    const treatment = treatments.find(t => t.id === bookSelectedTreatment);
    const duration = durations.find(d => d.id === bookSelectedDuration);

    const addresses = await fetchAddresses(sessionUser.id);
    const activeAddressId = document.querySelector('input[name="book-addr"]:checked')?.value;
    const selAddr = addresses.find(a => a.id === activeAddressId) || addresses[0];

    const pickupDate = document.getElementById("book-pickup-date").value;
    const pickupTime = document.getElementById("book-pickup-time").value;
    const notes = document.getElementById("book-notes").value || "-";

    const addrStr = selAddr ? selAddr.details : "Mohon tambah alamat terlebih dahulu!";

    document.getElementById("booking-summary-html").innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom: 8px;">
            <strong>Layanan Utama:</strong>
            <span>${selectedService.name} (${selectedService.category})</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom: 8px;">
            <strong>Perlakuan & Durasi:</strong>
            <span>${treatment.name} | ${duration.name}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom: 8px;">
            <strong>Rincian Item:</strong>
            <span>${priceDetails.qtyDetails}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom: 8px;">
            <strong>Jadwal Jemput (Pickup):</strong>
            <span>${pickupDate} | Jam: ${pickupTime}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom: 8px; flex-direction: column;">
            <strong>Alamat:</strong>
            <span style="font-size:0.85rem; color:var(--text-muted); margin-top:2px;">${addrStr}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom: 8px;">
            <strong>Catatan Khusus:</strong>
            <span>"${notes}"</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom: 8px;">
            <strong>Metode Pembayaran:</strong>
            <span style="text-transform: uppercase;">${selectedBookingPayment}</span>
        </div>
        <hr style="border:none; border-top:1px dashed var(--border-color); margin:12px 0;">
        <div style="display:flex; justify-content:space-between; margin-bottom: 6px;">
            <span>Biaya Layanan:</span>
            <span>Rp ${priceDetails.base.toLocaleString("id-ID")}</span>
        </div>
        ${priceDetails.discount > 0 ? `
        <div style="display:flex; justify-content:space-between; margin-bottom: 6px; color: var(--status-success); font-weight:600;">
            <span>Diskon Voucher (20%):</span>
            <span>-Rp ${priceDetails.discount.toLocaleString("id-ID")}</span>
        </div>
        ` : ''}
        <div style="display:flex; justify-content:space-between; font-size:1.15rem; font-weight:800; color:var(--primary); margin-top: 10px;">
            <span>Total Tagihan:</span>
            <span>Rp ${priceDetails.final.toLocaleString("id-ID")}</span>
        </div>
    `;
}

window.submitBookingOrder = async function() {
    if (!sessionUser) return;
    const orders = await fetchOrders();
    const addresses = await fetchAddresses(sessionUser.id);
    const services = await fetchServices();

    const nextIdNum = orders.length > 0 ? Math.max(...orders.map(o => parseInt(o.id.replace("TR-", "")))) + 1 : 1001;
    const newId = `TR-${nextIdNum}`;

    const activeAddressId = document.querySelector('input[name="book-addr"]:checked')?.value;
    const selAddr = addresses.find(a => a.id === activeAddressId) || addresses[0];
    
    if (!selAddr) {
        alert("Silakan tambah alamat pengantaran Anda terlebih dahulu!");
        return;
    }

    const serviceId = document.getElementById("book-service").value;
    const selectedService = services.find(s => s.id === serviceId);

    const priceDetails = await calculateBookingPrice();
    const qtyValue = selectedService.category === "Kiloan" ? parseFloat(document.getElementById("book-kiloan-qty").value) : Object.values(bookSelectedItems).reduce((a,b)=>a+b, 0);

    const paymentStatus = selectedBookingPayment === "qris" ? "paid" : "unpaid";

    const newOrder = {
        id: newId,
        customer_id: sessionUser.id,
        customerName: sessionUser.name,
        customerPhone: sessionUser.phone,
        serviceId: serviceId,
        treatmentId: bookSelectedTreatment,
        durationId: bookSelectedDuration,
        qty: qtyValue,
        price: priceDetails.final,
        address: selAddr.details,
        status: "pending-pickup",
        courierId: "22222222-2222-2222-2222-222222222222", // Default Courier Riko
        notes: document.getElementById("book-notes").value || "-",
        pickupDate: document.getElementById("book-pickup-date").value,
        pickupTime: document.getElementById("book-pickup-time").value,
        deliveryDate: "Otomatis terhitung",
        deliveryTime: document.getElementById("book-delivery-time").value,
        paymentMethod: selectedBookingPayment,
        paymentStatus: paymentStatus,
        dateCreated: new Date().toISOString()
    };

    await insertOrder(newOrder);
    triggerStatusWhatsAppAlert(newOrder);

    if (selectedBookingPayment === "qris") {
        openQRISModal(newOrder);
    } else {
        alert(`Booking Berhasil! ID Order Anda: ${newId}. Kurir akan menjemput cucian.`);
        await refreshDashboardViews();
        switchCustTab("cust-dashboard", document.querySelector('[onclick*="cust-dashboard"]'));
        initBookingWizard();
    }
};

// ==================== 7. CUSTOMER ACTIVE ORDERS & HISTORY ====================
async function renderCustomerActiveOrders() {
    if (!sessionUser) return;
    const orders = await fetchOrders();
    const services = await fetchServices();
    const active = orders.filter(o => o.customer_id === sessionUser.id && o.status !== "completed");

    document.getElementById("cust-active-orders-count").innerText = active.length;

    const list = document.getElementById("cust-active-orders-list");
    if (active.length === 0) {
        list.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding: 20px;">Tidak ada booking laundry aktif saat ini.</p>`;
        return;
    }

    list.innerHTML = active.map(o => {
        const srv = services.find(s => s.id === o.serviceId);
        return `
            <div style="border: 1px solid var(--border-color); padding: 16px; border-radius: 12px; margin-bottom: 12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px; background:var(--bg-secondary);">
                <div>
                    <strong style="color: var(--primary); font-size:1.05rem;">ID: ${o.id}</strong>
                    <div style="font-size:0.85rem; font-weight:600; margin-top:2px;">${srv?.name || 'Laundry'} - ${o.qty} kg/pcs</div>
                    <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">Pickup: ${o.pickupDate} (${o.pickupTime})</div>
                </div>
                <div style="display:flex; align-items:center; gap: 15px;">
                    <span class="badge badge-${o.status === 'pending-pickup' ? 'pending' : 'process'}">${statusTranslations[o.status] || o.status}</span>
                    <button class="btn btn-outline btn-sm" onclick="openOrderTracker('${o.id}')" style="padding:6px 12px; font-size:0.8rem;">
                        <i class="fa-solid fa-location-arrow"></i> Lacak
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

window.openOrderTracker = function(orderId) {
    switchCustTab("cust-tracking", document.querySelector('[onclick*="cust-tracking"]'));
    document.getElementById("track-order-id").value = orderId;
    trackOrder();
};

window.trackOrder = async function() {
    const orderId = document.getElementById("track-order-id").value.trim().toUpperCase();
    const orders = await fetchOrders();
    const services = await fetchServices();
    const couriers = await fetchCouriers();

    const order = orders.find(o => o.id === orderId);
    const resultDiv = document.getElementById("track-result");

    if (!order) {
        alert("Nomor ID Pesanan tidak ditemukan!");
        resultDiv.style.display = "none";
        return;
    }

    resultDiv.style.display = "block";
    document.getElementById("track-result-id").innerText = `ORDER ID: ${order.id}`;

    const srv = services.find(s => s.id === order.serviceId);
    document.getElementById("track-result-service").innerText = `Layanan: ${srv?.name || 'Laundry'} (${order.paymentMethod.toUpperCase()} - ${order.paymentStatus === 'paid' ? 'LUNAS' : 'BELUM BAYAR'})`;
    document.getElementById("track-result-detail").innerText = `Estimasi/Berat: ${order.qty} ${srv?.category === 'Kiloan' ? 'Kg' : 'Pcs'} | Harga: Rp ${order.price.toLocaleString("id-ID")}`;
    document.getElementById("track-result-notes").innerText = `Catatan: "${order.notes}"`;

    const cour = couriers.find(c => c.id === order.courierId);
    document.getElementById("track-result-courier").innerHTML = `<i class="fa-solid fa-user-tie"></i> Kurir: <strong>${cour ? cour.name : 'Belum Ditugaskan'}</strong>`;
    document.getElementById("track-result-delivery").innerText = `Pickup: ${order.pickupDate} (${order.pickupTime})`;

    const stepperSteps = [
        { status: "pending-pickup", title: "Menunggu Penjemputan", desc: "Order terdaftar, kurir sedang dijadwalkan." },
        { status: "pickup-inprogress", title: "Kurir Menuju Lokasi", desc: "Kurir sedang dalam perjalanan mengambil pakaian Anda." },
        { status: "washing", title: "Proses Cuci & Keringkan", desc: "Pakaian sudah ditimbang di outlet dan sedang dicuci." },
        { status: "ready", title: "Cucian Siap Diantar", desc: "Pakaian bersih, wangi, rapi disetrika dan siap dikirim." },
        { status: "delivering", title: "Proses Pengantaran", desc: "Kurir membawa pakaian kembali ke alamat tujuan Anda." },
        { status: "completed", title: "Pesanan Selesai", desc: "Cucian telah diterima pelanggan dengan baik." }
    ];

    const currentIdx = stepperSteps.findIndex(s => s.status === order.status);
    const stepperContainer = document.getElementById("track-stepper");

    stepperContainer.innerHTML = stepperSteps.map((step, idx) => {
        let stateClass = "";
        if (idx < currentIdx) stateClass = "completed";
        else if (idx === currentIdx) stateClass = "active";

        return `
            <div class="stepper-item ${stateClass}">
                <div class="stepper-node"></div>
                <div class="stepper-content">
                    <div class="stepper-title">${step.title}</div>
                    <div class="stepper-desc">${step.desc}</div>
                </div>
            </div>
        `;
    }).join("");
};

async function renderAddressesSelection() {
    if (!sessionUser) return;
    const addresses = await fetchAddresses(sessionUser.id);
    
    // In Profile Dashboard
    document.getElementById("cust-addresses-list").innerHTML = addresses.map(a => `
        <div class="address-card">
            <h4>${a.name}</h4>
            <p style="font-size:0.8rem; color:var(--text-muted); margin-top:6px;">${a.details}</p>
            <p style="font-size:0.8rem; margin-top:4px;"><i class="fa-solid fa-phone"></i> ${a.phone}</p>
        </div>
    `).join("");

    // In Booking Wizard
    const container = document.getElementById("book-addresses-container");
    if (addresses.length === 0) {
        container.innerHTML = `<p style="color:var(--status-danger); font-size:0.85rem; font-weight:600;">Belum ada alamat terdaftar. Mohon klik menu "Alamat Saya" lalu tambah alamat.</p>`;
        return;
    }
    
    container.innerHTML = addresses.map((a, idx) => `
        <label class="address-card ${idx === 0 ? 'selected' : ''}" style="display:block; width:100%; cursor:pointer;">
            <input type="radio" name="book-addr" value="${a.id}" ${idx === 0 ? 'checked' : ''} onchange="highlightAddressCard(this)" style="margin-right: 8px;">
            <strong>${a.name}</strong>
            <p style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">${a.details}</p>
        </label>
    `).join("");
}

window.highlightAddressCard = function(input) {
    document.querySelectorAll('#book-addresses-container .address-card').forEach(c => c.classList.remove('selected'));
    input.parentElement.classList.add('selected');
};

window.openAddAddressModal = function() {
    const overlay = document.getElementById("modal-overlay");
    const wrapper = document.getElementById("modal-content-wrapper");
    overlay.classList.add("active");
    wrapper.innerHTML = `
        <div class="modal-header">
            <h3>Tambah Alamat Baru</h3>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div>
            <div class="form-group">
                <label>Nama Label Alamat</label>
                <input type="text" class="form-control" id="new-addr-name" placeholder="Contoh: Kost Utama / Rumah Ibu">
            </div>
            <div class="form-group">
                <label>Nomor Telepon Kontak</label>
                <input type="text" class="form-control" id="new-addr-phone" value="${sessionUser.phone}">
            </div>
            <div class="form-group">
                <label>Alamat Lengkap</label>
                <textarea class="form-control" id="new-addr-details" placeholder="Jalan, No Rumah, RT/RW, Kecamatan, Kota" rows="3"></textarea>
            </div>
            <button class="btn btn-primary" style="width: 100%; justify-content:center;" id="btn-save-new-address">Simpan Alamat</button>
        </div>
    `;

    document.getElementById("btn-save-new-address").onclick = async function() {
        const name = document.getElementById("new-addr-name").value.trim();
        const phone = document.getElementById("new-addr-phone").value.trim();
        const details = document.getElementById("new-addr-details").value.trim();
        
        if (!name || !details) {
            alert("Mohon isi nama label dan detail alamat!");
            return;
        }

        const newAddr = {
            id: 'addr-' + Math.random().toString(36).substring(2, 9),
            user_id: sessionUser.id,
            name,
            phone,
            details
        };

        await insertAddress(newAddr);
        closeModal();
        await renderAddressesSelection();
    };
};

async function renderCustomerHistory() {
    if (!sessionUser) return;
    const orders = await fetchOrders();
    const services = await fetchServices();
    const completed = orders.filter(o => o.customer_id === sessionUser.id && o.status === "completed");

    const tbody = document.getElementById("cust-history-tbody");
    if (completed.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">Belum ada riwayat pesanan selesai.</td></tr>`;
        return;
    }

    // Set points based on orders count
    document.getElementById("cust-loyalty-pts").innerText = completed.length * 50;

    tbody.innerHTML = completed.map(o => {
        const srv = services.find(s => s.id === o.serviceId);
        const dateObj = new Date(o.dateCreated);
        const dateStr = `${dateObj.getDate()}/${dateObj.getMonth()+1}/${dateObj.getFullYear()}`;

        let ratingHtml = "";
        if (o.rating) {
            ratingHtml = `<span style="color:#f59e0b;">${"★".repeat(o.rating)}${"☆".repeat(5-o.rating)}</span>`;
        } else {
            ratingHtml = `<button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem;" onclick="openReviewModal('${o.id}')">Beri Ulasan</button>`;
        }

        return `
            <tr>
                <td><strong>${o.id}</strong></td>
                <td>${dateStr}</td>
                <td>${srv?.name || 'Laundry'} (${o.qty} ${srv?.category === 'Kiloan' ? 'Kg' : 'Pcs'})</td>
                <td>Rp ${o.price.toLocaleString("id-ID")}</td>
                <td><span class="badge badge-success">Selesai</span></td>
                <td>
                    <div style="display:flex; gap:8px; align-items:center;">
                        <button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem;" onclick="openInvoiceModal('${o.id}')"><i class="fa-solid fa-file-invoice"></i> Invoice</button>
                        ${ratingHtml}
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

// Review submission Modal
window.openReviewModal = function(orderId) {
    const overlay = document.getElementById("modal-overlay");
    const wrapper = document.getElementById("modal-content-wrapper");
    overlay.classList.add("active");

    wrapper.innerHTML = `
        <div class="modal-header">
            <h3>Beri Ulasan Pesanan</h3>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div>
            <div class="form-group" style="text-align: center; margin-bottom: 20px;">
                <label>Berikan Rating Bintang</label>
                <div style="font-size: 2.2rem; display:flex; gap:10px; justify-content:center; cursor:pointer;" id="stars-rate-container">
                    <span onclick="setRatingVal(1)" class="star-rating" data-val="1">★</span>
                    <span onclick="setRatingVal(2)" class="star-rating" data-val="2">★</span>
                    <span onclick="setRatingVal(3)" class="star-rating" data-val="3">★</span>
                    <span onclick="setRatingVal(4)" class="star-rating" data-val="4">★</span>
                    <span onclick="setRatingVal(5)" class="star-rating" data-val="5">★</span>
                </div>
                <input type="hidden" id="review-stars-val" value="5">
            </div>
            <div class="form-group">
                <label>Komentar Ulasan Anda</label>
                <textarea class="form-control" id="review-comment-val" placeholder="Pakaian sangat wangi, kurir ramah, disetrika licin..." rows="3"></textarea>
            </div>
            <button class="btn btn-primary" style="width: 100%; justify-content:center;" id="btn-submit-review">Kirim Ulasan</button>
        </div>
    `;
    setRatingVal(5);

    document.getElementById("btn-submit-review").onclick = async function() {
        const stars = parseInt(document.getElementById("review-stars-val").value) || 5;
        const comment = document.getElementById("review-comment-val").value.trim();
        await updateOrderFields(orderId, { rating: stars, reviewText: comment });
        closeModal();
        await refreshDashboardViews();
        alert("Ulasan Anda sukses terekam!");
    };
};

window.setRatingVal = function(rating) {
    document.getElementById("review-stars-val").value = rating;
    document.querySelectorAll(".star-rating").forEach(star => {
        const val = parseInt(star.getAttribute("data-val"));
        if (val <= rating) {
            star.style.color = "#f59e0b";
        } else {
            star.style.color = "var(--text-muted)";
        }
    });
};

// ==================== 8. COURIER TASK INTERFACE ====================
let currentCourierTabType = "active";

window.toggleCourierTasks = async function(type) {
    currentCourierTabType = type;
    const activeBtn = document.getElementById("courier-tab-active-btn");
    const historyBtn = document.getElementById("courier-tab-history-btn");

    if (type === "active") {
        activeBtn.classList.add("active");
        historyBtn.classList.remove("active");
    } else {
        activeBtn.classList.remove("active");
        historyBtn.classList.add("active");
    }
    await renderCourierTasks();
};

async function renderCourierTasks() {
    if (!sessionUser) return;
    const orders = await fetchOrders();
    const services = await fetchServices();
    
    // Fetch South/Central assigned tasks
    const rTasks = orders.filter(o => o.courierId === sessionUser.id);
    const active = rTasks.filter(o => o.status !== "completed");
    const completed = rTasks.filter(o => o.status === "completed");

    document.getElementById("courier-pending-count").innerText = active.length;
    document.getElementById("courier-completed-count").innerText = completed.length;
    document.getElementById("courier-profile-name").innerText = `${sessionUser.name} (Kurir)`;
    document.getElementById("courier-profile-region").innerHTML = `<i class="fa-solid fa-truck"></i> Wilayah: Jakarta`;
    document.getElementById("courier-avatar-char").innerText = sessionUser.name.charAt(0).toUpperCase();

    const listContainer = document.getElementById("courier-tasks-container");
    const filtered = currentCourierTabType === "active" ? active : completed;

    if (filtered.length === 0) {
        listContainer.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:30px;">Tidak ada tugas kurir saat ini.</p>`;
        return;
    }

    listContainer.innerHTML = filtered.map(o => {
        const srv = services.find(s => s.id === o.serviceId);
        let actionBtn = "";
        let taskLabel = "";
        let taskIcon = "";

        if (o.status === "pending-pickup") {
            taskLabel = "TUGAS PICKUP";
            taskIcon = `<i class="fa-solid fa-arrow-down" style="color:var(--status-pending)"></i>`;
            actionBtn = `<button class="btn btn-primary btn-sm" onclick="courierStartJob('${o.id}', 'pickup-inprogress')">Mulai Jemput</button>`;
        } else if (o.status === "pickup-inprogress") {
            taskLabel = "PENJEMPUTAN SEDANG BERJALAN";
            taskIcon = `<i class="fa-solid fa-truck" style="color:var(--status-process)"></i>`;
            actionBtn = `<button class="btn btn-secondary btn-sm" onclick="openCourierCompletionModal('${o.id}', 'washing')">Selesaikan Jemput</button>`;
        } else if (o.status === "ready") {
            taskLabel = "TUGAS DELIVERY (ANTAR)";
            taskIcon = `<i class="fa-solid fa-arrow-up" style="color:var(--status-ready)"></i>`;
            actionBtn = `<button class="btn btn-primary btn-sm" onclick="courierStartJob('${o.id}', 'delivering')">Mulai Antar</button>`;
        } else if (o.status === "delivering") {
            taskLabel = "PENGANTARAN SEDANG BERJALAN";
            taskIcon = `<i class="fa-solid fa-truck-fast" style="color:var(--status-process)"></i>`;
            actionBtn = `<button class="btn btn-secondary btn-sm" onclick="openCourierCompletionModal('${o.id}', 'completed')">Selesaikan Antar</button>`;
        } else {
            taskLabel = "TUGAS SELESAI";
            taskIcon = `<i class="fa-solid fa-circle-check" style="color:var(--status-success)"></i>`;
        }

        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.address)}`;

        return `
            <div class="courier-card" style="background:var(--bg-secondary)">
                <div class="courier-card-header">
                    <strong>${taskIcon} ${taskLabel}</strong>
                    <span class="badge badge-${o.status === 'completed' ? 'success' : 'pending'}">${o.id}</span>
                </div>
                <div style="font-size:0.85rem; line-height: 1.6;">
                    <div style="margin-bottom: 4px;">Pelanggan: <strong>${o.customerName}</strong></div>
                    <div style="margin-bottom: 4px;">Alamat: <a href="${mapUrl}" target="_blank" style="color:var(--primary); text-decoration:none;"><i class="fa-solid fa-map-pin"></i> ${o.address} (Buka Peta)</a></div>
                    <div style="margin-bottom: 4px;">WhatsApp: <a href="https://wa.me/${o.customerPhone}" target="_blank" style="color:var(--secondary); text-decoration:none;"><i class="fa-brands fa-whatsapp"></i> ${o.customerPhone}</a></div>
                    <div>Catatan: "${o.notes}"</div>
                </div>
                ${actionBtn ? `<div class="courier-actions">${actionBtn}</div>` : ''}
            </div>
        `;
    }).join("");
}

window.courierStartJob = async function(orderId, status) {
    const orders = await fetchOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
        await updateOrderFields(orderId, { status });
        const updatedOrder = { ...order, status };
        triggerStatusWhatsAppAlert(updatedOrder);
    }
    await refreshDashboardViews();
};

// Canvas digital signature logic
let isDrawing = false;
let sigCanvas = null;
let sigCtx = null;

window.openCourierCompletionModal = function(orderId, nextStatus) {
    const overlay = document.getElementById("modal-overlay");
    const wrapper = document.getElementById("modal-content-wrapper");
    overlay.classList.add("active");

    wrapper.innerHTML = `
        <div class="modal-header">
            <h3>Konfirmasi Tugas Selesai</h3>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div>
            <p style="font-size:0.85rem; margin-bottom: 12px; color:var(--text-muted);">Selesaikan tugas untuk Order ID: <strong>${orderId}</strong>.</p>
            
            <div class="form-group">
                <label>Foto Bukti Serah Terima (Opsional)</label>
                <input type="file" class="form-control" accept="image/*" id="courier-proof-file" onchange="simulatePhotoUploadText()">
                <div id="photo-upload-sim-alert" style="font-size:0.8rem; color:var(--status-success); margin-top:5px; font-weight:600;"></div>
            </div>

            <div class="form-group">
                <label>Tanda Tangan Digital Penerima/Kurir</label>
                <div class="signature-pad-container">
                    <canvas class="signature-canvas" id="sig-pad"></canvas>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <button class="btn btn-outline" style="padding:4px 10px; font-size:0.75rem;" onclick="clearSignatureCanvas()">Bersihkan Canvas</button>
                    <span style="font-size:0.75rem; color:var(--text-muted);">Tanda tangan pada kotak di atas</span>
                </div>
            </div>

            <button class="btn btn-primary" style="width: 100%; justify-content:center; margin-top: 15px;" id="btn-courier-complete-job">
                Kirim & Selesaikan Tugas
            </button>
        </div>
    `;

    initSignatureCanvas();

    document.getElementById("btn-courier-complete-job").onclick = async function() {
        const orders = await fetchOrders();
        const order = orders.find(o => o.id === orderId);
        if (order) {
            await updateOrderFields(orderId, { status: nextStatus });
            const updated = { ...order, status: nextStatus };
            triggerStatusWhatsAppAlert(updated);
        }
        closeModal();
        await refreshDashboardViews();
    };
};

window.simulatePhotoUploadText = function() {
    document.getElementById("photo-upload-sim-alert").innerText = "✓ Gambar terpilih & terkompresi otomatis!";
};

function initSignatureCanvas() {
    sigCanvas = document.getElementById("sig-pad");
    if (!sigCanvas) return;
    
    sigCtx = sigCanvas.getContext("2d");
    sigCtx.strokeStyle = "#000000";
    sigCtx.lineWidth = 2;

    const rect = sigCanvas.getBoundingClientRect();
    sigCanvas.width = rect.width;
    sigCanvas.height = rect.height;

    const getTouchPos = (c, e) => {
        const r = c.getBoundingClientRect();
        return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
    };
    const getMousePos = (c, e) => {
        const r = c.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    sigCanvas.addEventListener("touchstart", (e) => {
        isDrawing = true;
        const pos = getTouchPos(sigCanvas, e);
        sigCtx.beginPath();
        sigCtx.moveTo(pos.x, pos.y);
        e.preventDefault();
    });
    sigCanvas.addEventListener("touchmove", (e) => {
        if (!isDrawing) return;
        const pos = getTouchPos(sigCanvas, e);
        sigCtx.lineTo(pos.x, pos.y);
        sigCtx.stroke();
        e.preventDefault();
    });
    sigCanvas.addEventListener("touchend", () => isDrawing = false);

    sigCanvas.addEventListener("mousedown", (e) => {
        isDrawing = true;
        const pos = getMousePos(sigCanvas, e);
        sigCtx.beginPath();
        sigCtx.moveTo(pos.x, pos.y);
    });
    sigCanvas.addEventListener("mousemove", (e) => {
        if (!isDrawing) return;
        const pos = getMousePos(sigCanvas, e);
        sigCtx.lineTo(pos.x, pos.y);
        sigCtx.stroke();
    });
    sigCanvas.addEventListener("mouseup", () => isDrawing = false);
}

window.clearSignatureCanvas = function() {
    if (sigCanvas && sigCtx) {
        sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
    }
};

// ==================== 9. ADMIN DASHBOARD CONTROL PANEL ====================
async function renderAdminOrders() {
    const orders = await fetchOrders();
    const services = await fetchServices();
    const couriers = await fetchCouriers();
    
    const filterVal = document.getElementById("admin-order-filter-status").value;
    let filtered = orders;

    if (filterVal !== "all") {
        if (filterVal === "pending-pickup") filtered = orders.filter(o => o.status === "pending-pickup");
        else if (filterVal === "pickup-inprogress") filtered = orders.filter(o => o.status === "pickup-inprogress");
        else if (filterVal === "washing") filtered = orders.filter(o => o.status === "washing");
        else if (filterVal === "ready") filtered = orders.filter(o => o.status === "ready");
        else if (filterVal === "completed") filtered = orders.filter(o => o.status === "completed");
    }

    filtered.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
    const tbody = document.getElementById("admin-orders-tbody");

    tbody.innerHTML = filtered.map(o => {
        const srv = services.find(s => s.id === o.serviceId);
        const cour = couriers.find(c => c.id === o.courierId);

        let statusBadge = `<span class="badge badge-pending">${statusTranslations[o.status] || o.status}</span>`;
        if (o.status === "washing") statusBadge = `<span class="badge badge-process">Proses Workshop</span>`;
        if (o.status === "ready") statusBadge = `<span class="badge badge-ready">Siap Diantar</span>`;
        if (o.status === "completed") statusBadge = `<span class="badge badge-success">Selesai</span>`;

        let actionHtml = "";
        if (o.status === "pending-pickup") {
            actionHtml = `<button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem;" onclick="openAssignCourierModal('${o.id}')"><i class="fa-solid fa-truck"></i> Tugaskan</button>`;
        } else if (o.status === "washing") {
            actionHtml = `
                <div style="display:flex; gap:6px;">
                    <button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem;" onclick="openWeighModal('${o.id}')"><i class="fa-solid fa-weight-scale"></i> Timbang</button>
                    <button class="btn btn-primary" style="padding:4px 8px; font-size:0.75rem;" onclick="adminUpdateStatus('${o.id}', 'ready')">Siap Diantar</button>
                </div>
            `;
        } else if (o.status === "ready") {
            actionHtml = `<button class="btn btn-primary" style="padding:4px 8px; font-size:0.75rem;" onclick="adminUpdateStatus('${o.id}', 'completed')">Selesai (Diantar)</button>`;
        } else {
            actionHtml = `<button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem;" onclick="openInvoiceModal('${o.id}')">Invoice</button>`;
        }

        return `
            <tr>
                <td><strong>${o.id}</strong></td>
                <td>${o.customerName}<br><small style="color:var(--text-muted)">${o.customerPhone}</small></td>
                <td>${srv?.name || 'Laundry'}<br><small style="color:var(--text-muted); text-transform:capitalize;">${o.treatmentId} | ${o.durationId}</small></td>
                <td>${o.qty} ${srv?.category === 'Kiloan' ? 'Kg' : 'Pcs'}</td>
                <td>Rp ${o.price.toLocaleString("id-ID")}</td>
                <td>${statusBadge}</td>
                <td>${cour ? cour.name : '-'}</td>
                <td>${actionHtml}</td>
            </tr>
        `;
    }).join("");

    // Calculate Summary statistics
    const active = orders.filter(o => o.status !== "completed");
    const revenue = orders.filter(o => o.status === "completed").reduce((sum, o) => sum + o.price, 0);
    const pendPick = orders.filter(o => o.status === "pending-pickup").length;
    const comps = orders.filter(o => o.status === "completed").length;

    document.getElementById("admin-stat-revenue").innerText = `Rp ${revenue.toLocaleString("id-ID")}`;
    document.getElementById("admin-stat-active-orders").innerText = active.length;
    document.getElementById("admin-stat-pending-orders").innerText = pendPick;
    document.getElementById("admin-stat-completed-orders").innerText = comps;
    
    document.getElementById("admin-profile-name").innerText = `${sessionUser.name} (Admin)`;
}

window.adminUpdateStatus = async function(orderId, status) {
    const orders = await fetchOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
        const payload = { status };
        if (status === "completed") payload.paymentStatus = "paid";
        await updateOrderFields(orderId, payload);
        const updated = { ...order, ...payload };
        triggerStatusWhatsAppAlert(updated);
    }
    await refreshDashboardViews();
};

window.openAssignCourierModal = async function(orderId) {
    const overlay = document.getElementById("modal-overlay");
    const wrapper = document.getElementById("modal-content-wrapper");
    overlay.classList.add("active");

    const couriers = await fetchCouriers();
    wrapper.innerHTML = `
        <div class="modal-header">
            <h3>Tugaskan Kurir</h3>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div>
            <div class="form-group">
                <label>Pilih Kurir Aktif</label>
                <select class="form-control" id="assign-courier-id">
                    ${couriers.map(c => `<option value="${c.id}">${c.name} (Wilayah: ${c.area || 'Jakarta'})</option>`).join("")}
                </select>
            </div>
            <button class="btn btn-primary" style="width:100%; justify-content:center;" id="btn-save-courier-assignment">Tugaskan Kurir</button>
        </div>
    `;

    document.getElementById("btn-save-courier-assignment").onclick = async function() {
        const courierId = document.getElementById("assign-courier-id").value;
        const orders = await fetchOrders();
        const order = orders.find(o => o.id === orderId);
        if (order) {
            await updateOrderFields(orderId, { courierId, status: 'pickup-inprogress' });
            const updated = { ...order, courierId, status: 'pickup-inprogress' };
            triggerStatusWhatsAppAlert(updated);
        }
        closeModal();
        await refreshDashboardViews();
    };
};

window.openWeighModal = async function(orderId) {
    const overlay = document.getElementById("modal-overlay");
    const wrapper = document.getElementById("modal-content-wrapper");
    overlay.classList.add("active");

    const orders = await fetchOrders();
    const order = orders.find(o => o.id === orderId);

    wrapper.innerHTML = `
        <div class="modal-header">
            <h3>Timbang Pakaian Riil</h3>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div>
            <div class="form-group">
                <label>Input Berat Timbangan Riil (Kg)</label>
                <input type="number" class="form-control" id="weigh-weight-val" value="${order.qty}" min="0.1" step="0.1">
            </div>
            <button class="btn btn-primary" style="width:100%; justify-content:center;" id="btn-save-weighing">Simpan & Hitung Harga Akhir</button>
        </div>
    `;

    document.getElementById("btn-save-weighing").onclick = async function() {
        const weight = parseFloat(document.getElementById("weigh-weight-val").value) || 1;
        const services = await fetchServices();
        const treatments = await fetchTreatments();
        const durations = await fetchDurations();

        const srv = services.find(s => s.id === order.serviceId);
        const treat = treatments.find(t => t.id === order.treatmentId);
        const dur = durations.find(d => d.id === order.durationId);

        let newPrice = srv.basePrice * treat.multiplier * dur.multiplier * weight;
        
        // Maintain coupon code discount if applicable
        if (order.price < (srv.basePrice * treat.multiplier * dur.multiplier * order.qty)) {
            newPrice = newPrice * 0.8;
        }

        const finalPrice = Math.round(newPrice);
        await updateOrderFields(orderId, { qty: weight, price: finalPrice });
        
        const updated = { ...order, qty: weight, price: finalPrice };
        triggerStatusWhatsAppAlert(updated);

        closeModal();
        await refreshDashboardViews();
    };
};

// Queue system prioritizer
async function renderAdminQueue() {
    const orders = await fetchOrders();
    const services = await fetchServices();
    const container = document.getElementById("admin-queue-list");

    const activeWorkshop = orders.filter(o => ["washing", "ready", "pending-pickup", "pickup-inprogress"].includes(o.status));
    
    const durationPriority = { "flash": 3, "ekspres": 2, "reguler": 1 };
    activeWorkshop.sort((a, b) => {
        const prioA = durationPriority[a.durationId] || 1;
        const prioB = durationPriority[b.durationId] || 1;
        if (prioB !== prioA) return prioB - prioA;
        return new Date(a.dateCreated) - new Date(b.dateCreated);
    });

    if (activeWorkshop.length === 0) {
        container.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding: 20px;">Antrean cucian kosong.</p>`;
        return;
    }

    container.innerHTML = activeWorkshop.map((o, idx) => {
        const srv = services.find(s => s.id === o.serviceId);
        let priorityBadge = `<span class="badge badge-pending">Reguler</span>`;
        if (o.durationId === "ekspres") priorityBadge = `<span class="badge badge-process">Ekspres</span>`;
        if (o.durationId === "flash") priorityBadge = `<span class="badge badge-danger">⚡ Flash</span>`;

        return `
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding: 10px 0;">
                <div>
                    <span style="font-weight:700; color:var(--text-muted); margin-right:8px;">#${idx+1}</span>
                    <strong>ID: ${o.id}</strong> - <small>${srv?.name || 'Laundry'}</small>
                    <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">Pelanggan: ${o.customerName}</div>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                    ${priorityBadge}
                    <span class="badge badge-process" style="font-size:0.7rem; text-transform:capitalize;">${o.status}</span>
                </div>
            </div>
        `;
    }).join("");
}

// POS Screen checkout
async function initPOS() {
    const services = await fetchServices();
    const select = document.getElementById("pos-service");
    select.innerHTML = services.map(s => `<option value="${s.id}">${s.name} (${s.category})</option>`).join("");
    updatePOSSummary();
}

window.updatePOSSummary = async function() {
    const services = await fetchServices();
    const treatments = await fetchTreatments();
    const durations = await fetchDurations();

    const srvId = document.getElementById("pos-service").value;
    const srv = services.find(s => s.id === srvId);
    const trtId = document.getElementById("pos-treatment").value;
    const trt = treatments.find(t => t.id === trtId) || treatments[0];
    const durId = document.getElementById("pos-duration").value;
    const dur = durations.find(d => d.id === durId) || durations[0];

    const qty = parseFloat(document.getElementById("pos-qty").value) || 1;
    let subtotal = srv.basePrice * qty;
    if (srv.category === "Kiloan") {
        subtotal = srv.basePrice * trt.multiplier * dur.multiplier * qty;
    }
    const finalPrice = Math.round(subtotal);

    document.getElementById("pos-summary-receipt").innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom: 6px;">
            <span>Layanan:</span>
            <span><strong>${srv.name}</strong></span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom: 6px;">
            <span>Perlakuan:</span>
            <span>${trt.name} (${trt.multiplier}x)</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom: 6px;">
            <span>Paket:</span>
            <span>${dur.name} (${dur.multiplier}x)</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom: 6px;">
            <span>Kuantitas:</span>
            <span>${qty} ${srv.category === 'Kiloan' ? 'Kg' : 'Pcs'}</span>
        </div>
        <hr style="border:none; border-top:1px dashed var(--border-color); margin:10px 0;">
        <div style="display:flex; justify-content:space-between; font-size:1.1rem; font-weight:700; color:var(--primary);">
            <span>Total Tagihan:</span>
            <span id="pos-total-tagihan-val" data-val="${finalPrice}">Rp ${finalPrice.toLocaleString("id-ID")}</span>
        </div>
    `;
    calculatePOSChange();
};

window.calculatePOSChange = function() {
    const total = parseInt(document.getElementById("pos-total-tagihan-val")?.getAttribute("data-val")) || 0;
    const cash = parseInt(document.getElementById("pos-cash-received").value) || 0;
    const label = document.getElementById("pos-change-label");

    if (cash >= total && total > 0) {
        label.innerText = `Kembalian: Rp ${(cash - total).toLocaleString("id-ID")}`;
        label.style.color = "var(--status-success)";
    } else if (cash > 0) {
        label.innerText = `Kurang bayar: Rp ${(total - cash).toLocaleString("id-ID")}`;
        label.style.color = "var(--status-danger)";
    } else {
        label.innerText = "";
    }
};

window.submitPOSOrder = async function() {
    const name = document.getElementById("pos-cust-name").value.trim() || "Pelanggan Offline";
    const wa = document.getElementById("pos-cust-wa").value.trim() || "-";
    const total = parseInt(document.getElementById("pos-total-tagihan-val").getAttribute("data-val")) || 0;
    const qty = parseFloat(document.getElementById("pos-qty").value) || 1;

    const orders = await fetchOrders();
    const nextIdNum = orders.length > 0 ? Math.max(...orders.map(o => parseInt(o.id.replace("TR-", "")))) + 1 : 1001;
    const newId = `TR-${nextIdNum}`;

    const newOrder = {
        id: newId,
        customer_id: null,
        customerName: name,
        customerPhone: wa,
        serviceId: document.getElementById("pos-service").value,
        treatmentId: document.getElementById("pos-treatment").value,
        durationId: document.getElementById("pos-duration").value,
        qty: qty,
        price: total,
        address: "Transaksi Langsung di Outlet (Offline)",
        status: "washing",
        courierId: null,
        notes: "POS Offline Order",
        pickupDate: "Hari Ini",
        pickupTime: "-",
        deliveryDate: "-",
        deliveryTime: "-",
        paymentMethod: "cash",
        paymentStatus: "paid",
        dateCreated: new Date().toISOString()
    };

    await insertOrder(newOrder);
    document.getElementById("pos-cust-name").value = "";
    document.getElementById("pos-cust-wa").value = "";
    document.getElementById("pos-cash-received").value = "";

    await openInvoiceModal(newId);
    await refreshDashboardViews();
    await updatePOSSummary();
};

// Services price editor CRUD
async function renderAdminServices() {
    const services = await fetchServices();
    const tbody = document.getElementById("admin-services-tbody");
    
    tbody.innerHTML = services.map(s => `
        <tr>
            <td><strong>${s.name}</strong></td>
            <td>${s.category}</td>
            <td>Rp ${s.basePrice.toLocaleString("id-ID")}</td>
            <td>
                <button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem;" onclick="adminDeleteService('${s.id}')"><i class="fa-solid fa-trash"></i> Hapus</button>
            </td>
        </tr>
    `).join("");
}

window.openAddServiceModal = function() {
    const overlay = document.getElementById("modal-overlay");
    const wrapper = document.getElementById("modal-content-wrapper");
    overlay.classList.add("active");

    wrapper.innerHTML = `
        <div class="modal-header">
            <h3>Tambah Layanan Baru</h3>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div>
            <div class="form-group">
                <label>Nama Layanan</label>
                <input type="text" class="form-control" id="new-srv-name" placeholder="Contoh: Cuci Karpet Tebal">
            </div>
            <div class="form-group">
                <label>Kategori Layanan</label>
                <select class="form-control" id="new-srv-category">
                    <option value="Kiloan">Kiloan (Berat)</option>
                    <option value="Satuan">Satuan (Pcs)</option>
                </select>
            </div>
            <div class="form-group">
                <label>Harga Dasar (Rp)</label>
                <input type="number" class="form-control" id="new-srv-price" value="10000">
            </div>
            <button class="btn btn-primary" style="width:100%; justify-content:center;" id="btn-save-new-service">Tambah Layanan</button>
        </div>
    `;

    document.getElementById("btn-save-new-service").onclick = async function() {
        const name = document.getElementById("new-srv-name").value.trim();
        const category = document.getElementById("new-srv-category").value;
        const price = parseInt(document.getElementById("new-srv-price").value) || 0;

        if (!name) return;
        const id = name.toLowerCase().replace(/\s+/g, '-');
        
        await insertService({ id, name, category, basePrice: price });
        closeModal();
        await refreshDashboardViews();
        await initLandingServiceCalculator();
        await initPOS();
    };
};

window.adminDeleteService = async function(sid) {
    if (confirm("Apakah Anda yakin ingin menghapus layanan ini?")) {
        await deleteServiceFromDB(sid);
        await refreshDashboardViews();
        await initLandingServiceCalculator();
        await initPOS();
    }
};

// CRM Database
async function renderAdminCRM() {
    const orders = await fetchOrders();
    const tbody = document.getElementById("admin-crm-tbody");

    const customers = {};
    orders.forEach(o => {
        const phone = o.customerPhone;
        if (!customers[phone]) {
            customers[phone] = {
                name: o.customerName,
                phone,
                totalOrders: 0,
                totalSpent: 0,
                addresses: new Set()
            };
        }
        customers[phone].totalOrders += 1;
        customers[phone].totalSpent += o.price;
        if (o.address) {
            customers[phone].addresses.add(o.address.substring(0, 30) + "...");
        }
    });

    const list = Object.values(customers);
    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Tidak ada data pelanggan terdaftar.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(c => `
        <tr>
            <td><strong>${c.name}</strong></td>
            <td>${c.phone}</td>
            <td>${c.phone === '08123456789' ? '320 Poin (Gold)' : '0 Poin'}</td>
            <td>${c.totalOrders} Pesanan / Rp ${c.totalSpent.toLocaleString("id-ID")}</td>
            <td>${Array.from(c.addresses).join("<br>") || "-"}</td>
        </tr>
    `).join("");
}

// Inventory management
async function renderAdminInventory() {
    const inventory = await fetchInventory();
    const tbody = document.getElementById("admin-inventory-tbody");

    const lowStockList = [];
    tbody.innerHTML = inventory.map(i => {
        const isLow = i.stock < i.min_stock;
        if (isLow) lowStockList.push(i.name);

        const statusTag = isLow ? `<span class="badge badge-danger">Stok Menipis</span>` : `<span class="badge badge-success">Stok Aman</span>`;
        return `
            <tr class="${isLow ? 'inventory-warning-row' : ''}">
                <td><strong>${i.name}</strong></td>
                <td style="${isLow ? 'color:var(--status-danger); font-weight:700;' : ''}">${i.stock}</td>
                <td>${i.min_stock}</td>
                <td>${i.unit}</td>
                <td>${statusTag}</td>
            </tr>
        `;
    }).join("");

    const container = document.getElementById("admin-low-stock-alert-container");
    if (lowStockList.length > 0) {
        container.innerHTML = `
            <div class="alert-banner">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <span><strong>PERINGATAN STOK:</strong> Bahan baku <strong>${lowStockList.join(", ")}</strong> berada di bawah batas minimal! Segera lakukan pembelian stok.</span>
            </div>
        `;
    } else {
        container.innerHTML = "";
    }
}

window.openAddStockModal = function() {
    const overlay = document.getElementById("modal-overlay");
    const wrapper = document.getElementById("modal-content-wrapper");
    overlay.classList.add("active");

    fetchInventory().then(inventory => {
        wrapper.innerHTML = `
            <div class="modal-header">
                <h3>Restock Bahan Baku</h3>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <div>
                <div class="form-group">
                    <label>Pilih Bahan Baku</label>
                    <select class="form-control" id="restock-item-id">
                        ${inventory.map(i => `<option value="${i.id}">${i.name} (Stok: ${i.stock})</option>`).join("")}
                    </select>
                </div>
                <div class="form-group">
                    <label>Kuantitas Tambahan</label>
                    <input type="number" class="form-control" id="restock-qty-val" value="10" min="1">
                </div>
                <button class="btn btn-primary" style="width:100%; justify-content:center;" id="btn-save-restock">Simpan Restock</button>
            </div>
        `;

        document.getElementById("btn-save-restock").onclick = async function() {
            const itemId = document.getElementById("restock-item-id").value;
            const addQty = parseInt(document.getElementById("restock-qty-val").value) || 0;
            const target = inventory.find(i => i.id === itemId);
            if (target) {
                await updateInventoryStock(itemId, target.stock + addQty);
            }
            closeModal();
            await refreshDashboardViews();
        };
    });
};

// ==================== 10. INVOICE PREVIEW MODAL ====================
window.openInvoiceModal = async function(orderId) {
    const orders = await fetchOrders();
    const services = await fetchServices();
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const srv = services.find(s => s.id === order.serviceId);
    const date = new Date(order.dateCreated);
    const dateStr = `${date.getDate()} / ${date.getMonth()+1} / ${date.getFullYear()}`;

    const overlay = document.getElementById("modal-overlay");
    const wrapper = document.getElementById("modal-content-wrapper");
    overlay.classList.add("active");

    wrapper.innerHTML = `
        <div class="modal-header">
            <h3>Invoice Digital CleanFlow</h3>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div style="padding: 10px; font-family: 'Courier New', Courier, monospace;" id="print-area">
            <div style="text-align: center; border-bottom: 2px dashed #000; padding-bottom: 12px; margin-bottom: 15px;">
                <h2 style="font-weight: 800; font-family:'Outfit'">CleanFlow Laundry</h2>
                <p style="font-size: 0.8rem; margin-top:2px;">Jl. Kemang Raya No. 45, Jakarta Selatan</p>
                <p style="font-size: 0.8rem;">WA: 0811-9876-5432</p>
            </div>
            
            <table style="width: 100%; font-size: 0.85rem; line-height: 1.6; margin-bottom: 15px;">
                <tr><td>ID ORDER :</td><td style="text-align: right;"><strong>${order.id}</strong></td></tr>
                <tr><td>TANGGAL  :</td><td style="text-align: right;">${dateStr}</td></tr>
                <tr><td>PELANGGAN:</td><td style="text-align: right;">${order.customerName}</td></tr>
                <tr><td>METODE   :</td><td style="text-align: right; text-transform:uppercase;">${order.paymentMethod} (${order.paymentStatus})</td></tr>
            </table>

            <hr style="border:none; border-top:1px dashed #000; margin-bottom: 15px;">

            <table style="width: 100%; font-size: 0.85rem; line-height: 1.8;">
                <thead>
                    <tr style="border-bottom: 1px dashed #000;">
                        <th style="text-align: left;">Layanan</th>
                        <th style="text-align: center;">Jumlah</th>
                        <th style="text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${srv?.name || 'Laundry'}<br><small>(Paket: ${order.durationId})</small></td>
                        <td style="text-align: center;">${order.qty}</td>
                        <td style="text-align: right;">Rp ${order.price.toLocaleString("id-ID")}</td>
                    </tr>
                </tbody>
            </table>

            <hr style="border:none; border-top: 1px dashed #000; margin-top: 15px; margin-bottom: 15px;">

            <table style="width: 100%; font-size: 0.95rem; font-weight: bold;">
                <tr>
                    <td>TOTAL AKHIR :</td>
                    <td style="text-align: right;">Rp ${order.price.toLocaleString("id-ID")}</td>
                </tr>
            </table>

            <div style="text-align: center; margin-top: 30px; font-size: 0.8rem; border-top: 1px dashed #000; padding-top: 10px;">
                <p>Terma kasih atas kepercayaan Anda!</p>
                <p>Pakaian bersih, hari lebih cerah.</p>
            </div>
        </div>
        <div style="margin-top: 24px; display:flex; gap:10px;">
            <button class="btn btn-outline" style="flex:1; justify-content:center;" onclick="window.print()"><i class="fa-solid fa-print"></i> Cetak PDF</button>
            <button class="btn btn-primary" style="flex:1; justify-content:center;" onclick="closeModal()">Tutup</button>
        </div>
    `;
};

// ==================== 11. LOGIN & REGISTER ROUTINES ====================
let activeLoginTab = "login";

window.toggleLoginTab = function(tab) {
    activeLoginTab = tab;
    const loginBtn = document.getElementById("tab-login-btn");
    const regBtn = document.getElementById("tab-register-btn");

    if (tab === "login") {
        loginBtn.classList.add("active");
        regBtn.classList.remove("active");
        document.getElementById("pane-login").style.display = "block";
        document.getElementById("pane-register").style.display = "none";
    } else {
        loginBtn.classList.remove("active");
        regBtn.classList.add("active");
        document.getElementById("pane-login").style.display = "none";
        document.getElementById("pane-register").style.display = "block";
    }
};

window.handleLoginSubmit = async function(event) {
    event.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const pass = document.getElementById("login-password").value;

    const res = await loginUser(email, pass);
    if (res.success) {
        document.getElementById("login-email").value = "";
        document.getElementById("login-password").value = "";
        
        // Redirect check
        if (window.cf_redirect_after_login) {
            const redirect = window.cf_redirect_after_login;
            window.cf_redirect_after_login = null;
            
            if (res.user.role === redirect.role) {
                switchView(redirect.role, redirect.subTab);
            } else {
                switchView(res.user.role);
            }
        } else {
            switchView(res.user.role);
        }
        await refreshDashboardViews();
        alert(`Login berhasil! Selamat datang, ${res.user.name}.`);
    } else {
        alert(res.msg);
    }
};

window.handleRegisterSubmit = async function(event) {
    event.preventDefault();
    const name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const phone = document.getElementById("reg-phone").value.trim();
    const pass = document.getElementById("reg-password").value;

    const res = await registerUser(name, email, phone, pass);
    if (res.success) {
        document.getElementById("reg-name").value = "";
        document.getElementById("reg-email").value = "";
        document.getElementById("reg-phone").value = "";
        document.getElementById("reg-password").value = "";

        switchView("customer");
        await refreshDashboardViews();
        alert(`Registrasi sukses! Selamat datang, ${res.user.name}.`);
    } else {
        alert(res.msg);
    }
};

// ==================== 12. SVG DYNAMIC CHARTS ====================
async function drawRevenueChart() {
    const orders = await fetchOrders();
    const container = document.getElementById("revenue-chart-container");
    if (!container) return;

    const completed = orders.filter(o => o.status === "completed");
    const days = [];
    const dates = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toLocaleDateString("id-ID", { weekday: 'short' }));
        dates.push(d.toDateString());
    }

    const revenueMap = {};
    dates.forEach(date => revenueMap[date] = 0);
    completed.forEach(o => {
        const str = new Date(o.dateCreated).toDateString();
        if (revenueMap[str] !== undefined) {
            revenueMap[str] += o.price;
        }
    });

    const values = dates.map(d => revenueMap[d]);
    const maxVal = Math.max(...values, 100000);

    const width = 500;
    const height = 220;
    const padding = 30;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = [];
    values.forEach((val, idx) => {
        const x = padding + (idx / (values.length - 1)) * chartWidth;
        const y = padding + chartHeight - (val / maxVal) * chartHeight;
        points.push({ x, y });
    });

    const pathData = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(" ");
    const fillPathData = `${pathData} L ${points[points.length-1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    container.innerHTML = `
        <svg viewBox="0 0 ${width} ${height}" class="svg-chart" style="overflow:visible;">
            <defs>
                <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.3"/>
                    <stop offset="100%" stop-color="var(--primary)" stop-opacity="0"/>
                </linearGradient>
            </defs>
            <line x1="${padding}" y1="${padding}" x2="${width - padding}" y2="${padding}" stroke="var(--border-color)" stroke-dasharray="4"/>
            <line x1="${padding}" y1="${padding + chartHeight/2}" x2="${width - padding}" y2="${padding + chartHeight/2}" stroke="var(--border-color)" stroke-dasharray="4"/>
            <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="var(--border-color)"/>
            <path d="${fillPathData}" fill="url(#chart-grad)"/>
            <path d="${pathData}" fill="none" stroke="var(--primary)" stroke-width="3" stroke-linecap="round"/>
            ${points.map((p, idx) => `
                <circle cx="${p.x}" cy="${p.y}" r="5" fill="var(--bg-secondary)" stroke="var(--primary)" stroke-width="2"/>
                <text x="${p.x}" y="${p.y - 10}" font-size="9" text-anchor="middle" font-weight="700" fill="var(--text-main)">
                    Rp ${(values[idx]/1000).toFixed(0)}k
                </text>
                <text x="${p.x}" y="${height - 10}" font-size="9" text-anchor="middle" fill="var(--text-muted)">
                    ${days[idx]}
                </text>
            `).join("")}
        </svg>
    `;
}

// ==================== 13. WHATSAPP DIALOG NOTIFIER ====================
const statusTranslations = {
    "pending-pickup": "Menunggu Penjemputan",
    "pickup-inprogress": "Kurir Menuju Lokasi",
    "washing": "Proses Cuci & Keringkan",
    "ready": "Selesai Cuci (Siap Diantar)",
    "delivering": "Kurir Mengantar Cucian",
    "completed": "Selesai (Sudah Diterima)"
};

function triggerStatusWhatsAppAlert(order) {
    let msg = "";
    const customer = order.customerName;
    const phone = order.customerPhone;
    
    switch (order.status) {
        case "pending-pickup":
            msg = `Halo Kak ${customer},\n\nPesanan laundry Anda dengan ID *${order.id}* telah berhasil didaftarkan. Kurir kami akan segera menjemput pakaian Anda pada waktu yang disepakati. Terima kasih!`;
            break;
        case "pickup-inprogress":
            msg = `Halo Kak ${customer},\n\nKurir kami sedang menuju alamat Anda untuk menjemput pakaian kotor Anda. Mohon siapkan pakaian Anda.`;
            break;
        case "washing":
            msg = `Halo Kak ${customer},\n\nPakaian Anda dengan ID *${order.id}* telah diterima di gerai. Setelah ditimbang, berat riil pakaian adalah *${order.qty} kg/pcs*, dengan total tagihan sebesar *Rp ${order.price.toLocaleString("id-ID")}*. Cucian sedang memasuki proses pembersihan.`;
            break;
        case "ready":
            msg = `Kabar gembira Kak ${customer}!\n\nCucian Anda dengan ID *${order.id}* telah selesai diproses. Pakaian kini wangi, bersih, dan rapi dilipat. Pakaian siap dijadwalkan untuk pengantaran.`;
            break;
        case "delivering":
            msg = `Halo Kak ${customer},\n\nKurir kami sedang membawa cucian Anda dari toko menuju alamat Anda. Harap bersiap di rumah!`;
            break;
        case "completed":
            msg = `Halo Kak ${customer},\n\nCucian dengan ID *${order.id}* telah sukses diserahterimakan. Silakan berikan review/ulasan terbaik Anda di aplikasi!`;
            break;
    }
    
    if (msg) {
        showWhatsAppToast(customer, phone, msg);
    }
}

function showWhatsAppToast(customerName, phone, messageText) {
    playNotificationSound();
    const container = document.getElementById("wa-toast-container");
    const toast = document.createElement("div");
    toast.className = "wa-toast";
    
    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    
    toast.innerHTML = `
        <div class="wa-toast-avatar"><i class="fab fa-whatsapp"></i></div>
        <div class="wa-toast-body">
            <div class="wa-toast-title">
                <span>CleanFlow Laundry</span>
                <span class="wa-toast-time">${timeStr}</span>
            </div>
            <div style="font-size: 0.75rem; font-weight:600; opacity: 0.9;">Ke: ${customerName} (${phone})</div>
            <div class="wa-toast-text">${messageText}</div>
        </div>
        <button class="wa-toast-close" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></button>
    `;
    
    container.appendChild(toast);
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = "slideInRight 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28) reverse forwards";
            setTimeout(() => toast.remove(), 300);
        }
    }, 8000);
}

function playNotificationSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const playBeep = (freq, duration, delay) => {
            setTimeout(() => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = "sine";
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + duration);
            }, delay);
        };
        playBeep(880, 0.15, 0);
        playBeep(1200, 0.25, 120);
    } catch (e) {}
}

// Global modal close wrapper
window.closeModal = function() {
    document.getElementById("modal-overlay").classList.remove("active");
};

// QRIS Popup helper
function openQRISModal(order) {
    const overlay = document.getElementById("modal-overlay");
    const wrapper = document.getElementById("modal-content-wrapper");
    
    overlay.classList.add("active");
    wrapper.innerHTML = `
        <div class="modal-header">
            <h3>Pembayaran QRIS Dinamis</h3>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div style="text-align: center; padding: 15px;">
            <p style="margin-bottom: 12px; font-weight:600;">Scan QRIS di bawah ini untuk membayar:</p>
            <div style="background: white; padding: 16px; display: inline-block; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 15px;">
                <svg width="200" height="200" viewBox="0 0 100 100" style="display:block;">
                    <rect width="100" height="100" fill="white"/>
                    <rect x="5" y="5" width="20" height="20" fill="black"/>
                    <rect x="10" y="10" width="10" height="10" fill="white"/>
                    <rect x="75" y="5" width="20" height="20" fill="black"/>
                    <rect x="80" y="10" width="10" height="10" fill="white"/>
                    <rect x="5" y="75" width="20" height="20" fill="black"/>
                    <rect x="10" y="80" width="10" height="10" fill="white"/>
                    <rect x="30" y="30" width="10" height="10" fill="black"/>
                    <rect x="50" y="30" width="15" height="5" fill="black"/>
                    <rect x="35" y="45" width="20" height="15" fill="black"/>
                    <rect x="65" y="65" width="15" height="15" fill="black"/>
                    <rect x="45" y="75" width="10" height="10" fill="black"/>
                    <rect x="75" y="45" width="15" height="10" fill="black"/>
                </svg>
            </div>
            <h4 style="color: var(--primary); font-size:1.3rem;">Rp ${order.price.toLocaleString("id-ID")}</h4>
            <p style="font-size:0.75rem; color:var(--text-muted); margin-top: 6px;">Status: Menunggu Pembayaran...</p>
            <div style="margin-top: 24px; display:flex; gap:10px; justify-content:center;">
                <button class="btn btn-primary" id="btn-simulate-qris-paid">Simulasikan Pembayaran Sukses</button>
            </div>
        </div>
    `;

    document.getElementById("btn-simulate-qris-paid").onclick = async function() {
        await updateOrderFields(order.id, { paymentStatus: 'paid' });
        closeModal();
        alert("Pembayaran QRIS sukses diverifikasi!");
        await refreshDashboardViews();
        switchCustTab("cust-dashboard", document.querySelector('[onclick*="cust-dashboard"]'));
        initBookingWizard();
    };
}

// Global theme control binding
window.toggleTheme = function() {
    const body = document.body;
    const btn = document.getElementById("theme-toggle");
    if (body.classList.contains("dark-mode")) {
        body.classList.remove("dark-mode");
        btn.innerHTML = `<i class="fa-solid fa-moon"></i>`;
    } else {
        body.classList.add("dark-mode");
        btn.innerHTML = `<i class="fa-solid fa-sun"></i>`;
    }
};

window.scrollToCalculator = function() {
    document.getElementById("calculator-section")?.scrollIntoView({ behavior: "smooth" });
};

// Bind switchView to window
window.switchView = switchView;
window.tryNavigateToRole = tryNavigateToRole;
window.logoutUser = logoutUser;

// ==================== 14. INITIALISATION ====================
window.addEventListener("DOMContentLoaded", async () => {
    checkLocalStorageSeed();
    updateConnectionBadge();
    checkActiveSession();
    
    // Seed landing elements
    await initLandingServiceCalculator();
    await initPOS();
    await refreshDashboardViews();
});

// Multi-tab synchronisation listener
window.addEventListener("storage", async (e) => {
    if (e.key === "cf_session") {
        checkActiveSession();
        await refreshDashboardViews();
    } else if (e.key.startsWith("cf_")) {
        await refreshDashboardViews();
    }
});
