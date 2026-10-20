declare module "@niivue/dcm2niix" {
  export class Dcm2niix {
    worker: Worker | null
    init(): Promise<unknown>
    input(archivos: File[] | FileList): this
    run(): Promise<File[]>
  }
}
