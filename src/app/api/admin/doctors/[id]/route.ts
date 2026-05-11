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
    { params }: { params: { id: string } }
) {
    const session = await getAuthSession()
    if (!session?.user?.email) return unauthorizedResponse()
    if (session.user.role !== 'ADMIN') return forbiddenResponse()

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

        const specialization = formData.get('specialization') as string | null
        const experienceRaw = formData.get('experience') as string | null
        const departmentId = formData.get('departmentId') as string | null
        const qualRaw = formData.get('qualifications') as string | null
        const imageFile = formData.get('profileImage') as File | null

        let qualifications: string[] | undefined
        if (qualRaw !== null) {
            try { qualifications = JSON.parse(qualRaw) } catch { qualifications = [] }
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

        return NextResponse.json(updated)
    } catch (err) {
        console.error('Update doctor error:', err)
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    }
}

// ─── DELETE /api/admin/doctors/[id] ──────────────────────────────────────────

export async function DELETE(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getAuthSession()
    if (!session?.user?.email) return unauthorizedResponse()
    if (session.user.role !== 'ADMIN') return forbiddenResponse()

    const { id } = params

    try {
        // Delete profile image if exists
        const profile = await prisma.doctorProfile.findUnique({ where: { userId: id }, select: { profileImage: true } })
        if (profile?.profileImage) {
            const imgPath = join(process.cwd(), 'public', profile.profileImage)
            unlink(imgPath).catch(() => { })
        }

        await prisma.user.delete({ where: { id } })
        return NextResponse.json({ message: 'Doctor deleted' })
    } catch (err) {
        console.error('Delete doctor error:', err)
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    }
}
