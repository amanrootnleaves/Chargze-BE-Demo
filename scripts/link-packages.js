

const path = require('path')
const fs = require('fs')

const ROOT = path.resolve(__dirname, '..')
const BUILD = path.join(ROOT, '.build')
const SOURCE_PACKAGES = path.join(ROOT, 'packages')
const ROOT_NODE_MODULES = path.join(ROOT, 'node_modules')
const BUILD_NODE_MODULES = path.join(BUILD, 'node_modules')

const packages = []
const workspaceNames = new Set()

function findPackages(dir) {
  if (!fs.existsSync(dir)) return

  let entries
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }

  const pkgJsonPath = path.join(dir, 'package.json')
  if (dir !== SOURCE_PACKAGES && fs.existsSync(pkgJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'))
      if (pkg.name) {
        const relPath = path.relative(SOURCE_PACKAGES, dir)
        packages.push({ name: pkg.name, relPath })
        workspaceNames.add(pkg.name)
      }
    } catch {}
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) continue
    if (['node_modules', '.git', '.build', 'dist'].includes(entry.name)) continue
    findPackages(path.join(dir, entry.name))
  }
}

findPackages(SOURCE_PACKAGES)

fs.mkdirSync(BUILD_NODE_MODULES, { recursive: true })

let linked = 0
let skipped = 0

for (const { name, relPath } of packages) {
  const buildPackagePath = path.join(BUILD, 'packages', relPath)

  if (!fs.existsSync(buildPackagePath)) {
    console.warn(`[link] SKIP: ${name} — no compiled output at .build/packages/${relPath}`)
    skipped++
    continue
  }

  let symlinkPath
  if (name.startsWith('@')) {
    const slashIdx = name.indexOf('/', 1)
    const scope = name.slice(0, slashIdx)
    const pkgName = name.slice(slashIdx + 1)
    fs.mkdirSync(path.join(BUILD_NODE_MODULES, scope), { recursive: true })
    symlinkPath = path.join(BUILD_NODE_MODULES, scope, pkgName)
  } else {
    symlinkPath = path.join(BUILD_NODE_MODULES, name)
  }

  try {
    if (fs.existsSync(symlinkPath) || fs.lstatSync(symlinkPath).isSymbolicLink?.()) {
      fs.rmSync(symlinkPath, { recursive: true, force: true })
    }
  } catch {}

  try {
    fs.symlinkSync(buildPackagePath, symlinkPath, 'junction')
    console.log(`[link] ${name} → .build/packages/${relPath}`)
    linked++
  } catch (e) {
    console.warn(`[link] WARN: could not link ${name}: ${e.message}`)
    skipped++
  }
}


console.log('[link] Mirroring root node_modules into .build/node_modules...')

let mirrored = 0
let mirrorSkipped = 0

function mirrorEntry(entryName, srcBase, destBase) {
  if (entryName.startsWith('.')) return

  const srcPath = path.join(srcBase, entryName)
  const destPath = path.join(destBase, entryName)

  if (entryName.startsWith('@')) {
    let scopedEntries
    try {
      scopedEntries = fs.readdirSync(srcPath, { withFileTypes: true })
    } catch {
      return
    }
    fs.mkdirSync(destPath, { recursive: true })
    for (const sub of scopedEntries) {
      if (sub.name.startsWith('.')) continue
      const fullName = `${entryName}/${sub.name}`
      if (workspaceNames.has(fullName)) continue

      const subSrc = path.join(srcPath, sub.name)
      const subDest = path.join(destPath, sub.name)

      try {
        if (fs.existsSync(subDest) || fs.lstatSync(subDest).isSymbolicLink?.()) return
      } catch {}

      let realSrc = subSrc
      try { realSrc = fs.realpathSync(subSrc) } catch {}

      try {
        fs.symlinkSync(realSrc, subDest, 'junction')
        mirrored++
      } catch (e) {
        mirrorSkipped++
      }
    }
    return
  }

  if (workspaceNames.has(entryName)) return

  try {
    if (fs.existsSync(destPath) || fs.lstatSync(destPath).isSymbolicLink?.()) return
  } catch {}

  let realSrc = srcPath
  try { realSrc = fs.realpathSync(srcPath) } catch {}

  try {
    fs.symlinkSync(realSrc, destPath, 'junction')
    mirrored++
  } catch (e) {
    mirrorSkipped++
  }
}

if (fs.existsSync(ROOT_NODE_MODULES)) {
  let rootEntries
  try {
    rootEntries = fs.readdirSync(ROOT_NODE_MODULES, { withFileTypes: true })
  } catch {
    rootEntries = []
  }

  for (const entry of rootEntries) {
    mirrorEntry(entry.name, ROOT_NODE_MODULES, BUILD_NODE_MODULES)
  }
}

console.log(`[link] Done. Workspace linked: ${linked}, Skipped: ${skipped}, External mirrored: ${mirrored}, Mirror skipped: ${mirrorSkipped}`)


const PNPM_STORE = path.join(ROOT_NODE_MODULES, '.pnpm')
let fallbackLinked = 0

function extractPackageName(dirName) {
  const atPeerIdx = dirName.indexOf('_')
  const base = atPeerIdx > 0 ? dirName.slice(0, atPeerIdx) : dirName
  const atIdx = base.indexOf('@', 1)
  const nameWithVersion = atIdx > 0 ? base.slice(0, atIdx) : base
  return nameWithVersion.replace(/\+/, '/')
}

if (fs.existsSync(PNPM_STORE)) {
  let pnpmEntries
  try { pnpmEntries = fs.readdirSync(PNPM_STORE, { withFileTypes: true }) } catch { pnpmEntries = [] }

  for (const entry of pnpmEntries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue

    const pkgName = extractPackageName(entry.name)
    if (!pkgName) continue

    const rootPkgPath = path.join(ROOT_NODE_MODULES, pkgName)
    if (fs.existsSync(rootPkgPath)) continue
    if (workspaceNames.has(pkgName)) continue

    const pnpmPkgDir = path.join(PNPM_STORE, entry.name, 'node_modules', pkgName)
    if (!fs.existsSync(pnpmPkgDir)) continue

    let destPath
    if (pkgName.startsWith('@')) {
      const slashIdx = pkgName.indexOf('/')
      const scope = pkgName.slice(0, slashIdx)
      const name = pkgName.slice(slashIdx + 1)
      const scopeDir = path.join(BUILD_NODE_MODULES, scope)
      fs.mkdirSync(scopeDir, { recursive: true })
      destPath = path.join(scopeDir, name)
    } else {
      destPath = path.join(BUILD_NODE_MODULES, pkgName)
    }

    try {
      if (fs.existsSync(destPath) || fs.lstatSync(destPath).isSymbolicLink?.()) continue
    } catch {}

    let realSrc = pnpmPkgDir
    try { realSrc = fs.realpathSync(pnpmPkgDir) } catch {}

    try {
      fs.symlinkSync(realSrc, destPath, 'junction')
      console.log(`[link] [fallback] ${pkgName} → .pnpm store`)
      fallbackLinked++
    } catch {}
  }
}

console.log(`[link] Fallback pnpm-store linked: ${fallbackLinked}`)
