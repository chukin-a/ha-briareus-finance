import { readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { MigrationInterface, QueryRunner } from 'typeorm';

/** Removes the obsolete photo/OCR receipt drafts after QR receipts became transaction metadata. */
export class ClearLegacyReceiptFiles1710000010000 implements MigrationInterface {
  name = 'ClearLegacyReceiptFiles1710000010000';

  async up(q: QueryRunner): Promise<void> {
    await q.query('DELETE FROM receipts');
    const directory = join(process.env.DATA_DIR || './data', 'receipts');
    const files = await readdir(directory).catch(() => [] as string[]);
    await Promise.all(files.map(file => rm(join(directory, file), { force: true })));
  }

  async down(): Promise<void> {
    // Legacy receipt photos and drafts cannot be restored.
  }
}
