import * as esbuild from 'esbuild'
import babel from 'esbuild-plugin-babel'
import { execSync } from 'child_process'
import { existsSync } from 'fs'

const isDev = process.argv.includes('--dev')

// Process CSS with PostCSS - output to sidepanel.css to match HTML reference
console.log('Processing CSS with PostCSS...')
try {
  execSync('bunx postcss src/global.css -o dist/sidepanel.css', { stdio: 'inherit' })
} catch (error) {
  console.error('PostCSS processing failed:', error.message)
  process.exit(1)
}

const esbuildOptions = {
  entryPoints: {
    sidepanel: 'src/index.tsx',
    background: 'src/core/background.ts',
    content: 'src/core/content.ts',
    injected: 'src/core/injected.ts'
  },
  bundle: true,
  outdir: 'dist',
  // Allow resolving Tailwind's "style" export for @import "tailwindcss"
  conditions: ['style', 'browser', 'import', 'default'],
  loader: {
    '.png': 'dataurl',
    '.svg': 'text',
    '.css': 'css'
  },
  define: {
    'process.env.NODE_ENV': isDev ? '"development"' : '"production"'
  },
  sourcemap: isDev ? 'inline' : false,
  minify: !isDev,
  plugins: [
    babel({
      // Only run Babel over app source files. Third-party bundles like react-dom
      // should stay on esbuild's path to avoid noisy deopt warnings.
      filter: /src\/.*\.(tsx?|jsx?)$/,
      namespace: ''
    })
  ]
}

if (isDev) {
  const ctx = await esbuild.context(esbuildOptions)
  await ctx.watch()
  console.log('Watching for changes...')
} else {
  esbuild.build(esbuildOptions).catch(() => process.exit(1))
}
