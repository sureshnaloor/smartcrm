CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"tax_id" text,
	"address" text,
	"city" text,
	"state" text,
	"postal_code" text,
	"country" text,
	"email" text,
	"phone" text,
	"notes" text,
	"is_from_central_repo" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "company_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"master_item_id" integer,
	"code" text,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"unit_of_measure" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"cost" numeric(10, 2),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"tax_id" text,
	"address" text,
	"city" text,
	"state" text,
	"postal_code" text,
	"country" text,
	"phone" text,
	"email" text,
	"website" text,
	"logo_url" text,
	"bank_name" text,
	"bank_account_name" text,
	"bank_account_number" text,
	"bank_routing_number" text,
	"bank_swift_bic" text,
	"bank_iban" text,
	"is_default" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "company_terms" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"master_term_id" integer,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"file_path" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"quotation_item_id" integer,
	"description" text NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"discount" numeric(5, 2) DEFAULT '0',
	"amount" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"preview_url" text,
	"is_default" boolean DEFAULT false,
	"is_premium" boolean DEFAULT false,
	"type" text DEFAULT 'both'
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"company_profile_id" integer NOT NULL,
	"client_id" integer NOT NULL,
	"quotation_id" integer,
	"invoice_number" text NOT NULL,
	"invoice_date" timestamp NOT NULL,
	"due_date" timestamp,
	"country" text NOT NULL,
	"currency" text NOT NULL,
	"template_id" text DEFAULT 'classic',
	"subtotal" numeric(10, 2) NOT NULL,
	"discount" numeric(10, 2) DEFAULT '0',
	"tax" numeric(10, 2) DEFAULT '0',
	"tax_rate" numeric(5, 2),
	"total" numeric(10, 2) NOT NULL,
	"notes" text,
	"terms" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"pdf_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "master_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"unit_of_measure" text NOT NULL,
	"default_price" numeric(10, 2),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "master_items_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "master_terms" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "material_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"master_item_id" integer NOT NULL,
	"quotation_id" integer,
	"used_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotation_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"quotation_id" integer NOT NULL,
	"document_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotation_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"quotation_id" integer NOT NULL,
	"company_item_id" integer,
	"master_item_id" integer,
	"description" text NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"discount" numeric(5, 2) DEFAULT '0',
	"amount" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotation_terms" (
	"id" serial PRIMARY KEY NOT NULL,
	"quotation_id" integer NOT NULL,
	"company_term_id" integer,
	"master_term_id" integer,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"company_profile_id" integer NOT NULL,
	"client_id" integer NOT NULL,
	"quote_number" text NOT NULL,
	"quote_date" timestamp NOT NULL,
	"valid_until" timestamp,
	"country" text NOT NULL,
	"currency" text NOT NULL,
	"template_id" text DEFAULT 'classic',
	"subtotal" numeric(10, 2) NOT NULL,
	"discount" numeric(10, 2) DEFAULT '0',
	"tax" numeric(10, 2) DEFAULT '0',
	"tax_rate" numeric(5, 2),
	"total" numeric(10, 2) NOT NULL,
	"notes" text,
	"terms" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"pdf_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"interval" text NOT NULL,
	"features" jsonb NOT NULL,
	"invoice_quota" integer NOT NULL,
	"quote_quota" integer NOT NULL,
	"material_records_limit" integer DEFAULT -1,
	"includes_central_masters" boolean DEFAULT false,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "tax_rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"country" text NOT NULL,
	"country_code" text NOT NULL,
	"name" text NOT NULL,
	"rate" numeric(5, 2) NOT NULL,
	"is_default" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"password_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"plan_id" text DEFAULT 'free' NOT NULL,
	"invoice_quota" integer DEFAULT 10,
	"invoices_used" integer DEFAULT 0,
	"quote_quota" integer DEFAULT 10,
	"quotes_used" integer DEFAULT 0,
	"material_records_used" integer DEFAULT 0,
	"subscription_status" text DEFAULT 'active',
	"subscription_expires_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_items" ADD CONSTRAINT "company_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_items" ADD CONSTRAINT "company_items_master_item_id_master_items_id_fk" FOREIGN KEY ("master_item_id") REFERENCES "public"."master_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_profiles" ADD CONSTRAINT "company_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_terms" ADD CONSTRAINT "company_terms_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_terms" ADD CONSTRAINT "company_terms_master_term_id_master_terms_id_fk" FOREIGN KEY ("master_term_id") REFERENCES "public"."master_terms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_quotation_item_id_quotation_items_id_fk" FOREIGN KEY ("quotation_item_id") REFERENCES "public"."quotation_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_company_profile_id_company_profiles_id_fk" FOREIGN KEY ("company_profile_id") REFERENCES "public"."company_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_usage" ADD CONSTRAINT "material_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_usage" ADD CONSTRAINT "material_usage_master_item_id_master_items_id_fk" FOREIGN KEY ("master_item_id") REFERENCES "public"."master_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_usage" ADD CONSTRAINT "material_usage_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_documents" ADD CONSTRAINT "quotation_documents_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_documents" ADD CONSTRAINT "quotation_documents_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_company_item_id_company_items_id_fk" FOREIGN KEY ("company_item_id") REFERENCES "public"."company_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_master_item_id_master_items_id_fk" FOREIGN KEY ("master_item_id") REFERENCES "public"."master_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_terms" ADD CONSTRAINT "quotation_terms_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_terms" ADD CONSTRAINT "quotation_terms_company_term_id_company_terms_id_fk" FOREIGN KEY ("company_term_id") REFERENCES "public"."company_terms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_terms" ADD CONSTRAINT "quotation_terms_master_term_id_master_terms_id_fk" FOREIGN KEY ("master_term_id") REFERENCES "public"."master_terms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_company_profile_id_company_profiles_id_fk" FOREIGN KEY ("company_profile_id") REFERENCES "public"."company_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;