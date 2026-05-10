import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorizedResponse } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.email) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.service.count(),
    ]);

    return NextResponse.json({
      data: services,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get services error:", error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.email) return unauthorizedResponse();

    const { name, description, duration, price, domainId } =
      await request.json();

    if (!name || !duration || !price) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    if (duration < 15 || duration > 480) {
      return NextResponse.json(
        { message: "Duration must be between 15 and 480 minutes" },
        { status: 400 },
      );
    }

    if (price < 0) {
      return NextResponse.json(
        { message: "Price must be positive" },
        { status: 400 },
      );
    }

    const service = await prisma.service.create({
      data: {
        name,
        description,
        duration: parseInt(duration),
        price: parseFloat(price),
        domainId: domainId || null,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error("Create service error:", error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}
