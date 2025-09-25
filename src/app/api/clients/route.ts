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

// Helper function to safely extract ObjectId
function safeExtractObjectId(value: any): string | null {
  if (!value) return null;
  
  try {
    // If it's already a valid ObjectId string
    if (typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value)) {
      return value;
    }
    
    // If it's a mongoose ObjectId object
    if (value._id && typeof value._id === 'string') {
      return /^[0-9a-fA-F]{24}$/.test(value._id) ? value._id : null;
    }
    
    // If it has toString method that returns valid ObjectId
    if (value.toString && typeof value.toString === 'function') {
      const stringValue = value.toString();
      return /^[0-9a-fA-F]{24}$/.test(stringValue) ? stringValue : null;
    }
    
    // If it's a stringified object containing ObjectId
    if (typeof value === 'string' && value.includes('ObjectId')) {
      const match = value.match(/[0-9a-fA-F]{24}/);
      return match ? match[0] : null;
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting ObjectId:', error);
    return null;
  }
}

export async function GET(req: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log('No session or user ID found');
      return NextResponse.json({ success: false, message: 'غير مصرح لك بالوصول' }, { status: 401 });
    }

    const sessionUser: any = session.user;
    console.log('Session User raw:', sessionUser);

    // Safe extraction of user ID
    const sessionUserId = safeExtractObjectId(sessionUser.id);
    if (!sessionUserId) {
      console.error('Could not extract valid session user ID from:', sessionUser.id);
      return NextResponse.json({ success: false, message: 'معرف المستخدم غير صحيح' }, { status: 400 });
    }

    const accountType = sessionUser.accountType || 'owner';
    console.log('Session User ID:', sessionUserId);
    console.log('Account Type:', accountType);

    // Determine firm owner ID
    let firmOwnerIdString: string;
    if (accountType === 'employee' && sessionUser.ownerId) {
      const extractedOwnerId = safeExtractObjectId(sessionUser.ownerId);
      if (!extractedOwnerId) {
        console.error('Could not extract valid owner ID from:', sessionUser.ownerId);
        return NextResponse.json({ success: false, message: 'معرف المالك غير صحيح' }, { status: 400 });
      }
      firmOwnerIdString = extractedOwnerId;
    } else {
      firmOwnerIdString = sessionUserId;
    }

    console.log('Using firm owner ID:', firmOwnerIdString);

    // Validate and create ObjectId
    if (!mongoose.Types.ObjectId.isValid(firmOwnerIdString)) {
      console.error('Invalid ObjectId format:', firmOwnerIdString);
      return NextResponse.json({ success: false, message: 'معرف المالك غير صحيح' }, { status: 400 });
    }

    const firmOwnerId = new mongoose.Types.ObjectId(firmOwnerIdString);

    // Get employees for this firm
    const employees = await User.find({ 
      ownerId: firmOwnerId, 
      accountType: 'employee' 
    }).select('_id').lean();
    
    console.log('Found employees:', employees.length);
    
    const employeeIds = employees.map((e: any) => new mongoose.Types.ObjectId(e._id));
    const ownerIds = [firmOwnerId, ...employeeIds];

    console.log('Searching for clients with owner IDs:', ownerIds.map(id => id.toString()));

    // Get clients
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
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json({ 
      success: false, 
      message: 'حدث خطأ في الخادم',
      error: process.env.NODE_ENV === 'development' ? getErrorMessage(error) : undefined
    }, { status: 500 });
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
    const sessionUserId = safeExtractObjectId(sessionUser.id);
    
    if (!sessionUserId) {
      return NextResponse.json({ success: false, message: 'معرف المستخدم غير صحيح' }, { status: 400 });
    }

    const accountType = sessionUser.accountType || 'owner';
    
    let firmOwnerIdString: string;
    if (accountType === 'employee' && sessionUser.ownerId) {
      const extractedOwnerId = safeExtractObjectId(sessionUser.ownerId);
      if (!extractedOwnerId) {
        return NextResponse.json({ success: false, message: 'معرف المالك غير صحيح' }, { status: 400 });
      }
      firmOwnerIdString = extractedOwnerId;
    } else {
      firmOwnerIdString = sessionUserId;
    }

    if (!mongoose.Types.ObjectId.isValid(firmOwnerIdString)) {
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