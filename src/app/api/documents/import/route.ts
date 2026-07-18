import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { extractTextFromFile } from '@/lib/text-extractor'
import { extractPersonName } from '@/lib/name-extractor'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string | null

    if (!file || !userId) {
      return NextResponse.json(
        { error: 'Arquivo e userId são obrigatórios' },
        { status: 400 },
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const fileExtension = file.name.split('.').pop()?.toLowerCase() || ''
    const isPdf = fileExtension === 'pdf'
    const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(fileExtension)

    if (!isPdf && !isImage) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não suportado. Use PDF ou imagens (JPG, PNG, WebP)' },
        { status: 400 },
      )
    }

    // Salvar arquivo
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadsDir, { recursive: true })

    const fileName = `${uuidv4()}.${fileExtension}`
    const filePath = join(uploadsDir, fileName)
    await writeFile(filePath, buffer)

    // Extrair texto do documento
    const fileType = isPdf ? 'pdf' : 'image'
    let extractedText = ''
    let personName: string | null = null

    try {
      extractedText = await extractTextFromFile(filePath, fileType)
      personName = extractPersonName(extractedText)
    } catch (extractError) {
      console.error('Text extraction error:', extractError)
      // Continua mesmo se a extração falhar — documento é salvo sem nome
    }

    // Salvar no banco
    const document = await prisma.document.create({
      data: {
        title: file.name,
        fileUrl: `/uploads/${fileName}`,
        fileType,
        personName,
        userId,
      },
    })

    return NextResponse.json(
      {
        message: 'Documento importado com sucesso',
        document,
        extractedText: extractedText.substring(0, 500),
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Erro ao importar documento' },
      { status: 500 },
    )
  }
}
