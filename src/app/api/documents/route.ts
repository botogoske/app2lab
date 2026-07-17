import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string | null

    if (!file || !userId) {
      return NextResponse.json(
        { error: 'Arquivo e userId são obrigatórios' },
        { status: 400 }
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
        { status: 400 }
      )
    }

    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadsDir, { recursive: true })

    const fileName = `${uuidv4()}.${fileExtension}`
    const filePath = join(uploadsDir, fileName)

    await writeFile(filePath, buffer)

    const document = await prisma.document.create({
      data: {
        title: file.name,
        fileUrl: `/uploads/${fileName}`,
        fileType: isPdf ? 'pdf' : 'image',
        userId,
      },
    })

    return NextResponse.json(
      { message: 'Documento enviado com sucesso', document },
      { status: 201 }
    )
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Erro ao enviar documento' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    const documents = await prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ documents }, { status: 200 })
  } catch (error) {
    console.error('Fetch error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar documentos' },
      { status: 500 }
    )
  }
}
