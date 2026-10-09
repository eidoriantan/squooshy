import loadGhostscript from '@okathira/ghostpdl-wasm'
import gsWasmUrl from '@okathira/ghostpdl-wasm/gs.wasm?url'
import { expose, transfer } from 'comlink'
import type { CompressResult, PdfJob } from '../lib/types'

let compiled: Promise<WebAssembly.Module> | undefined

async function compile(): Promise<WebAssembly.Module> {
  const response = await fetch(gsWasmUrl)
  if (!response.ok) throw new Error(`The PDF engine failed to load (HTTP ${response.status}).`)
  try {
    return await WebAssembly.compileStreaming(response.clone())
  } catch {
    // compileStreaming needs an application/wasm content type.
    return WebAssembly.compile(await response.arrayBuffer())
  }
}

const api = {
  /** Compiles Ghostscript once. Each PDF then gets a fresh, cheap instance. */
  async init() {
    compiled ??= compile()
    await compiled
  },

  async compress(buffer: ArrayBuffer, job: PdfJob): Promise<CompressResult> {
    compiled ??= compile()
    const module = await compiled
    const log: string[] = []

    // Ghostscript's main() can only run once per instance, so every file gets
    // its own instance of the already-compiled module.
    const gs = await loadGhostscript({
      instantiateWasm(
        imports: WebAssembly.Imports,
        done: (instance: WebAssembly.Instance, module: WebAssembly.Module) => void,
      ) {
        WebAssembly.instantiate(module, imports).then((instance) => done(instance, module))
        return {}
      },
      print: (line: string) => log.push(line),
      printErr: (line: string) => log.push(line),
    })

    const input = job.args[job.args.length - 1]
    const output = job.args.find((a) => a.startsWith('-sOutputFile='))!.slice('-sOutputFile='.length)
    gs.FS.writeFile(input, new Uint8Array(buffer))
    const code = gs.callMain(job.args)
    if (code !== 0) {
      const detail = log.filter(Boolean).slice(-3).join(' ')
      throw new Error(
        /password|encrypt/i.test(detail)
          ? 'This PDF is password-protected. Remove the password and try again.'
          : `Ghostscript couldn't process this PDF. ${detail}`.trim(),
      )
    }
    const out = gs.FS.readFile(output).slice().buffer
    return transfer({ buffer: out, format: 'pdf' }, [out])
  },
}

export type PdfWorkerApi = typeof api

expose(api)
