import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Expose dev server + preview on the local network (LAN) so other
  // devices on the same Wi-Fi can open the ERP by this machine's IP.
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
  test: {
    // Playwright e2e specs live separately and shouldn't be run by vitest
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
  },
})
