import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role } = await request.json()

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = hashPassword(password)

    // Create user with doctorProfile if role is DOCTOR
    const userData: any = {
      fullName: name,
      email,
      password: hashedPassword,
      role: role === 'ADMIN' ? 'ADMIN' : role === 'DOCTOR' ? 'DOCTOR' : 'USER',
    }

    // If DOCTOR role, create doctorProfile automatically
    if (role === 'DOCTOR') {
      userData.doctorProfile = {
        create: {
          specialization: null,
          profileImage: null,
          qualifications: [],
          experience: null,
          departmentId: null,
        }
      }
    }

    // Create user
    const user = await prisma.user.create({
      data: userData,
    })

    // Return success without password
    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json(
      {
        message: 'User created successfully',
        user: userWithoutPassword,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Register error:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))

    // Return more detailed error in development
    const errorMessage = error instanceof Error ? error.message : 'An error occurred during registration'

    return NextResponse.json(
      {
        message: 'An error occurred during registration',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}
