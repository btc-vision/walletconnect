import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
    build: {
        outDir: 'browser',
        emptyOutDir: true,
        target: 'esnext',
        minify: 'esbuild',
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            formats: ['es'],
            fileName: () => 'index.js',
        },
        rollupOptions: {
            external: ['react', 'react-dom', 'react/jsx-runtime'],
            output: {
                chunkFileNames: '[name].js',
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM',
                    'react/jsx-runtime': 'jsxRuntime',
                },
                manualChunks: (id) => {
                    if (
                        id.includes('node_modules') ||
                        id.includes('@btc-vision/bitcoin') ||
                        id.includes('/bitcoin/build/')
                    ) {
                        // Noble crypto - isolated, no circular deps
                        if (id.includes('@noble/curves')) return 'noble-curves';
                        if (id.includes('@noble/hashes')) return 'noble-hashes';
                        // Protobuf - isolated
                        if (id.includes('protobufjs')) return 'protobuf';
                        // Validation - isolated
                        if (id.includes('valibot')) return 'valibot';
                        // Everything else in vendors to avoid circular deps
                        return 'vendors';
                    }
                },
            },
        },
    },
    resolve: {
        alias: {
            util: 'util/',
            crypto: 'crypto-browserify',
            zlib: 'browserify-zlib',
            stream: 'stream-browserify',
            buffer: 'buffer',
            // Use source versions for proper tree-shaking (not browser bundles)
            '@btc-vision/transaction': resolve(
                __dirname,
                'node_modules/@btc-vision/transaction/build/index.js',
            ),
            '@btc-vision/bitcoin': resolve(
                __dirname,
                'node_modules/@btc-vision/bitcoin/build/index.js',
            ),
        },
        mainFields: ['module', 'main'],
    },
    define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
        global: 'globalThis',
    },
    plugins: [
        nodePolyfills({
            globals: {
                Buffer: true,
                global: true,
                process: true,
            },
            // Include crypto polyfill
            include: ['crypto', 'buffer', 'process', 'stream', 'zlib', 'util'],
            overrides: {
                crypto: 'crypto-browserify',
                zlib: 'pako',
            },
        }),
        dts({
            outDir: 'browser',
            include: ['src/**/*.ts', 'src/**/*.tsx'],
            exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
            insertTypesEntry: true,
        }),
    ],
    esbuild: {
        target: 'esnext',
        jsx: 'automatic',
        jsxImportSource: 'react',
    },
});
