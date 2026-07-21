import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

// Load environment variables from server/.env
dotenv.config();

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
});
