import { PrismaClient } from '@/app/generated/prisma'; // or '@prisma/client' if you're not generating a custom Prisma path
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, fullName, departement, position, level } = body;

    // ✅ Validate required fields
    if (!id) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    // Optional: validate that fullName is not empty if required
    if (!fullName) {
      return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
    }

    // 🛠️ Update the user
    const updatedUser = await prisma.user.update({
      where: { id: Number(id) }, // Assuming `id` is numeric
      data: {
        fullName,
        departement,
        position,
        level,
      },
    });

    // 🧼 Convert BigInt fields safely (if any)
    const safeUser = JSON.parse(
      JSON.stringify(updatedUser, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );

    return NextResponse.json(safeUser, { status: 200 });
  } catch (error: any) {
    console.error('PUT /api/update-user error:', error);

    // Handle not found
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
