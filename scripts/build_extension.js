import { build } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

async function buildExtension() {
  console.log('🚀 Building BetterPrompt Chrome Extension...');

  // 1. Build Popup & Demo HTML
  console.log('📦 Step 1: Building Popup & Web Assets...');
  await build({
    configFile: false,
    root: rootDir,
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(rootDir, './src'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: path.resolve(rootDir, 'index.html'),
          popup: path.resolve(rootDir, 'popup.html'),
        },
      },
    },
  });

  // 2. Build Background Service Worker
  console.log('⚙️ Step 2: Building Background Service Worker...');
  await build({
    configFile: false,
    root: rootDir,
    resolve: {
      alias: {
        '@': path.resolve(rootDir, './src'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      lib: {
        entry: path.resolve(rootDir, 'src/background/index.ts'),
        name: 'background',
        formats: ['es'],
        fileName: () => 'background.js',
      },
      rollupOptions: {
        output: {
          entryFileNames: 'background.js',
        },
      },
    },
  });

  // 3. Build Content Script (IIFE single bundle)
  console.log('💉 Step 3: Building Content Script (In-Page Injector)...');
  await build({
    configFile: false,
    root: rootDir,
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(rootDir, './src'),
      },
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      lib: {
        entry: path.resolve(rootDir, 'src/content/index.tsx'),
        name: 'content',
        formats: ['iife'],
        fileName: () => 'content.js',
      },
      rollupOptions: {
        output: {
          entryFileNames: 'content.js',
          extend: true,
        },
      },
    },
  });

  // 4. Copy Manifest & Icons
  console.log('📋 Step 4: Copying Manifest and Icons...');
  fs.copyFileSync(
    path.resolve(rootDir, 'manifest.json'),
    path.resolve(distDir, 'manifest.json')
  );

  const iconsSrcDir = path.resolve(rootDir, 'public/icons');
  const iconsDistDir = path.resolve(distDir, 'icons');
  if (!fs.existsSync(iconsDistDir)) {
    fs.mkdirSync(iconsDistDir, { recursive: true });
  }

  const iconFiles = fs.readdirSync(iconsSrcDir);
  for (const file of iconFiles) {
    fs.copyFileSync(
      path.resolve(iconsSrcDir, file),
      path.resolve(iconsDistDir, file)
    );
  }

  console.log('✅ Chrome Extension build complete! Output files in "dist/":');
  const distFiles = fs.readdirSync(distDir);
  distFiles.forEach(f => console.log(`   - dist/${f}`));
}

buildExtension().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
