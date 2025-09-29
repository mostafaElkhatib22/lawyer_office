/* eslint-disable @typescript-eslint/no-explicit-any */
// src/models/Appointment.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IAppointment extends Document {
  title: string;
  description?: string;
  appointmentType: 'consultation' | 'court_session' | 'client_meeting' | 'internal_meeting' | 'other';
  startTime: Date;
  endTime: Date;
  location?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // الأشخاص المرتبطين بالموعد
  assignedTo: mongoose.Schema.Types.ObjectId[]; // الموظفين المعينين للموعد
  client?: mongoose.Schema.Types.ObjectId; // الموكل (اختياري)
  case?: mongoose.Schema.Types.ObjectId; // القضية المرتبطة (اختياري)
  
  // معلومات المكتب
  owner: mongoose.Schema.Types.ObjectId; // صاحب المكتب
  
  // تفاصيل إضافية
  notes?: string;
  reminders: {
    enabled: boolean;
    time: number; // بالدقائق قبل الموعد (مثلاً 30 دقيقة)
  };
  
  // تتبع التغييرات
  createdBy: mongoose.Schema.Types.ObjectId;
  lastModifiedBy?: mongoose.Schema.Types.ObjectId;
  
  // للمواعيد المتكررة (اختياري)
  isRecurring: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number; // كل كم (يوم/أسبوع/شهر)
    endDate?: Date;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'عنوان الموعد مطلوب'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    appointmentType: {
      type: String,
      enum: ['consultation', 'court_session', 'client_meeting', 'internal_meeting', 'other'],
      default: 'client_meeting',
      required: true,
    },
    startTime: {
      type: Date,
      required: [true, 'وقت بداية الموعد مطلوب'],
    },
    endTime: {
      type: Date,
      required: [true, 'وقت نهاية الموعد مطلوب'],
      validate: {
        validator: function(this: IAppointment, value: Date) {
          return value > this.startTime;
        },
        message: 'وقت النهاية يجب أن يكون بعد وقت البداية',
      },
    },
    location: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
      default: 'scheduled',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    assignedTo: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }],
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
    },
    case: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    reminders: {
      enabled: {
        type: Boolean,
        default: true,
      },
      time: {
        type: Number,
        default: 30, // 30 دقيقة قبل الموعد
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPattern: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
      },
      interval: {
        type: Number,
        min: 1,
      },
      endDate: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

// فهارس لتحسين الأداء
AppointmentSchema.index({ owner: 1, startTime: 1 });
AppointmentSchema.index({ assignedTo: 1, startTime: 1 });
AppointmentSchema.index({ client: 1 });
AppointmentSchema.index({ case: 1 });
AppointmentSchema.index({ status: 1 });

// التحقق من عدم تعارض المواعيد
AppointmentSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('startTime') || this.isModified('endTime') || this.isModified('assignedTo')) {
    const AppointmentModel = this.constructor as mongoose.Model<IAppointment>;
    
    // التحقق من تعارض المواعيد لكل موظف معين
    for (const userId of (this.assignedTo as any)) {
      const conflictingAppointment = await AppointmentModel.findOne({
        _id: { $ne: this._id },
        assignedTo: userId,
        status: { $in: ['scheduled', 'rescheduled'] },
        $or: [
          {
            startTime: { $lt: this.endTime },
            endTime: { $gt: this.startTime },
          },
        ],
      });

      if (conflictingAppointment) {
        return next(new Error('يوجد تعارض في المواعيد لأحد الموظفين المعينين'));
      }
    }
  }
  next();
});

const Appointment = (mongoose.models.Appointment || 
  mongoose.model<IAppointment>('Appointment', AppointmentSchema)) as mongoose.Model<IAppointment>;

export default Appointment;