import { NextRequest, NextResponse } from "next/server";
import connectMongoDB from "@/lib/db_connect";
import Case from "@/models/Case";
import Client from "@/models/Client";
import cloudinary from "cloudinary";
cloudinary.v2.config({
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  cloud_name: process.env.NAME_CLOUDINARY,
});
export async function POST(req: Request) {
  try {
    const {
      client,
      caseTypeOF,
      type,
      caseDate,
      sessiondate,
      nots,
      court,
      files,
      decision,
      opponents,
      caseNumber,
      year,
      attorneyNumber,
    } = await req.json();
    await connectMongoDB();
    if (!client) {
      return NextResponse.json(
        { success: false, error: true, message: "يرجي اختيار الموكل" },
        { status: 500 }
      );
    }
    const addCase = await Case.create({
      client,
      caseTypeOF,
      files,
      caseDate,
      type,
      sessiondate,
      decision,
      nots,
      opponents,
      court,
      caseNumber,
      year,
      attorneyNumber,
    });
    return NextResponse.json(
      { success: true, data: addCase, message: "Case added successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding case:", error);
    return NextResponse.json(
      { success: false, error: true, message: "Case was not added" },
      { status: 500 }
    );
  }
}
export async function GET(req: NextRequest) {
  const searchQuery = req.nextUrl.searchParams.get("searchQuery");

  try {
    await connectMongoDB();

    const client = searchQuery
      ? await Client.find({ name: { $regex: searchQuery, $options: "i" } })
      : await Client.find();

    const clientIds = client.map((c) => c._id);

    const allCases = await Case.find(
      searchQuery
        ? {
            $or: [
              { caseNumber: { $regex: searchQuery, $options: "i" } },
              { caseTypeOF: { $regex: searchQuery, $options: "i" } },
              { type: { $regex: searchQuery, $options: "i" } },
              { attorneyNumberت: { $regex: searchQuery, $options: "i" } },
              { client: { $in: clientIds } },
            ],
          }
        : {}
    ).populate("client");
    return NextResponse.json(
      {
        success: true,
        data: allCases,
        message: "كل القضايا اتجمعت بنجاح",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching cases:", error);
    return NextResponse.json(
      { success: false, error: true, message: "القضايا معرفتش تتجمّع" },
      { status: 500 }
    );
  }
}
