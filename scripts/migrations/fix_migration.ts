import fs from 'fs';

let code = fs.readFileSync('services/api.ts', 'utf8');

const migrationCode = `
            // --- Migration from localStorage to localforage ---
            for (const key of Object.values(KEYS)) {
                try {
                    const localItem = localStorage.getItem(key);
                    if (localItem) {
                        const parsed = JSON.parse(localItem);
                        const existingForage = await localforage.getItem(key);
                        if (!existingForage) {
                            console.log(\`Migrating \${key} from localStorage to localforage...\`);
                            await localforage.setItem(key, parsed);
                        }
                    }
                } catch (e) {
                    console.error('Migration error for', key, e);
                }
            }
`;

code = code.replace(
    "console.log('TrackMyHours: Using LocalStorage backend (Supabase credentials missing)');",
    "console.log('TrackMyHours: Using LocalStorage backend (Supabase credentials missing)');\n" + migrationCode
);

fs.writeFileSync('services/api.ts', code);
