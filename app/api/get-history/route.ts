import { PrismaClient } from '@/app/generated/prisma';
import { NextResponse, NextRequest } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { startDate, endDate, period } = await req.json();

    // ✅ Validate date inputs
    if (!startDate || isNaN(Date.parse(startDate))) {
      return NextResponse.json({ error: "Invalid or missing startDate" }, { status: 400 });
    }
    if (!endDate || isNaN(Date.parse(endDate))) {
      return NextResponse.json({ error: "Invalid or missing endDate" }, { status: 400 });
    }

    // ✅ Normalize start and end dates to include full days
    const from = new Date(startDate);
    from.setHours(0, 0, 0, 0); // 00:00:00.000

    const to = new Date(endDate);
    to.setHours(23, 59, 59, 999); // 23:59:59.999

    // ✅ Build Prisma query filters
    const whereFilter: any = {
      date: {
        gte: from,
        lte: to,
      },
    };

    if (period && typeof period === 'string' && period.trim() !== '') {
      whereFilter.period = period.trim().toLowerCase();
    }

    // ✅ Query the database
    const history = await prisma.history.findMany({
      where: whereFilter,
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json({ history }, { status: 200 });
  } catch (error) {
    console.error("❌ Get History API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
