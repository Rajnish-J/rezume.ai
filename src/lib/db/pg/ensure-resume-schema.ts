import { sql } from "drizzle-orm";

import { pgdb } from "@/src/lib/db/pg/db";

let ensuredResumeStorageColumns = false;

export async function ensureResumeStorageColumnsExist(): Promise<void> {
  if (ensuredResumeStorageColumns) {
    return;
  }

  await pgdb.execute(sql`
    ALTER TABLE "resumes"
    ADD COLUMN IF NOT EXISTS "fileMimeType" varchar(120);
  `);

  await pgdb.execute(sql`
    ALTER TABLE "resumes"
    ADD COLUMN IF NOT EXISTS "fileDataBase64" text;
  `);

  // Backward compatibility: if a previous binary column ("fileData") exists,
  // copy it into the new base64 field once so rendering can work immediately.
  await pgdb.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'resumes'
          AND column_name = 'fileData'
      ) THEN
        EXECUTE '
          UPDATE "resumes"
          SET "fileDataBase64" = encode("fileData", ''base64'')
          WHERE "fileDataBase64" IS NULL
            AND "fileData" IS NOT NULL
        ';
      END IF;
    END
    $$;
  `);

  ensuredResumeStorageColumns = true;
}
