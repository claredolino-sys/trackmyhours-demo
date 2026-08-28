import fs from 'fs';

let code = fs.readFileSync('services/api.ts', 'utf8');

// Add localforage import
code = code.replace(
  "import { supabase, isSupabaseActive } from './supabaseClient';",
  "import { supabase, isSupabaseActive } from './supabaseClient';\nimport localforage from 'localforage';"
);

// Replace getLocal and setLocal definitions
code = code.replace(
  /const getLocal = <T>\(key: string, defaultVal: T\): T => \{[\s\S]*?\};/,
  `const getLocal = async <T>(key: string, defaultVal: T): Promise<T> => {
    try {
        const item = await localforage.getItem<T>(key);
        return item !== null ? item : defaultVal;
    } catch {
        return defaultVal;
    }
};`
);

code = code.replace(
  /const setLocal = \(key: string, value: any\) => \{[\s\S]*?\};/,
  `const setLocal = async (key: string, value: any) => {
    try {
        await localforage.setItem(key, value);
    } catch (e) {
        console.error('localforage setItem error:', e);
    }
};`
);

// Replace all getLocal calls with await getLocal
code = code.replace(/getLocal</g, 'await getLocal<');
// Replace all setLocal calls with await setLocal
code = code.replace(/setLocal\(/g, 'await setLocal(');

// Fix the definition of getLocal and setLocal which we just prefixed with await
code = code.replace(/const await getLocal = async/g, 'const getLocal = async');
code = code.replace(/const await setLocal = async/g, 'const setLocal = async');

fs.writeFileSync('services/api.ts', code);
