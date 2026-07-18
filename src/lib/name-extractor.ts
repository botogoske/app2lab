/**
 * Tenta extrair o nome de uma pessoa a partir do texto de um documento.
 * Usa heurísticas para documentos brasileiros (CPF, RG, CNH, etc.).
 */
export function extractPersonName(text: string): string | null {
  if (!text || text.trim().length === 0) return null

  const normalized = text.replace(/\s+/g, ' ').trim()

  // 1. Labels explícitos: "NOME:", "Nome do titular:", "PORTADOR:", "RESPONSÁVEL:", etc.
  const labelPatterns = [
    /(?:NOME|Nome\s+do\s+titular|PORTADOR|RESPONS[AÁ]VEL|TITULAR|BENEFICI[AÁ]RIO|SEGURADO|ASSINANTE|CLIENTE|ALUNO|FUNCIONA[RIO]{2}|COLABORADOR)[\s:]+([A-ZÁÉÍÓÚÃÕÇ][A-Za-záéíóúãõç\s]{2,60})/i,
  ]

  for (const pattern of labelPatterns) {
    const match = normalized.match(pattern)
    if (match?.[1]) {
      const name = cleanName(match[1])
      if (isValidName(name)) return name
    }
  }

  // 2. Após CPF/CNPJ — pega o que vem depois do número
  const cpfPattern = /(?:CPF|CNPJ)[\s:]?\d[\d.\-\/\s]{9,18}[\s]*([A-ZÁÉÍÓÚÃÕÇ][A-Za-záéíóúãõç\s]{2,60})/i
  const cpfMatch = normalized.match(cpfPattern)
  if (cpfMatch?.[1]) {
    const name = cleanName(cpfMatch[1])
    if (isValidName(name)) return name
  }

  // 2b. CPF/CNPJ com quebra de linha — o nome pode estar na linha seguinte
  const cpfBlockPattern = /(?:CPF|CNPJ)[\s:]?\d[\d.\-\/\s]{9,18}\s*\n\s*([A-ZÁÉÍÓÚÃÕÇ][A-Za-záéíóúãõç\s]{2,60})/i
  const cpfBlockMatch = normalized.match(cpfBlockPattern)
  if (cpfBlockMatch?.[1]) {
    const name = cleanName(cpfBlockMatch[1])
    if (isValidName(name)) return name
  }

  // 3. Linhas com palavras maiúsculas (padrão de documento impresso)
  const lines = normalized.split('\n').map((l) => l.trim()).filter(Boolean)
  for (const line of lines) {
    // Uma linha com 2-5 palavras, todas começando com maiúscula, sem números
    if (/^[A-ZÁÉÍÓÚÃÕÇ][a-záéíóúãõç]+(\s+[A-ZÁÉÍÓÚÃÕÇ][a-záéíóúãõç]+){1,4}$/.test(line)) {
      const name = cleanName(line)
      if (isValidName(name)) return name
    }
  }

  // 4. Linhas com 2-5 palavras maiúsculas (todas em caps)
  for (const line of lines) {
    if (/^[A-ZÁÉÍÓÚÃÕÇ\s]{6,60}$/.test(line) && !/\d/.test(line)) {
      const name = titleCase(line)
      if (isValidName(name)) return name
    }
  }

  // 5. Padrão de RG: "NOME" ou "Nome" logo após palavra-chave
  const rgPattern = /(?:IDENTIDADE|RG|REGISTRO\s+GERAL)[\s:]?\s*\n?\s*([A-ZÁÉÍÓÚÃÕÇ][A-Za-záéíóúãõç\s]{2,60})/i
  const rgMatch = normalized.match(rgPattern)
  if (rgMatch?.[1]) {
    const name = cleanName(rgMatch[1])
    if (isValidName(name)) return name
  }

  // 6. Padrão de documento: primeira linha com 2-4 palavras资本izadas no início do texto
  if (lines.length > 0) {
    const firstLine = lines[0]
    if (/^[A-ZÁÉÍÓÚÃÕÇ][a-záéíóúãõç]+(\s+[A-ZÁÉÍÓÚÃÕÇ][a-záéíóúãõç]+){1,4}$/.test(firstLine)) {
      const name = cleanName(firstLine)
      if (isValidName(name)) return name
    }
  }

  return null
}

function cleanName(raw: string): string {
  return raw
    .replace(/[^\p{L}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function titleCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function isValidName(name: string): boolean {
  const words = name.split(' ').filter(Boolean)
  // Pelo menos 2 palavras, cada uma com pelo menos 2 letras
  if (words.length < 2) return false
  if (words.some((w) => w.length < 2)) return false
  // Não deve ser só palavras comuns de documento
  const stopWords = ['documento', 'identidade', 'contribuinte', 'registro', 'expedicao', 'validade', 'emissao']
  if (words.every((w) => stopWords.includes(w.toLowerCase()))) return false
  return true
}
