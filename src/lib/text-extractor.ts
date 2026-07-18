import { readFileSync } from 'fs'

export async function extractTextFromFile(
  filePath: string,
  fileType: string,
): Promise<string> {
  if (fileType === 'pdf') {
    return extractTextFromPdf(filePath)
  }
  return extractTextFromImage(filePath)
}

async function extractTextFromPdf(filePath: string): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')

  // Desabilitar worker no servidor para evitar problemas de resolução
  pdfjsLib.GlobalWorkerOptions.workerSrc = ''

  const data = new Uint8Array(readFileSync(filePath))
  const doc = await pdfjsLib.getDocument({ data, useWorkerFetch: false }).promise

  const textParts: string[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()

    // Preservar quebras de linha baseado na posição vertical dos itens
    let lastY: number | null = null
    const pageTexts: string[] = []

    for (const item of content.items) {
      if (!('str' in item) || !item.str) continue

      if (lastY !== null && item.transform[5] !== lastY) {
        pageTexts.push('\n')
      }
      pageTexts.push(item.str)
      lastY = item.transform[5]
    }

    textParts.push(pageTexts.join(''))
  }

  return textParts.join('\n')
}

async function extractTextFromImage(filePath: string): Promise<string> {
  const Tesseract = await import('tesseract.js')
  const result = await Tesseract.recognize(filePath, 'por', {
    logger: () => {},
  })
  return result.data.text
}
