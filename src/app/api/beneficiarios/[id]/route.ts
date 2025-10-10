import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { mapRH, mapZona, mapSexo, mapDiscapacidad, mapPayload } from '../route'; // reutilizamos helpers

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const item = await prisma.beneficiario.findUnique({ where: { id: params.id } });
  return item
    ? NextResponse.json(item)
    : NextResponse.json({ error: 'No encontrado' }, { status: 404 });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const data = mapPayload(body) as Prisma.BeneficiarioUpdateInput;
    const up = await prisma.beneficiario.update({ where: { id: params.id }, data });
    return NextResponse.json(up);
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.beneficiario.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 500 });
  }
}
