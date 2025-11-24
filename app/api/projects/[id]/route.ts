import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      )
    }

    const { id } = await params
    const userId = (session.user as any).id
    const isAdmin = (session.user as any).role === 'admin'

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project niet gevonden' },
        { status: 404 }
      )
    }

    if (!isAdmin && project.userId !== userId) {
      return NextResponse.json(
        { error: 'Geen toegang tot dit project' },
        { status: 403 }
      )
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Get project error:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      )
    }

    const { id } = await params
    const userId = (session.user as any).id
    const isAdmin = (session.user as any).role === 'admin'

    const project = await prisma.project.findUnique({
      where: { id },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project niet gevonden' },
        { status: 404 }
      )
    }

    if (!isAdmin && project.userId !== userId) {
      return NextResponse.json(
        { error: 'Geen toegang tot dit project' },
        { status: 403 }
      )
    }

    const updates = await request.json()
    const updatedProject = await prisma.project.update({
      where: { id },
      data: updates,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      project: updatedProject,
      message: 'Project succesvol bijgewerkt',
    })
  } catch (error) {
    console.error('Update project error:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      )
    }

    const { id } = await params
    const userId = (session.user as any).id
    const isAdmin = (session.user as any).role === 'admin'

    const project = await prisma.project.findUnique({
      where: { id },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project niet gevonden' },
        { status: 404 }
      )
    }

    if (!isAdmin && project.userId !== userId) {
      return NextResponse.json(
        { error: 'Geen toegang tot dit project' },
        { status: 403 }
      )
    }

    await prisma.project.delete({
      where: { id },
    })

    return NextResponse.json({
      message: 'Project succesvol verwijderd',
    })
  } catch (error) {
    console.error('Delete project error:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    )
  }
}



