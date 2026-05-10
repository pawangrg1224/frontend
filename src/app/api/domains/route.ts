import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const domains = await prisma.domain.findMany({
      orderBy: { company: 'asc' },
    });
    return NextResponse.json({ data: domains });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch domains' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { company, address, latitude, longitude } = await request.json();
    if (!company?.trim()) {
      return NextResponse.json(
        { message: 'Company name is required' },
        { status: 400 }
      );
    }
    const domain = await prisma.domain.create({
      data: {
        company: company.trim(),
        address: address?.trim() || null,
        latitude: latitude !== undefined ? Number(latitude) : null,
        longitude: longitude !== undefined ? Number(longitude) : null,
      },
    });
    return NextResponse.json({ data: domain }, { status: 201 });
  } catch (error) {
    console.error('Create domain error:', error);
    return NextResponse.json(
      { message: 'Failed to create domain' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { id, company, address, latitude, longitude } = await request.json();
    if (!id || !company?.trim()) {
      return NextResponse.json(
        { message: 'Domain ID and company name are required' },
        { status: 400 }
      );
    }
    const domain = await prisma.domain.update({
      where: { id },
      data: {
        company: company.trim(),
        address: address?.trim() || null,
        latitude: latitude !== undefined ? Number(latitude) : null,
        longitude: longitude !== undefined ? Number(longitude) : null,
      },
    });
    return NextResponse.json({ data: domain });
  } catch (error) {
    console.error('Update domain error:', error);
    return NextResponse.json(
      { message: 'Failed to update domain' },
      { status: 500 }
    );
  }
}
