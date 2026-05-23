// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import {
    computePrice,
    mapDatabaseOrderToModel,
    mapDatabaseServiceToModel,
    isUserAuthorized
} from "./app.js";

// Mock Services, Treatments, and Durations data for testing
const mockServices = [
    { id: "kiloan", name: "Cuci Kiloan", category: "Kiloan", basePrice: 8000 },
    { id: "jas", name: "Cuci Jas / Blazer", category: "Satuan", basePrice: 35000 },
    { id: "selimut", name: "Bed Cover / Selimut", category: "Satuan", basePrice: 25000 },
    { id: "sepatu", name: "Cuci Sepatu Premium", category: "Satuan", basePrice: 30000 }
];

const mockTreatments = {
    cuciLipat: { id: "cuci-lipat", name: "Cuci Kering Lipat", multiplier: 1.0 },
    cuciSetrika: { id: "cuci-setrika", name: "Cuci Kering Setrika", multiplier: 1.2 },
    setrikaSaja: { id: "setrika", name: "Setrika Saja", multiplier: 0.8 }
};

const mockDurations = {
    reguler: { id: "reguler", name: "Reguler (2-3 Hari)", multiplier: 1.0, hours: 72 },
    ekspres: { id: "ekspres", name: "Ekspres (24 Jam)", multiplier: 1.5, hours: 24 },
    flash: { id: "flash", name: "Flash (6 Jam)", multiplier: 2.0, hours: 6 }
};

describe("CleanFlow Business Logic Unit Tests", () => {

    describe("1. Harga Laundry Kiloan (computePrice)", () => {
        it("Harus menghitung harga reguler kiloan dasar (Cuci Kiloan, Reguler, Cuci Lipat, 4.5 Kg)", () => {
            const result = computePrice({
                selectedService: mockServices[0], // Kiloan, basePrice: 8000
                treatment: mockTreatments.cuciLipat, // multiplier: 1.0
                duration: mockDurations.reguler, // multiplier: 1.0
                weight: 4.5,
                bookSelectedItems: {},
                services: mockServices,
                selectedCouponCode: null
            });

            // 8000 * 1.0 * 1.0 * 4.5 = 36000
            expect(result.base).toBe(36000);
            expect(result.discount).toBe(0);
            expect(result.final).toBe(36000);
            expect(result.qtyDetails).toBe("4.5 Kg");
        });

        it("Harus menghitung harga kiloan dengan penyesuaian treatment & durasi (Cuci Kiloan, Ekspres, Cuci Setrika, 3 Kg)", () => {
            const result = computePrice({
                selectedService: mockServices[0], // Kiloan, basePrice: 8000
                treatment: mockTreatments.cuciSetrika, // multiplier: 1.2
                duration: mockDurations.ekspres, // multiplier: 1.5
                weight: 3.0,
                bookSelectedItems: {},
                services: mockServices,
                selectedCouponCode: null
            });

            // 8000 * 1.2 * 1.5 * 3.0 = 43200
            expect(result.base).toBe(43200);
            expect(result.final).toBe(43200);
        });

        it("Harus membulatkan nilai desimal akhir dengan benar", () => {
            const result = computePrice({
                selectedService: mockServices[0], // Kiloan, basePrice: 8000
                treatment: mockTreatments.cuciSetrika, // multiplier: 1.2
                duration: mockDurations.ekspres, // multiplier: 1.5
                weight: 2.37, // nilai tidak bulat
                bookSelectedItems: {},
                services: mockServices,
                selectedCouponCode: null
            });

            // 8000 * 1.2 * 1.5 * 2.37 = 34128
            expect(result.base).toBe(34128);
            expect(result.final).toBe(34128);
        });
    });

    describe("2. Harga Laundry Satuan (computePrice)", () => {
        it("Harus menghitung subtotal beberapa item satuan (1 Jas + 2 Sepatu)", () => {
            const selectedItems = {
                "jas": 1, // 1 * 35000 = 35000
                "sepatu": 2, // 2 * 30000 = 60000
                "selimut": 0
            };

            const result = computePrice({
                selectedService: mockServices[1], // Satuan (Jas)
                treatment: mockTreatments.cuciLipat, // multiplier: 1.0
                duration: mockDurations.reguler, // multiplier: 1.0
                weight: 0, // diabaikan karena Satuan
                bookSelectedItems: selectedItems,
                services: mockServices,
                selectedCouponCode: null
            });

            // Subtotal: 35000 + 60000 = 95000
            // Total: 95000 * 1.0 * 1.0 = 95000
            expect(result.base).toBe(95000);
            expect(result.final).toBe(95000);
            expect(result.qtyDetails).toBe("1x Jas / Blazer, 2x Sepatu Premium");
        });

        it("Harus menghitung harga satuan dengan treatment & durasi premium", () => {
            const selectedItems = {
                "jas": 2 // 2 * 35000 = 70000
            };

            const result = computePrice({
                selectedService: mockServices[1],
                treatment: mockTreatments.cuciSetrika, // multiplier: 1.2
                duration: mockDurations.flash, // multiplier: 2.0
                weight: 0,
                bookSelectedItems: selectedItems,
                services: mockServices,
                selectedCouponCode: null
            });

            // 70000 * 1.2 * 2.0 = 168000
            expect(result.base).toBe(168000);
            expect(result.final).toBe(168000);
        });
    });

    describe("3. Kupon Diskon (BARU20)", () => {
        it("Harus menerapkan diskon 20% jika kode voucher 'BARU20' valid", () => {
            const result = computePrice({
                selectedService: mockServices[0], // Kiloan, basePrice: 8000
                treatment: mockTreatments.cuciLipat, // multiplier: 1.0
                duration: mockDurations.reguler, // multiplier: 1.0
                weight: 5.0, // 5 * 8000 = 40000
                bookSelectedItems: {},
                services: mockServices,
                selectedCouponCode: "BARU20"
            });

            // Base: 40000
            // Diskon: 20% * 40000 = 8000
            // Final: 32000
            expect(result.base).toBe(40000);
            expect(result.discount).toBe(8000);
            expect(result.final).toBe(32000);
        });

        it("Harus mengabaikan diskon jika kode voucher salah atau null", () => {
            const result = computePrice({
                selectedService: mockServices[0],
                treatment: mockTreatments.cuciLipat,
                duration: mockDurations.reguler,
                weight: 5.0,
                bookSelectedItems: {},
                services: mockServices,
                selectedCouponCode: "SALAH10"
            });

            expect(result.base).toBe(40000);
            expect(result.discount).toBe(0);
            expect(result.final).toBe(40000);
        });
    });

    describe("4. Pemetaan Database (Mappers)", () => {
        it("Harus memetakan data database Supabase (snake_case) ke model JS (camelCase) untuk orders", () => {
            const dbOrderMock = {
                id: "TR-9999",
                customer_name: "John Doe",
                customer_phone: "089999",
                service_id: "kiloan",
                treatment_id: "cuci-lipat",
                duration_id: "reguler",
                qty: "4.5",
                price: "36000",
                address: "Alamat Tes",
                status: "washing",
                courier_id: "uuid-kurir",
                notes: "Catatan tes",
                pickup_date: "2026-05-23",
                pickup_time: "09:00",
                delivery_date: "2026-05-26",
                delivery_time: "14:00",
                payment_method: "cod",
                payment_status: "unpaid",
                rating: 5,
                review_text: "Bagus",
                date_created: "2026-05-23T00:00:00Z",
                customer_id: "uuid-customer"
            };

            const model = mapDatabaseOrderToModel(dbOrderMock);

            expect(model.id).toBe("TR-9999");
            expect(model.customerName).toBe("John Doe");
            expect(model.customerPhone).toBe("089999");
            expect(model.qty).toBe(4.5); // parsed to float
            expect(model.price).toBe(36000); // parsed to float
            expect(model.courierId).toBe("uuid-kurir");
            expect(model.paymentMethod).toBe("cod");
            expect(model.paymentStatus).toBe("unpaid");
            expect(model.customer_id).toBe("uuid-customer");
        });

        it("Harus memetakan data database Supabase (snake_case) ke model JS (camelCase) untuk services", () => {
            const dbServiceMock = {
                id: "kiloan",
                name: "Cuci Kiloan",
                category: "Kiloan",
                base_price: "8000"
            };

            const model = mapDatabaseServiceToModel(dbServiceMock);

            expect(model.id).toBe("kiloan");
            expect(model.name).toBe("Cuci Kiloan");
            expect(model.category).toBe("Kiloan");
            expect(model.basePrice).toBe(8000); // mapped & parsed from base_price
        });
    });

    describe("5. Otorisasi Akses Pengguna", () => {
        it("Harus menyetujui jika role pengguna sesuai dengan role halaman", () => {
            const authorized = isUserAuthorized("admin", "admin");
            expect(authorized).toBe(true);
        });

        it("Harus menolak jika role pengguna tidak cocok dengan role halaman", () => {
            const authorized = isUserAuthorized("customer", "admin");
            expect(authorized).toBe(false);
        });
    });
});
