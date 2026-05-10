import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { NextRequest, NextResponse } from 'next/server'

export async function getAuthSession(req?: NextRequest) {
    return await getServerSession(authOptions)
}

export function unauthorizedResponse() {
    return NextResponse.json({ message: 'Unauthorized. Please sign in.' }, { status: 401 })
}

export function forbiddenResponse() {
    return NextResponse.json({ message: 'Forbidden. Admin access required.' }, { status: 403 })
}
