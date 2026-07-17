import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession, unauthorizedResponse, forbiddenResponse } from '@/lib/session'
import { hashPassword } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

// ─── GET /api/admin/doctors ───────────────────────────────────────────────────
// Returns all users who have a DoctorProfile, with full profile data.

export async function GET() {
    const session = await getAuthSession()
    if (!session?.user?.email) return unauthorizedResponse()
    if (session.user.role !== 'ADMIN') return forbiddenResponse()

    try {
        const doctors = await prisma.user.findMany({
            where: { doctorProfile: { isNot: null } },
            select: {
                id: true,
                fullName: true,
                email: true,
                createdAt: true,
                doctorProfile: {
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
                },
            },
            orderBy: { fullName: 'asc' },
        })

        return NextResponse.json({ data: doctors })
    } catch (err) {
        console.error('Get doctors error:', err)
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    }
}

// ─── POST /api/admin/doctors ──────────────────────────────────────────────────
// Creates a new doctor (User + DoctorProfile) from multipart form data.
// Fields: fullName, email, qualifications (JSON array), specialization,
//         experience, departmentId, profileImage (file)

export async function POST(request: NextRequest) {
    const session = await getAuthSession()
    if (!session?.user?.email) return unauthorizedResponse()
    if (session.user.role !== 'ADMIN') return forbiddenResponse()

    try {
        const formData = await request.formData()

        const fullName = formData.get('fullName') as string
        const email = formData.get('email') as string
        const specialization = formData.get('specialization') as string | null
        const experienceRaw = formData.get('experience') as string | null
        const departmentId = formData.get('departmentId') as string | null
        const qualRaw = formData.get('qualifications') as string | null
        const imageFile = formData.get('profileImage') as File | null

        if (!fullName?.trim() || !email?.trim()) {
            return NextResponse.json({ message: 'Full name and email are required' }, { status: 400 })
        }

        // Parse qualifications JSON array
        let qualifications: string[] = []
        if (qualRaw) {
            try { qualifications = JSON.parse(qualRaw) } catch { qualifications = [] }
        }

        // Handle image upload
        let profileImagePath: string | null = null
        if (imageFile && imageFile.size > 0) {
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

        // Generate a random secure password or use provided one
        const tempPassword = randomUUID().replace(/-/g, '').slice(0, 16)
        const hashedPassword = hashPassword(tempPassword)

        // Create User + DoctorProfile in a transaction
        const user = await prisma.user.create({
            data: {
                fullName: fullName.trim(),
                email: email.trim().toLowerCase(),
                password: hashedPassword,
                role: 'DOCTOR', // Changed from USER to DOCTOR
                doctorProfile: {
                    create: {
                        specialization: specialization?.trim() || null,
                        profileImage: profileImagePath,
                        qualifications: qualifications.filter(q => q.trim().length > 0),
                        experience: experienceRaw && !isNaN(parseInt(experienceRaw, 10))
                            ? parseInt(experienceRaw, 10)
                            : null,
                        departmentId: departmentId?.trim() || null,
                    },
                },
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                createdAt: true,
                doctorProfile: {
                    select: {
                        id: true,
                        specialization: true,
                        profileImage: true,
                        qualifications: true,
                        experience: true,
                        departmentId: true,
                        department: { select: { id: true, name: true } },
                    },
                },
            },
        })

        // Return the temp password so admin can share it with the doctor
        return NextResponse.json({ ...user, tempPassword }, { status: 201 })
    } catch (err: any) {
        if (err?.code === 'P2002') {
            return NextResponse.json({ message: 'A user with this email already exists' }, { status: 409 })
        }
        console.error('Create doctor error:', err?.message ?? err)
        console.error('Stack:', err?.stack)
        return NextResponse.json({ message: err?.message ?? 'Internal server error' }, { status: 500 })
    }
}
