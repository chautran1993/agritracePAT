import {defineConfig} from 'vitest/config';
export default defineConfig({test:{include:['src/features/plots/**/*.test.ts'],environment:'node'}});
