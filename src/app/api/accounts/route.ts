import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const accounts = await prisma.gmailAccount.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        isDefault: true,
        lastSyncedAt: true,
        authError: true,
        createdAt: true,
        _count: {
          select: {
            applications: true,
            notifications: true,
          },
        },
      },
    });

    return NextResponse.json({
      accounts: accounts.map((acc) => ({
        id: acc.id,
        email: acc.email,
        isDefault: acc.isDefault,
        lastSyncedAt: acc.lastSyncedAt,
        authError: acc.authError,
        isConnected: !acc.authError,
        applicationCount: acc._count.applications,
        notificationCount: acc._count.notifications,
        createdAt: acc.createdAt,
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load accounts" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    let email = searchParams.get("email");

    if (!email) {
      try {
        const body = await req.json();
        email = body.email;
      } catch {
        // no body
      }
    }

    if (!email) {
      return NextResponse.json(
        { error: "Account email is required" },
        { status: 400 }
      );
    }

    await prisma.gmailAccount.delete({
      where: { email },
    });

    return NextResponse.json({ success: true, removedEmail: email });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to remove account" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, isDefault } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (isDefault) {
      // Clear other defaults
      await prisma.gmailAccount.updateMany({
        where: { email: { not: email } },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.gmailAccount.update({
      where: { email },
      data: { ...(isDefault !== undefined ? { isDefault } : {}) },
    });

    return NextResponse.json({ success: true, account: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update account" },
      { status: 500 }
    );
  }
}
