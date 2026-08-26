/// <reference types="vite/client" />

/**
 * Vite asset imports. `vite/client` covers most of these, but the pdf.js worker
 * is imported with an explicit `?url` suffix and the QR PNGs are imported as
 * default exports, so both are declared here for the strict type-check.
 */
declare module '*.png' {
  const src: string
  export default src
}

declare module '*?url' {
  const src: string
  export default src
}
