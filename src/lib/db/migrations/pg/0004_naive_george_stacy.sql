CREATE TABLE IF NOT EXISTS "resume_chat_messages" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "resume_chat_messages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"chatId" integer NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resume_chats" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "resume_chats_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"resumeId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN IF NOT EXISTS "fileMimeType" varchar(120);--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN IF NOT EXISTS "fileDataBase64" text;--> statement-breakpoint
ALTER TABLE "resume_chat_messages" ADD CONSTRAINT "resume_chat_messages_chatId_resume_chats_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."resume_chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resume_chats" ADD CONSTRAINT "resume_chats_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resume_chats" ADD CONSTRAINT "resume_chats_resumeId_resumes_id_fk" FOREIGN KEY ("resumeId") REFERENCES "public"."resumes"("id") ON DELETE cascade ON UPDATE no action;