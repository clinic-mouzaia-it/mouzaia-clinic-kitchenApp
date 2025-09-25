// app/api/add-user/route.ts

import { PrismaClient } from '@/app/generated/prisma';
import { NextResponse, NextRequest } from 'next/server';

const prisma = new PrismaClient();

async function generateUniqueId() {
  while (true) {
    // Generate random 12-digit number as string or bigint
    const randomId = BigInt(
      Math.floor(100000000000 + Math.random() * 900000000000).toString()
    );

    // Check if ID already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: randomId },
      select: { id: true },
    });

    if (!existingUser) {
      return randomId;
    }
    // else, loop and generate another
  }
}

export async function POST(req: NextRequest) {
  try {
    const { fullName, position, level, department } = await req.json();

    if (!fullName || typeof fullName !== "string" || fullName.trim() === "") {
      return NextResponse.json({ error: "Full Name is required" }, { status: 400 });
    }

    const id = await generateUniqueId();

    const newUser = await prisma.user.create({
      data: {
        id,
        fullName,
        departement: department || null,
        position: position || null,
        level: level || null,
      },
    });

    const safeUser = JSON.parse(
      JSON.stringify(newUser, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );

    return NextResponse.json({ user: safeUser }, { status: 201 });
  } catch (error) {
    console.error("Add User API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
