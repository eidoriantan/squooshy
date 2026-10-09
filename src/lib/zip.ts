import { zip } from 'fflate'
import { uniqueNames } from './format'

/**
 * Bundles finished files into one ZIP. Images and PDFs are already compressed,
 * so entries are stored rather than deflated again.
 */
export async function zipFiles(files: { name: string; blob: Blob }[]): Promise<Blob> {
  const names = uniqueNames(files.map((f) => f.name))
  const entries: Record<string, [Uint8Array, { level: 0 }]> = {}
  await Promise.all(
    files.map(async (file, i) => {
      entries[names[i]] = [new Uint8Array(await file.blob.arrayBuffer()), { level: 0 }]
    }),
  )
  const data = await new Promise<Uint8Array>((resolve, reject) =>
    zip(entries, (err, out) => (err ? reject(err) : resolve(out))),
  )
  return new Blob([data as Uint8Array<ArrayBuffer>], { type: 'application/zip' })
}
