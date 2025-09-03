// src/app/api/images/route.ts
import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Type definitions
interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  resource_type?: string;
  format?: string;
}

interface CloudinaryDeleteResult {
  result: 'ok' | 'not found' | string;
}

interface CloudinaryError {
  message?: string;
  http_code?: number;
  error?: {
    message?: string;
  };
}

interface UploadRequestBody {
  imageBase64: string;
}

interface DeleteRequestBody {
  publicId: string;
}

// Helper function to extract error message
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  const cloudinaryError = error as CloudinaryError;
  if (cloudinaryError.error?.message) {
    return cloudinaryError.error.message;
  }
  if (cloudinaryError.message) {
    return cloudinaryError.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unknown error occurred';
}

// Helper to extract public ID from Cloudinary URL (Enhanced for consistency and robustness)
const getPublicIdFromUrl = (fileUrl: string): string => {
  if (!fileUrl) return '';

  try {
    const parts = fileUrl.split("/");
    const uploadIndex = parts.indexOf("upload");

    if (uploadIndex === -1 || uploadIndex + 1 >= parts.length) {
      return '';
    }

    let publicIdWithVersion = parts.slice(uploadIndex + 1).join('/');
    const publicIdParts = publicIdWithVersion.split('/');

    // Remove version part if exists (starts with 'v' and has 11 characters or more)
    // This check is now more robust by using length >= 11
    if (publicIdParts[0] &&
      publicIdParts[0].startsWith('v') &&
      publicIdParts[0].length >= 11 &&
      !isNaN(parseInt(publicIdParts[0].substring(1)))) {
      publicIdParts.shift(); // Remove the version part
      publicIdWithVersion = publicIdParts.join('/');
    }

    // The final public ID is the path before the file extension
    const lastDotIndex = publicIdWithVersion.lastIndexOf('.');
    return lastDotIndex > -1 ? publicIdWithVersion.substring(0, lastDotIndex) : publicIdWithVersion;
  } catch (error) {
    console.error('Backend: Error extracting public ID from URL:', error, 'from URL:', fileUrl);
    return '';
  }
};

// UPLOAD Image
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    console.warn('Backend File Upload: Authentication failed.');
    return NextResponse.json(
      { success: false, message: 'Authentication required to upload files.' },
      { status: 401 }
    );
  }

  try {
    const body: UploadRequestBody = await req.json();
    const { imageBase64 } = body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      console.warn('Backend File Upload: No valid file data provided.');
      return NextResponse.json(
        { success: false, message: 'No valid file data provided.' },
        { status: 400 }
      );
    }

    // For Cloudinary's 'resource_type: auto', we don't strictly need to check 'data:image/'
    // It can handle 'data:application/pdf', 'data:text/plain' etc.
    // However, ensuring it's a base64 string is important.

    console.log('Backend File Upload: Attempting to upload file to Cloudinary.');
    const uploadResult = await cloudinary.uploader.upload(imageBase64, {
      folder: 'lawyer_app_files', // يفضل تغيير اسم المجلد ليعكس أنه يحتوي على ملفات وصور
      resource_type: 'auto',      // Cloudinary سيتعرف تلقائيًا على نوع الملف (image, raw, video)
      quality: 'auto',
      fetch_format: 'auto',
    }) as CloudinaryUploadResult;

    if (uploadResult?.secure_url && uploadResult?.public_id) {
      console.log('Backend File Upload: File uploaded successfully:', uploadResult.public_id, 'URL:', uploadResult.secure_url, 'Resource Type:', uploadResult.resource_type);
      return NextResponse.json({
        success: true,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        resourceType: uploadResult.resource_type
      }, { status: 200 });
    } else {
      console.error('Backend File Upload: Failed to upload to Cloudinary, result missing data.', uploadResult);
      return NextResponse.json(
        { success: false, message: 'Failed to upload file to Cloudinary. Missing URL or Public ID.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Backend File Upload API Error:', error);
    const errorMessage = getErrorMessage(error);

    return NextResponse.json({
      success: false,
      message: `Server error during file upload: ${errorMessage}`
    }, { status: 500 });
  }
}

// DELETE File (image or raw)
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    console.warn('Backend File Deletion: Authentication failed.');
    return NextResponse.json(
      { success: false, message: 'Authentication required to delete files.' },
      { status: 401 }
    );
  }

  try {
    const body: DeleteRequestBody = await req.json();
    const { publicId } = body;

    // --- Detailed Logging Start ---
    console.log('--- Backend File Deletion Request ---');
    console.log(`1. Received publicId from frontend: '${publicId}'`);
    // --- Detailed Logging End ---

    if (!publicId || typeof publicId !== 'string') {
      console.warn('Backend File Deletion: No valid public ID provided for deletion.');
      return NextResponse.json(
        { success: false, message: 'No valid public ID provided for deletion.' },
        { status: 400 }
      );
    }

    let destroyResult: CloudinaryDeleteResult | undefined;
    let deletionSuccessful = false;
    let attemptedAsImage = false;
    let attemptedAsRaw = false;

    // 1. Try deleting as an 'image' resource (default behavior for photos)
    try {
      attemptedAsImage = true;
      console.log(`2. Attempting to destroy publicId '${publicId}' as 'image' resource_type.`);
      destroyResult = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' }) as CloudinaryDeleteResult;
      console.log(`3. Result for '${publicId}' (image attempt):`, destroyResult);
      if (destroyResult.result === 'ok') {
        deletionSuccessful = true;
        console.log(`4. Successfully deleted '${publicId}' as 'image'.`);
      }
    } catch (imageDeleteError) {
      console.warn(`3. Failed to destroy '${publicId}' as 'image':`, getErrorMessage(imageDeleteError));
      // Continue to try 'raw' even if 'image' attempt threw an error
    }

    // 2. If not successful as image, try deleting as a 'raw' resource (for PDFs, Word docs, etc.)
    if (!deletionSuccessful) {
      try {
        attemptedAsRaw = true;
        console.log(`5. Attempting to destroy publicId '${publicId}' as 'raw' resource_type.`);
        destroyResult = await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }) as CloudinaryDeleteResult;
        console.log(`6. Result for '${publicId}' (raw attempt):`, destroyResult);
        if (destroyResult.result === 'ok') {
          deletionSuccessful = true;
          console.log(`7. Successfully deleted '${publicId}' as 'raw'.`);
        }
      } catch (rawDeleteError) {
        console.warn(`6. Failed to destroy '${publicId}' as 'raw':`, getErrorMessage(rawDeleteError));
      }
    }

    // Final result handling
    if (deletionSuccessful) {
      console.log('8. Backend File Deletion: Final successful deletion for:', publicId);
      return NextResponse.json({
        success: true,
        message: 'File deleted successfully.'
      }, { status: 200 });
    } else if (destroyResult?.result === 'not found') {
      console.warn('8. Backend File Deletion: File not found or already deleted after trying both image and raw:', publicId);
      return NextResponse.json({
        success: false,
        message: 'File not found or already deleted.'
      }, { status: 404 });
    } else {
      console.error('8. Backend File Deletion: Failed to delete file with unexpected result after trying both types:', publicId, destroyResult);
      let failureReason = `Failed to delete file from Cloudinary after trying ${attemptedAsImage ? 'image' : ''}${attemptedAsImage && attemptedAsRaw ? ' and ' : ''}${attemptedAsRaw ? 'raw' : ''} resource types.`;
      if (destroyResult?.result) {
        failureReason += ` Last Cloudinary result: ${destroyResult.result}`;
      }
      return NextResponse.json({
        success: false,
        message: failureReason
      }, { status: 500 });
    }
  } catch (error) {
    console.error('9. Backend File Deletion API General Error (outside Cloudinary SDK calls):', error);
    const errorMessage = getErrorMessage(error);

    return NextResponse.json({
      success: false,
      message: `Server error during file deletion: ${errorMessage}`
    }, { status: 500 });
  }
}

// GET - Helper endpoint to extract public ID from URL (optional utility)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    console.warn('Backend Public ID Extraction GET: Authentication failed.');
    return NextResponse.json(
      { success: false, message: 'Authentication required.' },
      { status: 401 }
    );
  }

  try {
    const url = new URL(req.url);
    const fileUrl = url.searchParams.get('fileUrl');

    if (!fileUrl) {
      console.warn('Backend Public ID Extraction GET: No file URL provided.');
      return NextResponse.json(
        { success: false, message: 'No file URL provided.' },
        { status: 400 }
      );
    }

    const publicId = getPublicIdFromUrl(fileUrl);
    console.log('Backend Public ID Extraction GET: Extracted public ID:', publicId, 'from URL:', fileUrl);

    return NextResponse.json({
      success: true,
      publicId: publicId || null
    }, { status: 200 });
  } catch (error) {
    console.error('Backend Public ID Extraction GET Error:', error);
    const errorMessage = getErrorMessage(error);

    return NextResponse.json({
      success: false,
      message: `Error extracting public ID: ${errorMessage}`
    }, { status: 500 });
  }
}
