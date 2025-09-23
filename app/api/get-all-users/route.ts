// app/api/get-item/route.ts

import { PrismaClient } from '@/app/generated/prisma'; // or '@prisma/client' if you're not customizing the client path
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const users = await prisma.user.findMany();

    if (!users || users.length === 0) {
      return NextResponse.json({ error: "No users found" }, { status: 404 });
    }

    // Safely convert any BigInt to string to avoid serialization issues
    const safeUsers = users.map(user => {
      const safeUser: Record<string, any> = {};
      for (const key in user) {
        const value = user[key as keyof typeof user];
        safeUser[key] = typeof value === 'bigint' ? value.toString() : value;
      }
      return safeUser;
    });

    return NextResponse.json(safeUsers);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
