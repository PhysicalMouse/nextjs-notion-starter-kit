import baseConfig from '@fisch0920/config/oxfmt'

export default {
  ...baseConfig,
  ignorePatterns: [
    ...(baseConfig.ignorePatterns ?? []),
    // generated / vendored / non-source content that must never be reformatted
    '.qoder/**',
    '.next/**',
    '.vercel/**',
    '.cache/**',
    '.snapshots/**',
    'build/**',
    'dist/**',
    'node_modules/**',
    'public/**',
    'next-env.d.ts',
    'pnpm-lock.yaml',
    '**/*.md'
  ]
}
