import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession, unauthorizedResponse } from '@/lib/session'

export async function GET(request: NextRequest) {
    const session = await getAuthSession()
    if (!session?.user?.email) return unauthorizedResponse()

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                doctorProfile: {
                    include: {
                        department: { select: { id: true, name: true } },
                    },
                },
            },
        })

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 })
        }

        if (!user.doctorProfile) {
            // Return basic user info if no doctor profile exists yet
            return NextResponse.json({
                id: null,
                userId: user.id,
                specialization: null,
                profileImage: null,
                qualifications: [],
                experience: null,
                department: null,
                departmentStartDate: null,
                user: {
                    fullName: user.fullName,
                    email: user.email,
                },
            })
        }

        const profile = {
            ...user.doctorProfile,
            user: {
                fullName: user.fullName,
                email: user.email,
            },
        }

        return NextResponse.json(profile)
    } catch (error) {
        console.error('Error fetching doctor profile:', error)
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    }
}

// PUT /api/doctor/profile - Update doctor profile
export async function PUT(request: NextRequest) {
    const session = await getAuthSession()
    if (!session?.user?.email) return unauthorizedResponse()

    try {
        const formData = await request.formData()

        const specialization = formData.get('specialization') as string
        const experienceRaw = formData.get('experience') as string | null
        const departmentId = formData.get('departmentId') as string | null
        const qualRaw = formData.get('qualifications') as string | null
        const imageFile = formData.get('profileImage') as File | null

        if (!specialization?.trim()) {
            return NextResponse.json({ message: 'Specialization is required' }, { status: 400 })
        }

        // Parse qualifications JSON array
        let qualifications: string[] = []
        if (qualRaw) {
            try { qualifications = JSON.parse(qualRaw) } catch { qualifications = [] }
        }

        // Handle image upload
        let profileImagePath: string | null = null
        if (imageFile && imageFile.size > 0) {
            const { writeFile, mkdir } = await import('fs/promises')
            const { join } = await import('path')
            const { randomUUID } = await import('crypto')

            const ext = imageFile.name.split('.').pop()?.toLowerCase() ?? 'jpg'
            const allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif']
            if (!allowed.includes(ext)) {
                return NextResponse.json({ message: 'Only JPG, PNG, WebP, or GIF images allowed' }, { status: 400 })
            }
            if (imageFile.size > 5 * 1024 * 1024) {
                return NextResponse.json({ message: 'Image must be under 5 MB' }, { status: 400 })
            }

            const filename = `${randomUUID()}.${ext}`
            const uploadDir = join(process.cwd(), 'public', 'uploads', 'doctors')
            await mkdir(uploadDir, { recursive: true })
            const bytes = await imageFile.arrayBuffer()
            await writeFile(join(uploadDir, filename), Buffer.from(bytes))
            profileImagePath = `/uploads/doctors/${filename}`
        }

        // Get current user
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, doctorProfile: { select: { id: true } } },
        })

        if (!user?.doctorProfile) {
            return NextResponse.json({ message: 'Doctor profile not found' }, { status: 404 })
        }

        // Update profile
        const updateData: any = {
            specialization: specialization.trim(),
            qualifications: qualifications.filter(q => q.trim().length > 0),
            experience: experienceRaw && !isNaN(parseInt(experienceRaw, 10))
                ? parseInt(experienceRaw, 10)
                : null,
            departmentId: departmentId?.trim() || null,
        }

        if (profileImagePath) {
            updateData.profileImage = profileImagePath
        }

        const updatedProfile = await prisma.doctorProfile.update({
            where: { id: user.doctorProfile.id },
            data: updateData,
            select: {
                id: true,
                specialization: true,
                profileImage: true,
                qualifications: true,
                experience: true,
                departmentId: true,
                department: { select: { id: true, name: true } },
            },
        })

        return NextResponse.json(updatedProfile)
    } catch (err: any) {
        console.error('Update doctor profile error:', err?.message ?? err)
        return NextResponse.json({ message: err?.message ?? 'Internal server error' }, { status: 500 })
    }
}
