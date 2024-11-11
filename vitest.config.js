import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    // Sets up default mock directory location
    mockPath: '__mocks__',

    environment: 'jsdom', // Use jsdom environment
    
    exclude: ['node_modules', 'dist'],
  },
});
