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

export async function GET(req: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'غير مصرح لك بالوصول' }, { status: 401 });
    }

    const sessionUser: any = session.user;
    const sessionUserId = sessionUser.id;
    const accountType = sessionUser.accountType || 'owner';

    // firmOwnerId = معرف صاحب المكتب الفعلي (لو المستخدم موظف ناخد ownerId من التوكن)
    const firmOwnerId = (accountType === 'employee' && sessionUser.ownerId) ? sessionUser.ownerId : sessionUserId;

    // عشان نغطي الحالة القديمة (لو بعض العملاء مخزنين owner = employeeId)
    // نجلب كل الموظفين بتوع المكتب ونشوف العملاء اللي owner بين هؤلاء أو owner نفسه
    const employees = await User.find({ ownerId: firmOwnerId, accountType: 'employee' }).select('_id').lean();
    const employeeIds = employees.map((e: any) => e._id.toString());
    const ownerIds = [firmOwnerId, ...employeeIds].map(id => new mongoose.Types.ObjectId(id));

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
      { $project: { cases: 0 } } // ما نرجعش مصفوفة الملفات هنا لتقليل الحجم
    ]);

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
    const accountType = sessionUser.accountType || 'owner';
    const firmOwnerId = (accountType === 'employee' && sessionUser.ownerId) ? sessionUser.ownerId : sessionUser.id;

    const body = await req.json();
    const { name, email, phone, address } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: 'اسم الموكل مطلوب.' }, { status: 400 });
    }

    // تأكد ما فيش تكرار باسم الموكل ضمن نفس المكتب (owner = firmOwnerId)
    const existingClient = await Client.findOne({ name: name.trim(), owner: firmOwnerId });
    if (existingClient) {
      return NextResponse.json({ success: false, message: 'هذا الموكل موجود بالفعل.' }, { status: 400 });
    }

    const newClient = await Client.create({
      name: name.trim(),
      email: email || '',
      phone: phone || '',
      address: address || '',
      owner: firmOwnerId,     // **هنا نربط العميل بصاحب المكتب (owner) دائماً**
      createdBy: sessionUser.id // مين اللي أنشأه
    });

    return NextResponse.json({ success: true, data: newClient }, { status: 201 });
  } catch (error) {
    console.error('Error Creating Client:', error);
    return NextResponse.json({ success: false, message: getErrorMessage(error) }, { status: 500 });
  }
}
