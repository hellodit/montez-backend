import { eq } from "drizzle-orm";
import { auth } from "../../modules/auth/auth";
import { db } from "../client";
import { user } from "../schema";


const ADMIN_EMAIL = "user@montezai.com";
const ADMIN_PASSWORD = "user123"; // Better Auth: minimal 8 karakter
const ADMIN_NAME = "Admin Montez AI";

async function seedAdmin(): Promise<void> {
    const adminEmail = ADMIN_EMAIL;
    const adminPassword = ADMIN_PASSWORD;
    const adminName = ADMIN_NAME;

    // Idempotensi: kalau user sudah ada, cukup pastikan dia admin lalu selesai.
    const [existing] = await db
        .select({ id: user.id, isAdmin: user.isAdmin })
        .from(user)
        .where(eq(user.email, adminEmail))
        .limit(1);

    if (existing) {
        if (!existing.isAdmin) {
            await db
                .update(user)
                .set({ isAdmin: true })
                .where(eq(user.id, existing.id));
            console.log(`✔ User ${adminEmail} already exists — isAdmin flag set to true.`);
        } else {
            console.log(`✔ Admin ${adminEmail} already exists — nothing changed.`);
        }
        return;
    }

    // Buat user lewat Better Auth (hash password + baris account terbentuk benar).
    await auth.api.signUpEmail({
        body: { name: adminName, email: adminEmail, password: adminPassword },
    });

    // Naikkan ke admin + tandai email terverifikasi (admin bootstrap tepercaya).
    await db
        .update(user)
        .set({ isAdmin: true, emailVerified: true })
        .where(eq(user.email, adminEmail));

    console.log(`✅ Admin created: ${adminEmail} (name: ${adminName}).`);
}

seedAdmin()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("❌ Seeding failed:", err);
        process.exit(1);
    });
