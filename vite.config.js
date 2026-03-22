import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

export default defineConfig({
	plugins: [svelte(), cssInjectedByJsPlugin()],
	test: {
		environment: 'jsdom',
		setupFiles: ['./src/setupTest.js'],
		globals: true,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'lcov'],
		},
	},
	build: {
		lib: {
			entry: 'src/index.js',
			name: 'SvelteUseDropOutside',
			formats: ['es', 'cjs', 'umd'],
			fileName: (format) => {
				if (format === 'es') return 'index.es.js'
				if (format === 'cjs') return 'index.cjs'
				return `index.${format}.js`
			},
		},
		rollupOptions: {
			external: ['svelte'],
			output: {
				globals: {
					svelte: 'Svelte',
				},
			},
		},
	},
})
