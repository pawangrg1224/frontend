import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorizedResponse } from "@/lib/session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.email) return unauthorizedResponse();

    const { id } = await params;
    const service = await prisma.service.findUnique({
      where: { id },
      include: { domain: true },
    });

    if (!service)
      return NextResponse.json({ message: "Service not found" }, { status: 404 });
    return NextResponse.json(service);
  } catch (error) {
    console.error("Get service error:", error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.email) return unauthorizedResponse();

    const { id } = await params;
    const body = await request.json();
    const { name, description, duration, price, domainId } = body;

    const service = await prisma.service.findUnique({ where: { id } });
    if (!service)
      return NextResponse.json({ message: "Service not found" }, { status: 404 });

    const updated = await prisma.service.update({
      where: { id },
      data: {
        ...(name && { name: String(name) }),
        ...(description !== undefined && { description: description || null }),
        ...(duration !== undefined && duration !== '' && { duration: parseInt(String(duration)) }),
        ...(price !== undefined && price !== '' && { price: parseFloat(String(price)) }),
        ...(domainId !== undefined && { domainId: domainId || null }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update service error:", error);
    return NextResponse.json({ message: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.email) return unauthorizedResponse();

    const { id } = await params;

    const service = await prisma.service.findUnique({ where: { id } });
    if (!service)
      return NextResponse.json({ message: "Service not found" }, { status: 404 });

    // Delete in dependency order
    const appointments = await prisma.appointment.findMany({
      where: { serviceId: id },
      select: { id: true },
    });
    const appointmentIds = appointments.map((a) => a.id);

    if (appointmentIds.length > 0) {
      await prisma.notificationLog.deleteMany({ where: { appointmentId: { in: appointmentIds } } });
      await prisma.message.deleteMany({ where: { appointmentId: { in: appointmentIds } } });
      await prisma.review.deleteMany({ where: { appointmentId: { in: appointmentIds } } });
      await prisma.appointment.deleteMany({ where: { serviceId: id } });
    }

    await prisma.review.deleteMany({ where: { serviceId: id } });
    await prisma.service.delete({ where: { id } });

    return NextResponse.json({ message: "Service deleted" });
  } catch (error) {
    console.error("Delete service error:", error);
    return NextResponse.json({ message: String(error) }, { status: 500 });
  }
}
