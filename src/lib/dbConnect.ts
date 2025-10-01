/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */
// src/lib/dbConnect.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

interface CachedConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend global type
declare global {
  var mongoose: CachedConnection | undefined;
}

let cached: CachedConnection = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function dbConnect() {
  // ✅ لو في اتصال موجود، ارجعه على طول
  if (cached.conn) {
    console.log('✅ Using cached MongoDB connection.');
    return cached.conn;
  }

  // ✅ لو في promise شغال، استنى عليه
  if (cached.promise) {
    console.log('⏳ Waiting for existing MongoDB connection...');
    try {
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (error) {
      // لو فشل، امسح الـ promise وحاول تاني
      cached.promise = null;
      throw error;
    }
  }

  const opts = {
    bufferCommands: false,
    maxPoolSize: 10, // ✅ مهم جداً
    minPoolSize: 2,
    serverSelectionTimeoutMS: 10000, // ✅ زودته من 5000 لـ 10000
    socketTimeoutMS: 45000,
    family: 4, // ✅ استخدم IPv4 (بيحل مشاكل كتير)
    heartbeatFrequencyMS: 10000,
    retryWrites: true,
    retryReads: true,
  };

  try {
    console.log('🔄 Creating new MongoDB connection...');
    
    cached.promise = mongoose.connect((MONGODB_URI as string), opts).then((mongoose) => {
      console.log('✅ New MongoDB connection established successfully.');
      return mongoose;
    }).catch((error) => {
      console.error('❌ MongoDB connection failed:', error.message);
      cached.promise = null; // ✅ امسح الـ promise لو فشل
      throw error;
    });

    cached.conn = await cached.promise;
    return cached.conn;
    
  } catch (error: any) {
    console.error('❌ Error in dbConnect:', error.message);
    cached.promise = null;
    cached.conn = null;
    throw new Error(`Database connection failed: ${error.message}`);
  }
}

// ✅ Handle connection errors
mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB connection error:', error);
  cached.conn = null;
  cached.promise = null;
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected. Will reconnect on next request.');
  cached.conn = null;
  cached.promise = null;
});

// ✅ Handle graceful shutdown
if (process.env.NODE_ENV !== 'production') {
  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected successfully');
  });
}

export default dbConnect;