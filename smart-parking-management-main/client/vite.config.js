import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    
    // URL backend: dùng biến môi trường khi production, localhost khi dev
    const apiTarget = env.VITE_API_URL || 'http://localhost:5000'

    return {
        plugins: [react()],
        server: {
            port: 5173,
            proxy: {
                '/api': {
                    target: apiTarget,
                    changeOrigin: true
                },
                '/socket.io': {
                    target: apiTarget,
                    changeOrigin: true,
                    ws: true     // WebSocket proxy cho Socket.IO
                }
            },
            headers: {
                'Cache-Control': 'no-store'
            }
        },
        build: {
            outDir: 'dist',
            sourcemap: false,
            rollupOptions: {
                output: {
                    manualChunks: {
                        vendor: ['react', 'react-dom', 'react-router-dom'],
                        charts: ['chart.js', 'react-chartjs-2'],
                        socket: ['socket.io-client']
                    }
                }
            }
        },
        optimizeDeps: {
            exclude: ['onnxruntime-web']
        }
    }
})
