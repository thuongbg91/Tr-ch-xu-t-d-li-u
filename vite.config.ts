import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    return {
        // ⭐️ THAY ĐỔI QUAN TRỌNG: Thêm 'base' để dùng đường dẫn tương đối
        base: './', 

        server: {
            port: 3000,
            host: '0.0.0.0',
        },
        plugins: [react()],
        
        // CẢNH BÁO QUAN TRỌNG: KHÔNG NÊN LÀM ĐIỀU NÀY!
        // Việc 'define' API Key như thế này sẽ NHÚNG TRỰC TIẾP khóa API vào code frontend.
        // Điều này khiến khóa API của bạn bị lộ ra ngoài.
        // Hãy loại bỏ phần này nếu bạn muốn bảo mật khóa API.
        define: {
             // 'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
             // 'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
        },
        
        resolve: {
            alias: {
                // Đã sửa lại path.resolve để trỏ đến thư mục src (nếu bạn có)
                // Nếu bạn dùng alias '@' cho thư mục gốc, thì để nguyên như của bạn
                '@': path.resolve(__dirname, './src'), 
            }
        }
    };
});