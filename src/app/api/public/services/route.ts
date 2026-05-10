import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const services = await prisma.service.findMany({
      include: { domain: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ data: services });
  } catch (error) {
    console.error("Public get services error:", error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}
