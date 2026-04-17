import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'extension']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // ── Chrome Extension: no console in production ────────────────
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // ── Immutability: prefer const for non-reassigned bindings ────
      'prefer-const': ['error', { destructuring: 'all' }],

      // ── TypeScript: no unused vars (allow _prefixed) ──────────────
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],

      // ── React Refresh: downgrade to warn, allow utility exports ───
      'react-refresh/only-export-components': ['warn', {
        allowConstantExport: true,
      }],
    },
  },

  // ── Architecture Guardrails ──────────────────────────────────────
  //
  // These rules enforce the layer boundaries defined in the architecture
  // spec. Each rule has explicit file matchers and allowlists — no rule
  // depends on unwritten convention.
  //
  // See: docs/architecture.md for the full layer model.

  // Rule 1: No direct chrome.storage.local access outside storage adapter
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['src/utils/storage.ts', 'src/__tests__/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.object.name='chrome'][object.property.name='storage'][property.name='local']",
          message: 'Direct chrome.storage.local access is restricted to src/utils/storage.ts. Use domain readers/writers instead.',
        },
      ],
    },
  },

  // Rule 2: writeStorage import restricted to storage adapter + tests
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['src/utils/storage.ts', 'src/__tests__/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['*/utils/storage'],
              importNames: ['writeStorage'],
              message: 'writeStorage is reserved for migration/import/restore only. Use domain writers (writeSettings, writeGroupOrder, writeWorkspaces) instead.',
            },
          ],
        },
      ],
    },
  },

  // Rule 3: readStorage/updateStorage restricted — stores should use domain adapters
  {
    files: ['src/stores/**/*.ts'],
    ignores: ['src/__tests__/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['*/utils/storage'],
              importNames: ['readStorage', 'updateStorage'],
              message: 'Stores must use domain readers/writers (readSettings, readGroupOrder, readWorkspaces, writeWorkspaces, etc.) instead of readStorage/updateStorage.',
            },
          ],
        },
      ],
    },
  },

  // Rule 4: playCloseSound/shootConfetti restricted to close-effects.ts
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['src/lib/close-effects.ts', 'src/__tests__/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['*/lib/sound', '*/lib/confetti'],
              importNames: ['playCloseSound', 'shootConfetti'],
              message: 'Raw effect primitives (playCloseSound, shootConfetti) must be routed through src/lib/close-effects.ts. UI code should call playCloseEffects() instead.',
            },
          ],
        },
      ],
    },
  },

  // Rule 5: Components must not import stores directly
  {
    files: ['src/newtab/components/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['*/stores/*'],
              message: 'Components must not import stores directly. Pass data and handlers via props from the page orchestrator (App.tsx).',
            },
          ],
        },
      ],
    },
  },

  // Rule 6: Components must not import storage utilities
  {
    files: ['src/newtab/components/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['*/utils/storage'],
              message: 'Components must not import storage utilities. Data flows through stores and props, not direct storage access.',
            },
          ],
        },
      ],
    },
  },
])
