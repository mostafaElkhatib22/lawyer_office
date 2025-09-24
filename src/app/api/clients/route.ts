/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */
import dbConnect from '@/lib/dbConnect';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Client from '@/models/Client';
import User from '@/models/User';
import mongoose from 'mongoose';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
}

// Helper function to extract ObjectId from various formats
function extractObjectId(value: any): string {
  if (!value) return '';
  
  // If it's already a string and looks like an ObjectId, return it
  if (typeof value === 'string') {
    // Check if it's a valid ObjectId format (24 hex characters)
    if (/^[0-9a-fA-F]{24}$/.test(value)) {
      return value;
    }
    // If it's a stringified object, try to parse it
    if (value.includes('ObjectId')) {
      const match = value.match(/ObjectId\('([0-9a-fA-F]{24})'\)/);
      if (match) return match[1];
    }
    return '';
  }
  
  // If it's an object with _id property
  if (typeof value === 'object' && value._id) {
    return extractObjectId(value._id);
  }
  
  // If it's a mongoose ObjectId
  if (value.toString && /^[0-9a-fA-F]{24}$/.test(value.toString())) {
    return value.toString();
  }
  
  return '';
}

export async function GET(req: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'غير مصرح لك بالوصول' }, { status: 401 });
    }

    const sessionUser: any = session.user;
    const accountType = sessionUser.accountType || 'owner';

    // Simplified approach - just use the session user ID directly
    let firmOwnerId: any;
    
    if (accountType === 'employee' && sessionUser.ownerId) {
      // For employees, use the ownerId
      firmOwnerId = sessionUser.ownerId;
    } else {
      // For owners, use their own ID
      firmOwnerId = sessionUser.id;
    }

    // Convert to ObjectId if it's a string
    if (typeof firmOwnerId === 'string' && mongoose.Types.ObjectId.isValid(firmOwnerId)) {
      firmOwnerId = new mongoose.Types.ObjectId(firmOwnerId);
    }

    console.log('Using firmOwnerId:', firmOwnerId);

    // Get all employees for this firm owner
    const employees = await User.find({ 
      ownerId: firmOwnerId, 
      accountType: 'employee' 
    }).select('_id').lean();
    
    const employeeIds = employees.map((e: any) => e._id);
    const ownerIds = [firmOwnerId, ...employeeIds];

    console.log('Searching with owner IDs:', ownerIds);

    const clients = await Client.aggregate([
      { $match: { owner: { $in: ownerIds } } },
      {
        $lookup: {
          from: 'cases',
          localField: '_id',
          foreignField: 'client',
          as: 'cases'
        }
      },
      { $addFields: { caseCount: { $size: '$cases' } } },
      { $project: { cases: 0 } }
    ]);

    console.log('Found clients:', clients.length);

    return NextResponse.json({ success: true, data: clients }, { status: 200 });
  } catch (error) {
    console.error('Error Getting Clients:', error);
    return NextResponse.json({ success: false, message: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Authentication required.' }, { status: 401 });
    }

    const sessionUser: any = session.user;
    const sessionUserId = extractObjectId(sessionUser.id);
    const accountType = sessionUser.accountType || 'owner';
    
    let firmOwnerIdString: string;
    if (accountType === 'employee' && sessionUser.ownerId) {
      firmOwnerIdString = extractObjectId(sessionUser.ownerId);
    } else {
      firmOwnerIdString = sessionUserId;
    }

    if (!firmOwnerIdString || !mongoose.Types.ObjectId.isValid(firmOwnerIdString)) {
      return NextResponse.json({ success: false, message: 'معرف المالك غير صحيح' }, { status: 400 });
    }

    const firmOwnerId = new mongoose.Types.ObjectId(firmOwnerIdString);

    const body = await req.json();
    const { name, email, phone, address } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: 'اسم الموكل مطلوب.' }, { status: 400 });
    }

    // Check for duplicate client name within the same firm
    const existingClient = await Client.findOne({ 
      name: name.trim(), 
      owner: firmOwnerId 
    });
    
    if (existingClient) {
      return NextResponse.json({ success: false, message: 'هذا الموكل موجود بالفعل.' }, { status: 400 });
    }

    const newClient = await Client.create({
      name: name.trim(),
      email: email || '',
      phone: phone || '',
      address: address || '',
      owner: firmOwnerId,
      createdBy: new mongoose.Types.ObjectId(sessionUserId)
    });

    return NextResponse.json({ success: true, data: newClient }, { status: 201 });
  } catch (error) {
    console.error('Error Creating Client:', error);
    return NextResponse.json({ success: false, message: getErrorMessage(error) }, { status: 500 });
  }
}