declare module "libheif-js/wasm-bundle" {
  interface HeifImage {
    get_width(): number
    get_height(): number
    display(destino: ImageData, callback: (resultado: ImageData | null) => void): void
  }
  const libheif: {
    HeifDecoder: new () => { decode(datos: Uint8Array): HeifImage[] }
  }
  export default libheif
}
