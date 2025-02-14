import { NextRequest, NextResponse } from "next/server";

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function DELETE(req: NextRequest) {
  try {
    const { publicId } = await req.json();
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== "ok" && result.result !== "not found") {
      return NextResponse.json(
        { success: false, message: "بنعتذر لمعاليك لم يتم حذف الصورة" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "تم حذف الصورة" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    return NextResponse.json(
      { success: false, message: "Error deleting image" },
      { status: 500 }
    );
  }
}
