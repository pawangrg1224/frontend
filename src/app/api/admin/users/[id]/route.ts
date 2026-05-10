import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession, unauthorizedResponse, forbiddenResponse } from '@/lib/session'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession()
  if (!session?.user?.email) return unauthorizedResponse()
  if (session.user.role !== 'ADMIN') return forbiddenResponse()
  const { id } = await params

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, fullName: true, role: true, createdAt: true },
    })
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })
    return NextResponse.json(user)
  } catch (err) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession()
  if (!session?.user?.email) return unauthorizedResponse()
  if (session.user.role !== 'ADMIN') return forbiddenResponse()
  const { id } = await params

  try {
    const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (currentUser?.id === id) {
      return NextResponse.json({ message: 'Cannot delete your own account' }, { status: 400 })
    }
    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (err) {
    console.error('Error deleting user:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Body: { makeDoctor: boolean, specialization?: string }
 * Creates or deletes the DoctorProfile for this user.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession()
  if (!session?.user?.email) return unauthorizedResponse()
  if (session.user.role !== 'ADMIN') return forbiddenResponse()
  const { id } = await params

  try {
    const { makeDoctor, specialization } = await request.json()

    if (makeDoctor) {
      // Upsert DoctorProfile
      await prisma.doctorProfile.upsert({
        where: { userId: id },
        create: { userId: id, specialization: specialization ?? null },
        update: { specialization: specialization ?? null },
      })
    } else {
      // Remove DoctorProfile if it exists
      await prisma.doctorProfile.deleteMany({ where: { userId: id } })
    }

    const updated = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, fullName: true, email: true, role: true, createdAt: true,
        doctorProfile: { select: { id: true, specialization: true } },
      },
    })
    return NextResponse.json(updated)
  } catch (err) {
    console.error('Error updating doctor profile:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
