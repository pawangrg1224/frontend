import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession, unauthorizedResponse, forbiddenResponse } from '@/lib/session'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

// ─── PATCH /api/admin/doctors/[id] ───────────────────────────────────────────
// Updates a doctor's profile. Accepts multipart form data.

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const session = await getAuthSession()
    if (!session?.user?.email) return unauthorizedResponse()
    if (session.user.role !== 'ADMIN') return forbiddenResponse()

    // Handle both Next.js 14 and 15+ params
    const params = context.params instanceof Promise ? await context.params : context.params
    const { id } = params

    try {
        const contentType = request.headers.get('content-type') ?? ''

        // ── JSON body (used for quick department assignment from slots page) ──
        if (contentType.includes('application/json')) {
            const body = await request.json()
            const { departmentId, departmentStartDate, departmentEndDate } = body

            const updated = await prisma.doctorProfile.update({
                where: { userId: id },
                data: {
                    ...(departmentId !== undefined && { departmentId: departmentId || null }),
                    ...(departmentStartDate !== undefined && {
                        departmentStartDate: departmentStartDate ? new Date(departmentStartDate) : null,
                    }),
                    ...(departmentEndDate !== undefined && {
                        departmentEndDate: departmentEndDate ? new Date(departmentEndDate) : null,
                    }),
                },
                select: {
                    id: true,
                    specialization: true,
                    profileImage: true,
                    qualifications: true,
                    experience: true,
                    departmentId: true,
                    departmentStartDate: true,
                    departmentEndDate: true,
                    department: { select: { id: true, name: true } },
                },
            })
            return NextResponse.json(updated)
        }

        // ── Multipart form data (used from doctor profile edit page) ──────────
        const formData = await request.formData()

        const email = formData.get('email') as string | null
        const specialization = formData.get('specialization') as string | null
        const experienceRaw = formData.get('experience') as string | null
        const departmentId = formData.get('departmentId') as string | null
        const qualRaw = formData.get('qualifications') as string | null
        const imageFile = formData.get('profileImage') as File | null

        let qualifications: string[] | undefined
        if (qualRaw !== null) {
            try { qualifications = JSON.parse(qualRaw) } catch { qualifications = [] }
        }

        // Check if email is being changed and if it's unique
        if (email !== null && email.trim() !== '') {
            const existingUser = await prisma.user.findUnique({
                where: { email: email.trim() },
                select: { id: true }
            })
            if (existingUser && existingUser.id !== id) {
                return NextResponse.json(
                    { message: 'Email is already in use by another user' },
                    { status: 400 }
                )
            }
        }

        // Handle image upload
        let profileImagePath: string | undefined
        if (imageFile && imageFile.size > 0) {
            const ext = imageFile.name.split('.').pop()?.toLowerCase() ?? 'jpg'
            const filename = `${randomUUID()}.${ext}`
            const uploadDir = join(process.cwd(), 'public', 'uploads', 'doctors')
            await mkdir(uploadDir, { recursive: true })
            const bytes = await imageFile.arrayBuffer()
            await writeFile(join(uploadDir, filename), Buffer.from(bytes))
            profileImagePath = `/uploads/doctors/${filename}`

            // Delete old image if exists
            const existing = await prisma.doctorProfile.findUnique({ where: { userId: id }, select: { profileImage: true } })
            if (existing?.profileImage) {
                const oldPath = join(process.cwd(), 'public', existing.profileImage)
                unlink(oldPath).catch(() => { }) // ignore if already gone
            }
        }

        // Update user email if provided
        let updatedUser
        if (email !== null && email.trim() !== '') {
            updatedUser = await prisma.user.update({
                where: { id },
                data: { email: email.trim() },
                select: { id: true, email: true, fullName: true }
            })
        }

        const updated = await prisma.doctorProfile.update({
            where: { userId: id },
            data: {
                ...(specialization !== null && { specialization: specialization.trim() || null }),
                ...(experienceRaw !== null && { experience: parseInt(experienceRaw, 10) || null }),
                ...(departmentId !== null && { departmentId: departmentId || null }),
                ...(qualifications !== undefined && { qualifications }),
                ...(profileImagePath && { profileImage: profileImagePath }),
            },
            select: {
                id: true,
                specialization: true,
                profileImage: true,
                qualifications: true,
                experience: true,
                departmentId: true,
                departmentStartDate: true,
                departmentEndDate: true,
                department: { select: { id: true, name: true } },
            },
        })

        return NextResponse.json({
            ...updated,
            email: updatedUser?.email,
            profile: updated
        })
    } catch (err) {
        console.error('Update doctor error:', err)
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    }
}

// ─── DELETE /api/admin/doctors/[id] ──────────────────────────────────────────

export async function DELETE(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const session = await getAuthSession()
    if (!session?.user?.email) return unauthorizedResponse()
    if (session.user.role !== 'ADMIN') return forbiddenResponse()

    // Handle both Next.js 14 and 15+ params
    const params = context.params instanceof Promise ? await context.params : context.params
    const { id } = params

    try {
        // Check if doctor exists
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                doctorProfile: true,
                _count: {
                    select: {
                        appointments: true,
                        reviewVotes: true,
                        sentMessages: true,
                        availabilities: true,
                        availabilityPatterns: true,
                    }
                }
            }
        })

        if (!user) {
            return NextResponse.json({ message: 'Doctor not found' }, { status: 404 })
        }

        // Log what will be deleted
        console.log(`Deleting doctor ${user.fullName}:`, {
            appointments: user._count.appointments,
            reviewVotes: user._count.reviewVotes,
            messages: user._count.sentMessages,
            availabilities: user._count.availabilities,
            patterns: user._count.availabilityPatterns,
        })

        // Delete review votes manually (no cascade)
        if (user._count.reviewVotes > 0) {
            await prisma.reviewVote.deleteMany({
                where: { userId: id }
            })
        }

        // Delete profile image if exists
        const profile = user.doctorProfile
        if (profile?.profileImage) {
            const imgPath = join(process.cwd(), 'public', profile.profileImage)
            unlink(imgPath).catch(() => { })
        }

        // Now delete the user - cascades will handle the rest
        await prisma.user.delete({ where: { id } })

        return NextResponse.json({
            message: 'Doctor deleted successfully',
            deletedAppointments: user._count.appointments
        })
    } catch (err: any) {
        console.error('Delete doctor error:', err)

        // Check for foreign key constraint errors
        if (err.code === 'P2003') {
            return NextResponse.json({
                message: 'Cannot delete doctor due to existing references. Please contact support.',
                details: process.env.NODE_ENV === 'development' ? err.meta : undefined
            }, { status: 400 })
        }

        // Check for record not found
        if (err.code === 'P2025') {
            return NextResponse.json({
                message: 'Doctor not found or already deleted'
            }, { status: 404 })
        }

        return NextResponse.json({
            message: 'Failed to delete doctor. Please try again.',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        }, { status: 500 })
    }
}
