import { NextRequest, NextResponse } from "next/server";
import connectMongoDB from "@/lib/db_connect";
import Case from "@/models/Case";
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<any> }
) {
  try {
    const id = (await params).id;
    await connectMongoDB();
    const singleCase = await Case.findOne({ _id: id }).populate("client");
    if (!singleCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }
    return NextResponse.json({ singleCase }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<any> }
) {
  try {
    const { id } = await params;
    const {
      newclient: client,
      newType:type,
      newsessiondate: sessiondate,
      newcaseTypeOF: caseTypeOF,
      newcaseDate: caseDate,
      newnots: nots,
      newcourt: court,
      newcaseNumber: caseNumber,
      newyear: year,
      newopponents: opponents,
      newAttorneyNumber: attorneyNumber,
      newdecision: decision,
      newFiles: files,
    } = await req.json();
    await connectMongoDB();
    await Case.findByIdAndUpdate(id, {
      client,
      caseTypeOF,
      caseDate,
      type,
      sessiondate,
      nots,
      decision,
      opponents,
      court,
      caseNumber,
      year,
      files,
      attorneyNumber,
    }).populate("client");
    return NextResponse.json(
      { message: "Updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params:  Promise<any> }
) {
  try {
    const { id } = await params;
    await connectMongoDB();
    const deletedCase = await Case.findByIdAndDelete(id);
    if (!deletedCase) {
      return NextResponse.json(
        { success: false, error: true, message: "Case not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        success: true,
        data: deletedCase,
        message: "Case deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: true, message: "Failed to delete case" },
      { status: 500 }
    );
  }
}
