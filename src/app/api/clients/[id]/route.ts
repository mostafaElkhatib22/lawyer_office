/* eslint-disable @typescript-eslint/no-explicit-any */
import { authOptions } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";
import dbConnect from "@/lib/dbConnect";
import Case from "@/models/Case";
import Client from "@/models/Client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const params = await context.params;
        const { id } = params;
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json(
                { success: false, message: "غير مصرح لك بالوصول" },
                { status: 401 }
            );
        }
        const singleClient = await Client.findOne({ _id: id });
        if (!singleClient) {
            return NextResponse.json({ message: "هذا الموكل غير موجود" }, { status: 200 });
        }
        return NextResponse.json({ singleClient }, { status: 200 });


    } catch (error) {
        return NextResponse.json({ error }, { status: 500 });

    }
}



export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();

        const params = await context.params;
        const { id } = params;
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, message: "غير مصرح لك بالوصول" },
                { status: 401 }
            );
        }

        const clientToDelete = await Client.findById(id);

        if (!clientToDelete) {
            return NextResponse.json(
                { success: false, message: "العميل غير موجود" },
                { status: 404 }
            );
        }

        if (clientToDelete.owner.toString() !== session.user.id) {
            return NextResponse.json(
                { success: false, message: "غير مصرح لك بحذف هذا العميل" },
                { status: 403 }
            );
        }

        const casesToDelete = await Case.find({ client: id });
        const allPublicIds: string[] = [];

        for (const caseItem of casesToDelete) {
            if (Array.isArray(caseItem.files)) {
                for (const file of caseItem.files) {
                    if (file?.publicId) {
                        allPublicIds.push(file.publicId);
                    } else if (typeof file === 'string') {
                        const regex = /\/v\d+\/(.*)\.\w{3,4}$/;
                        const match = file.match(regex);
                        if (match?.[1]) {
                            allPublicIds.push(match[1]);
                        }
                    }
                }
            }
        }

        if (allPublicIds.length > 0) {
            try {
                await cloudinary.api.delete_resources(allPublicIds);
                console.log('تم حذف الملفات من Cloudinary بنجاح');
            } catch (cloudinaryError) {
                console.error('خطأ أثناء حذف الملفات من Cloudinary:', cloudinaryError);
            }
        }

        await Case.deleteMany({ client: id });
        await Client.findByIdAndDelete(id);

        return NextResponse.json(
            { message: "تم حذف الموكل وجميع القضايا والملفات المرتبطة به بنجاح" },
            { status: 200 }
        );
    } catch (error) {
        console.error("خطأ أثناء الحذف:", error);
        return NextResponse.json(
            { success: false, message: "حدث خطأ غير متوقع أثناء عملية الحذف" },
            { status: 500 }
        );
    }
}
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect()
        const params = await context.params
        const { id } = params
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json(
                { success: false, message: "غير مصرح لك بالتحديث" },
                { status: 401 }
            );
        }
        const body = await req.json()
        const { name, phone, email, address } = body
        const existingClient = await Client.findById(id)
        if (!existingClient) {
            return NextResponse.json(
                { success: false, message: "الموكل غير موجود" },
                { status: 404 }
            );
        }
        if (existingClient.owner?.toString() !== session.user?.id) {
            return NextResponse.json(
                { success: false, message: "غير مصرح لك بتحديث هذه الدعوى" },
                { status: 403 }
            );

        }
        const updateClient = await Client.findByIdAndUpdate(id, {
            name, phone, email, address
        }, { runValidators: true, new: true })
        if (!updateClient) {
            return NextResponse.json(
                { success: false, message: "فشل في تحديث الموكل" },
                { status: 500 }
            );
        }
        return NextResponse.json({ success: true, data: updateClient }, { status: 200 });

    } catch (error: any) {
        console.error("Error updating client:", error);
        return NextResponse.json(
            { success: false, message: error.message || "فشل في تحديث الموكل" },
            { status: 500 }
        );
    }
}