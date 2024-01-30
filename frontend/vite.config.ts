import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import 'dotenv/config'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    define: {
      'process.env': env
    },
    plugins: [react()],
  }
})
