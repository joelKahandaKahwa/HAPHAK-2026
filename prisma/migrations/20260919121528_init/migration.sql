-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "registrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "registration_number" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "first_name" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "marital_status" TEXT NOT NULL,
    "birth_date" DATETIME,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT,
    "email" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "neighborhood" TEXT,
    "commune" TEXT,
    "province" TEXT,
    "country" TEXT NOT NULL,
    "family_status" TEXT,
    "family_size" INTEGER,
    "children_count" INTEGER,
    "emergency_contact_name" TEXT NOT NULL,
    "emergency_contact_phone" TEXT NOT NULL,
    "emergency_contact_relationship" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "arrival_city" TEXT NOT NULL,
    "transport_method" TEXT NOT NULL,
    "full_retreat" TEXT NOT NULL,
    "arrival_date" DATETIME,
    "departure_date" DATETIME,
    "organization_member" BOOLEAN NOT NULL DEFAULT false,
    "department" TEXT,
    "accommodation_required" BOOLEAN NOT NULL DEFAULT false,
    "nights" INTEGER,
    "accommodation_type" TEXT,
    "coming_with_others" BOOLEAN NOT NULL DEFAULT false,
    "companions_count" INTEGER,
    "special_needs" TEXT,
    "comments" TEXT,
    "observations" TEXT,
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'REGISTERED',
    "qr_token" TEXT NOT NULL,
    "email_status" TEXT NOT NULL DEFAULT 'EMAIL_PENDING',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "registration_id" TEXT NOT NULL,
    "scanned_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scanned_by" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    CONSTRAINT "attendance_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "registrations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "attendance_scanned_by_fkey" FOREIGN KEY ("scanned_by") REFERENCES "admins" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "retreat_settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "name" TEXT NOT NULL DEFAULT 'HAPHAK 2026',
    "meaning" TEXT NOT NULL DEFAULT 'Transforme',
    "theme" TEXT NOT NULL DEFAULT 'Marche devant ma face',
    "dates_label" TEXT NOT NULL DEFAULT 'Du 27 au 30 septembre 2026',
    "start_time" TEXT NOT NULL DEFAULT 'Dimanche 27 septembre à 17h00',
    "location" TEXT NOT NULL DEFAULT 'Q. Kyeshero, Av. Topographe N°1, réf. Entrée Tshengerero',
    "description" TEXT,
    "contact_phone" TEXT DEFAULT '+243 816 366 894',
    "contact_email" TEXT,
    "whatsapp" TEXT,
    "registration_opens_at" DATETIME,
    "registration_closes_at" DATETIME,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "retreat_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "date" DATETIME,
    "time" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_username_key" ON "admins"("username");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_registration_number_key" ON "registrations"("registration_number");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_qr_token_key" ON "registrations"("qr_token");

-- CreateIndex
CREATE INDEX "registrations_registration_number_idx" ON "registrations"("registration_number");

-- CreateIndex
CREATE INDEX "registrations_email_idx" ON "registrations"("email");

-- CreateIndex
CREATE INDEX "registrations_phone_idx" ON "registrations"("phone");

-- CreateIndex
CREATE INDEX "registrations_city_idx" ON "registrations"("city");

-- CreateIndex
CREATE INDEX "registrations_gender_idx" ON "registrations"("gender");

-- CreateIndex
CREATE INDEX "registrations_created_at_idx" ON "registrations"("created_at");

-- CreateIndex
CREATE INDEX "registrations_qr_token_idx" ON "registrations"("qr_token");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_registration_id_key" ON "attendance"("registration_id");

-- CreateIndex
CREATE INDEX "attendance_scanned_at_idx" ON "attendance"("scanned_at");
