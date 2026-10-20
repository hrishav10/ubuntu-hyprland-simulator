import { buildSeedFilesystem } from '../filesystem/seed'
import { VirtualFilesystem } from '../filesystem/VirtualFilesystem'
import { idbDelete, idbGet, idbSet } from '../filesystem/IndexedDBAdapter'

const FS_KEY = 'vfs-root-v1'
let saveTimer: ReturnType<typeof setTimeout> | null = null

export async function loadFilesystem(): Promise<VirtualFilesystem> {
  const saved = await idbGet(FS_KEY)
  if (saved) {
    try {
      return new VirtualFilesystem(VirtualFilesystem.deserialize(saved))
    } catch {
      /* corrupted save -> reseed */
    }
  }
  return new VirtualFilesystem(buildSeedFilesystem())
}

export function scheduleFilesystemSave(fs: VirtualFilesystem): void {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    void idbSet(FS_KEY, fs.serialize())
  }, 350)
}

export async function resetFilesystem(): Promise<VirtualFilesystem> {
  await idbDelete(FS_KEY)
  return new VirtualFilesystem(buildSeedFilesystem())
}
