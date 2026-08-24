
import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import unusedImports from 'eslint-plugin-unused-imports'

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.2' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'unused-imports': unusedImports,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      // Cùng lý do với `no-undef`: gọi hook sau một `return` sớm là màn trắng
      // ngay khi component đó hiện lên, không phải chuyện dọn sau. Toàn bộ src
      // đang sạch quy tắc này nên bật lên không nợ gì.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'no-empty': 'off',
      'react/jsx-no-target-blank': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'no-unused-vars': 'warn',
      // no-unused-vars only reports; this one is auto-fixable, so `eslint --fix`
      // keeps dead imports from piling back up (201 of them had accumulated).
      // Imports only — unused locals and params still need a human.
      'unused-imports/no-unused-imports': 'warn',
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      'react/display-name': 'off',
      // LỖI, không phải cảnh báo. Một biến chưa khai báo trong JSX là màn hình
      // trắng ngay khi component đó render — chứ không phải chuyện dọn sau. Để
      // 'warn' thì nó nằm lẫn trong hai trăm cảnh báo khác và `npm run lint`
      // vẫn xanh: đúng cách một `import { useTranslation }` bị thiếu đã lọt ra
      // tới trình duyệt.
      'no-undef': 'error'
    },
  },
  {
    // Test chạy bằng Node nên có `process`, `__dirname`… trình duyệt không có.
    files: ['**/*.test.{js,jsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    // ── Mã chạy trên Node ────────────────────────────────────────────────
    // Trước đây `npm run lint` chỉ quét `src`, nên backend KHÔNG hề được lint.
    // Hậu quả thật: dataRoutes.js ôm 130 dòng hàm chết cùng nhiều import mồ
    // côi mà không có gì báo, và một `'process' is not defined` nằm im trong
    // khối VAPID. Chỗ này khai globals Node và tắt các luật React vô nghĩa với
    // mã máy chủ, để phần còn lại của cấu hình áp dụng được cho cả backend.
    files: ['server/**/*.js', 'scripts/**/*.js', 'scripts/**/*.mjs', 'workers/**/*.js', '*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      'react-refresh/only-export-components': 'off',
      'react-hooks/rules-of-hooks': 'off',
    },
  },
]
