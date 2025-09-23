// app/api/get-item/route.ts

// import { PrismaClient } from '@prisma/client';
import { PrismaClient } from '@/app/generated/prisma';
import { NextResponse, NextRequest } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const item = await prisma.user.findUnique({
      where: { id: Number(id) },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Convert BigInt fields to strings (if any)
    const safeItem = JSON.parse(
      JSON.stringify(item, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );

    return NextResponse.json(safeItem);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}