import connectMongoDB from "@/lib/db_connect";
import Case from "@/models/Case";
import Client from "@/models/Client";
import { Params } from "next/dist/server/request/params";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: any }) {
  try {
    const { id } =await params;
    await connectMongoDB();
    const singleClient = await Client.findOne({ _id: id });
    if (!singleClient) {
      return NextResponse.json(
        { message: "هذا الموكل غير موجود" },
        { status: 200 }
      );
    }
    return NextResponse.json({ singleClient }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
export async function PUT(req: Request, { params }: { params: any }) {
  try {
    const { id } =await params;
    const {
      newname: name,
      newemail: email,
      newphone: phone,
      newaddress: address,
      newopponents: opponents,
    } = await req.json();
    await connectMongoDB();
    await Client.findByIdAndUpdate(id, {
      name,
      email,
      phone,
      address,
      opponents,
    });
    return NextResponse.json(
      { message: "updated succsefully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
export async function DELETE(req: Request, { params }: { params: any }) {
  try {
    const { id } = params;
    await connectMongoDB();
    const client = await Client.findByIdAndDelete(id);
    if (client) {
      await Case.deleteMany({ client: id });
    }
    return NextResponse.json(
      { message: "DELETED successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
