import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["APPLIED", "IN_REVIEW", "INTERVIEW", "REJECTED", "OFFER"];

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { status, company, role } = body;

    const existing = await prisma.application.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, string> = {};

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    if (company !== undefined) {
      const trimmed = company.trim();
      if (!trimmed) {
        return NextResponse.json(
          { error: "Company name cannot be empty" },
          { status: 400 }
        );
      }
      updateData.company = trimmed;
      updateData.companyNorm = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
    }

    if (role !== undefined) {
      const trimmed = role.trim();
      if (!trimmed) {
        return NextResponse.json(
          { error: "Role cannot be empty" },
          { status: 400 }
        );
      }
      updateData.role = trimmed;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update. Provide status, company, or role." },
        { status: 400 }
      );
    }

    const updated = await prisma.application.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, application: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update application" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.application.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    await prisma.application.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete application" },
      { status: 500 }
    );
  }
}
