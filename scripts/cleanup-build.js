

const path = require('path')
const fs = require('fs')

function removeNodeModules(dir) {
  if (!fs.existsSync(dir)) {
    console.log('[cleanup] .build directory not found, skipping.')
    return
  }

  let removed = 0

  function walk(current) {
    let entries
    try {
      entries = fs.readdirSync(current, { withFileTypes: true })
    } catch {
      return 
    }

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name)

      if (entry.isSymbolicLink()) {
        const target = (() => { try { return fs.readlinkSync(fullPath) } catch { return '' } })()
        if (target.includes('node_modules')) {
          fs.unlinkSync(fullPath)
          removed++
        }
        continue
      }

      if (entry.isDirectory()) {
        if (entry.name === 'node_modules') {
          console.log(`[cleanup] Removing ${fullPath}`)
          fs.rmSync(fullPath, { recursive: true, force: true })
          removed++
        } else {
          walk(fullPath)
        }
      }
    }
  }

  walk(dir)
  console.log(`[cleanup] Done. Removed ${removed} node_modules/symlink entries from .build.`)
}

const buildDir = path.resolve(__dirname, '..', '.build')
console.log(`[cleanup] Scanning ${buildDir} for leaked node_modules...`)
removeNodeModules(buildDir)
