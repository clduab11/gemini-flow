// app/api/flows/route.ts
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { name, content } = await request.json();

    if (!name || !content) {
      return NextResponse.json({ error: 'Name and content are required' }, { status: 400 });
    }

    const newFlow = await prisma.flow.create({
      data: {
        name,
        content,
        userId: session.user.id,
      },
    });
    
    return NextResponse.json(newFlow, { status: 201 });
  } catch (error) {
    console.error('Error saving flow:', error);
    return NextResponse.json({ error: 'Failed to save flow' }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const flows = await prisma.flow.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
    
    return NextResponse.json(flows);
  } catch (error) {
    console.error('Error loading flows:', error);
    return NextResponse.json({ error: 'Failed to load flows' }, { status: 500 });
  }
}