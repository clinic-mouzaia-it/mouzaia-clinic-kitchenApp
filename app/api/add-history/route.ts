// app/api/add-history/route.ts

import { PrismaClient } from '@/app/generated/prisma';
import { NextResponse, NextRequest } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { fullName, level, date, period } = await req.json();

    if (!fullName || typeof fullName !== "string" || fullName.trim() === "") {
      return NextResponse.json({ error: "Full Name is required" }, { status: 400 });
    }

    if (!date || isNaN(Date.parse(date))) {
      return NextResponse.json({ error: "Invalid or missing date" }, { status: 400 });
    }

    if (!period || typeof period !== "string") {
      return NextResponse.json({ error: "Period is required" }, { status: 400 });
    }

    const newRecord = await prisma.history.create({
      data: {
        fullName: fullName.trim(),
        level: level,
        date: new Date(date), // ensure it's a Date object
        period: period.trim(),
      },
    });

    return NextResponse.json({ newRecord }, { status: 201 });
  } catch (error) {
    console.error("Add History API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
