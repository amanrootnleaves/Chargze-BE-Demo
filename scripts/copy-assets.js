
const path = require('path')
const fs = require('fs')

const SOURCE_PACKAGES = path.resolve(__dirname, '..', 'packages')
const BUILD_PACKAGES = path.resolve(__dirname, '..', '.build', 'packages')

const ASSET_EXTENSIONS = new Set(['.graphql', '.json'])
const SKIP_DIRS = new Set(['node_modules', '.git', '.build', 'dist'])

let copied = 0
let skipped = 0

function copyAssets(srcDir, destDir) {
  let entries
  try {
    entries = fs.readdirSync(srcDir, { withFileTypes: true })
  } catch {
    return
  }

  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue
    if (SKIP_DIRS.has(entry.name)) continue

    const srcPath = path.join(srcDir, entry.name)
    const destPath = path.join(destDir, entry.name)

    if (entry.isDirectory()) {
      copyAssets(srcPath, destPath)
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase()
      if (ASSET_EXTENSIONS.has(ext)) {
        try {
          fs.mkdirSync(destDir, { recursive: true })
          fs.copyFileSync(srcPath, destPath)
          copied++
          console.log(`[assets] Copied: ${path.relative(SOURCE_PACKAGES, destPath)}`)
        } catch (e) {
          console.warn(`[assets] WARN: Could not copy ${srcPath}: ${e.message}`)
          skipped++
        }
      }
    }
  }
}

console.log('[assets] Copying assets from packages/ to .build/packages/ ...')
copyAssets(SOURCE_PACKAGES, BUILD_PACKAGES)
console.log(`[assets] Done. Copied: ${copied}, Skipped: ${skipped}`)
