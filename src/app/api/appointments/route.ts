import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorizedResponse } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.email) return unauthorizedResponse();

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user)
      return NextResponse.json({ message: "User not found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where: user.role === 'ADMIN'
          ? {}  // Admin sees all
          : { patientId: user.id },  // Patient sees only their own
        include: {
          customer: true,
          service: { include: { domain: true } },
          domain: true,
          slot: true,
        },
        skip,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      prisma.appointment.count({
        where: user.role === 'ADMIN' ? {} : { patientId: user.id },
      }),
    ]);

    return NextResponse.json({
      data: appointments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get appointments error:", error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.email) return unauthorizedResponse();

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user)
      return NextResponse.json({ message: "User not found" }, { status: 404 });

    const { customerId, serviceId, domainId, date, notes, slotId, patientSelf } =
      await request.json();

    if (!serviceId || !date) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    // Extract patient info from notes if present
    let nameFromNotes = ''
    let emailFromNotes = ''
    let phoneFromNotes = ''
    if (notes) {
      const nameMatch = notes.match(/Patient:\s*(.+)/i)
      const emailMatch = notes.match(/Email:\s*(.+)/i)
      const phoneMatch = notes.match(/Phone:\s*(.+)/i)

      if (nameMatch) nameFromNotes = nameMatch[1].trim()
      if (emailMatch) emailFromNotes = emailMatch[1].trim()
      if (phoneMatch) phoneFromNotes = phoneMatch[1].trim()
    }

    // For patient self-booking, resolve or create their customer record
    let resolvedCustomerId = customerId
    if (patientSelf && !customerId) {
      // Use email from notes if available, otherwise use user email
      const customerEmail = emailFromNotes || user.email

      // Try to find existing customer record by email
      let customerRecord = await prisma.customer.findUnique({
        where: { email: customerEmail },
      })

      // If no customer record exists, create one with form data
      if (!customerRecord) {
        customerRecord = await prisma.customer.create({
          data: {
            name: nameFromNotes || user.name || 'Patient',
            email: customerEmail,
            phone: phoneFromNotes || user.company || '',
          },
        })
      } else {
        // Update existing customer record with form data if provided
        const updateData: any = {}
        if (nameFromNotes) updateData.name = nameFromNotes
        if (phoneFromNotes) updateData.phone = phoneFromNotes

        if (Object.keys(updateData).length > 0) {
          customerRecord = await prisma.customer.update({
            where: { id: customerRecord.id },
            data: updateData,
          })
        }
      }

      resolvedCustomerId = customerRecord.id
    }

    if (!resolvedCustomerId) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    // Verify customer and service exist
    const [customer, service] = await Promise.all([
      prisma.customer.findUnique({ where: { id: resolvedCustomerId } }),
      prisma.service.findUnique({ where: { id: serviceId } }),
    ]);

    if (!customer || !service) {
      return NextResponse.json(
        { message: "Customer or service not found" },
        { status: 404 },
      );
    }

    // If a slotId is provided, verify the slot has capacity
    if (slotId) {
      const slot = await prisma.appointmentSlot.findUnique({
        where: { id: slotId },
        include: {
          _count: { select: { appointments: { where: { status: { in: ['PENDING', 'CONFIRMED'] } } } } },
        },
      })
      if (!slot) {
        return NextResponse.json({ message: "Slot not found" }, { status: 404 })
      }
      if (!slot.isOpen) {
        return NextResponse.json({ message: "This slot is closed" }, { status: 409 })
      }
      if (slot._count.appointments >= slot.slotLimit) {
        return NextResponse.json({ message: "This slot is fully booked" }, { status: 409 })
      }
    }

    const appointment = await prisma.appointment.create({
      data: {
        date: new Date(date),
        notes,
        customerId: resolvedCustomerId,
        serviceId,
        domainId: domainId || null,
        userId: user.id,
        patientId: patientSelf ? user.id : undefined,
        slotId: slotId || null,
        status: "PENDING",
      },
      include: {
        customer: true,
        service: { include: { domain: true } },
        domain: true,
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error("Create appointment error:", error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}
