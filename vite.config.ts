import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
const apiPort = Number(process.env.PORT || 3001);
export default defineConfig({plugins:[react()],server:{host:'127.0.0.1',port:Number(process.env.VITE_PORT || 5174),proxy:{'/api':`http://127.0.0.1:${apiPort}`,'/health':`http://127.0.0.1:${apiPort}`,'/version':`http://127.0.0.1:${apiPort}`}}});
