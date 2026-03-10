import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, loadEnv, Plugin } from 'vite';
import { execSync } from 'child_process';

// 创建路由生成插件
function generateRoutesPlugin(): Plugin {
  return {
    name: 'generate-routes',
    buildStart() {
      // 构建开始时生成路由
      try {
        execSync('node scripts/generate-routes.js', { stdio: 'inherit' });
      } catch (error) {
        console.error('生成路由失败:', error);
      }
    },
    handleHotUpdate({ file, server }) {
      // 开发模式下监听路由文件变化
      const routerPath = path.resolve(__dirname, 'src/router.tsx');
      if (file === routerPath) {
        console.log('🔄 检测到路由文件变化，正在更新路由列表...');
        try {
          execSync('node scripts/generate-routes.js', { stdio: 'inherit' });
          // 触发 HMR 更新 index.html
          server.ws.send({
            type: 'update',
            updates: [
              {
                type: 'js-update',
                path: '/index.html',
                acceptedPath: '/index.html',
                timestamp: Date.now(),
              },
            ],
          });
        } catch (error) {
          console.error('❌ 更新路由列表失败:', error);
        }
      }
    },
  };
}

export default defineConfig(({ command, mode }) => {
  // 加载环境变量 - 第二个参数是目录路径，不是文件名
  const env = loadEnv(mode, process.cwd(), '');
  const shouldAnalyze =
    process.argv.includes('--analyze') || env.ANALYZE === 'true';
  return {
    build: {
      assetsDir: 'panda-wiki-admin-assets',
    },
    server: {
      hmr: true,
      proxy: {
        '/api': {
          target: env.TARGET,
          secure: false,
          changeOrigin: true,
        },
        '/static-file': {
          target: env.STATIC_FILE_TARGET,
          secure: false,
          changeOrigin: true,
        },
        '/share': {
          target: env.SHARE_TARGET,
          secure: false,
          changeOrigin: true,
        },
      },
      host: '0.0.0.0',
    },
    esbuild: {
      // 保留函数和类名，避免第三方库依赖 constructor.name 的逻辑在压缩后失效
      keepNames: true,
    },
    optimizeDeps: {
      include: [
        'graphology',
        'graphology-layout-forceatlas2',
        'graphology-layout-noverlap',
        'graphology-utils',
        '@sigma/edge-curve',
      ],
    },
    plugins: [
      react(),
      generateRoutesPlugin(),
      ...(command === 'build' && shouldAnalyze
        ? [
            visualizer({
              open: true, // 在默认浏览器中自动打开报告
              gzipSize: true, // 显示 gzip 格式下的包大小
              brotliSize: true, // 显示 brotli 格式下的包大小
              filename: 'dist/stats.html', // 分析图生成的文件名
            }),
          ]
        : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        'graphology-utils/getters': path.resolve(
          __dirname,
          '../node_modules/.pnpm/graphology-utils@2.5.2_graphology-types@0.24.8/node_modules/graphology-utils/getters.js',
        ),
      },
    },
  };
});
