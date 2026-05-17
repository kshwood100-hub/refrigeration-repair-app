import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'fs'
import { createHash } from 'crypto'
import { resolve } from 'path'

function swVersionPlugin() {
  return {
    name: 'sw-version',
    closeBundle() {
      const swPath = resolve('dist/sw.js')
      try {
        let code = readFileSync(swPath, 'utf-8')
        code = code.replace('__SW_VERSION__', Date.now().toString(36))
        writeFileSync(swPath, code)
      } catch {}
    },
  }
}

function dataHashPlugin() {
  return {
    name: 'data-hash',
    config() {
      const files = [
        'src/data/symptoms.json',
        'src/data/checklist.json',
        'src/data/flowchart.json',
      ]
      const hash = createHash('md5')
      files.forEach(f => {
        try { hash.update(readFileSync(resolve(f), 'utf-8')) } catch {}
      })
      const dataHash = hash.digest('hex').slice(0, 12)
      return { define: { __DATA_HASH__: JSON.stringify(dataHash) } }
    },
  }
}

// 빌드마다 새 ID 발급 → index.html의 __BUILD_ID__ 자리표시자 교체.
// 옛 chunk 캐시·옛 SW로 인한 새 빌드 미반영 결함을 클라이언트 측에서 즉시 회복시키는 메커니즘.
function buildIdPlugin() {
  return {
    name: 'build-id',
    transformIndexHtml(html) {
      const id = Date.now().toString(36)
      return html.replace('__BUILD_ID__', id)
    },
  }
}

export default defineConfig({
  plugins: [react(), swVersionPlugin(), dataHashPlugin(), buildIdPlugin()],
})
