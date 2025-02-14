import { NextRequest, NextResponse } from "next/server";
import connectMongoDB from "@/lib/db_connect";
import Client from "@/models/Client";
export async function POST(req: Request) {
  try {
    const { name, email, phone, address, opponents } = await req.json();
    await connectMongoDB();
    const clientExist = await Client.findOne({ name });
    if (!clientExist) {
      const newClient = await Client.create({
        name,
        email,
        phone,
        address,
        opponents,
      });
      return NextResponse.json(
        {
          success: true,
          data: newClient,
          message: "client added successfully",
        },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { success: false, error: true, message: "العميل بالفعل موجود" },
        { status: 402 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: true, message: "client doesn't add" },
      { status: 500 }
    );
  }
}



export async function GET(req: NextRequest) {
  const searchQuery = req.nextUrl.searchParams.get("searchQuery");

  try {
    await connectMongoDB();

    const clients = searchQuery
      ? await Client.aggregate([
          {
            $match: { name: { $regex: searchQuery, $options: "i" } },
          },
          {
            $lookup: {
              from: "cases",
              localField: "_id",
              foreignField: "client",
              as: "cases",
            },
          },
          { $addFields: { caseCount: { $size: "$cases" } } },
        ])
      : await Client.aggregate([
          {
            $lookup: {
              from: "cases",
              localField: "_id",
              foreignField: "client",
              as: "cases",
            },
          },
          { $addFields: { caseCount: { $size: "$cases" } } },
        ]);

    return NextResponse.json({ success: true, data: clients }, { status: 200 });
  } catch (error) {
    console.error("Error fetching clients:", (error as Error).message);
    return NextResponse.json(
      { success: false, message: "Error fetching clients", error: (error as Error).message },
      { status: 500 }
    );
  }
}
