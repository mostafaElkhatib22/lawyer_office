/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/api/register/route.ts
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

// Type definitions
interface RegisterRequestBody {
  name: string;
  email: string;
  password: string;
}

interface MongoError {
  code?: number;
  name?: string;
  message?: string;
  errors?: Record<string, { message: string }>;
  keyValue?: Record<string, unknown>;
}

interface BcryptError {
  message?: string;
  name?: string;
}

// Helper function to extract error message
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  const mongoError = error as MongoError;
  
  // Handle MongoDB duplicate key error
  if (mongoError.code === 11000 && mongoError.keyValue) {
    const duplicateField = Object.keys(mongoError.keyValue)[0];
    return `A user with this ${duplicateField} already exists.`;
  }
  
  // Handle Mongoose validation errors
  if (mongoError.name === 'ValidationError' && mongoError.errors) {
    const messages = Object.values(mongoError.errors).map((val) => val.message);
    return messages.join(', ');
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unknown error occurred during registration.';
}

// Helper function to validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper function to validate password strength
function isValidPassword(password: string): { isValid: boolean; message?: string } {
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long.' };
  }
  
  if (password.length > 128) {
    return { isValid: false, message: 'Password must be less than 128 characters long.' };
  }
  
  // Optional: Add more password requirements
  // const hasUpperCase = /[A-Z]/.test(password);
  // const hasLowerCase = /[a-z]/.test(password);
  // const hasNumbers = /\d/.test(password);
  // const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return { isValid: true };
}

// Helper function to validate name
function isValidName(name: string): { isValid: boolean; message?: string } {
  if (name.length < 2) {
    return { isValid: false, message: 'Name must be at least 2 characters long.' };
  }
  
  if (name.length > 50) {
    return { isValid: false, message: 'Name must be less than 50 characters long.' };
  }
  
  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-Z\u0600-\u06FF\s\-']+$/;
  if (!nameRegex.test(name)) {
    return { isValid: false, message: 'Name can only contain letters, spaces, hyphens, and apostrophes.' };
  }
  
  return { isValid: true };
}

export async function POST(req: Request) {
  try {
    await dbConnect();
  } catch (error) {
    console.error("Database connection error:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Database connection failed. Please try again later." 
      },
      { status: 503 }
    );
  }

  try {
    // Parse request body
    let body: RegisterRequestBody;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json(
        { 
          success: false,
          message: "Invalid JSON format in request body." 
        },
        { status: 400 }
      );
    }

    const { name, email, password } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { 
          success: false,
          message: "Please provide all required fields: name, email, and password." 
        },
        { status: 400 }
      );
    }

    // Validate field types
    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { 
          success: false,
          message: "All fields must be valid strings." 
        },
        { status: 400 }
      );
    }

    // Trim and validate inputs
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    
    // Validate name
    const nameValidation = isValidName(trimmedName);
    if (!nameValidation.isValid) {
      return NextResponse.json(
        { 
          success: false,
          message: nameValidation.message 
        },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(trimmedEmail)) {
      return NextResponse.json(
        { 
          success: false,
          message: "Please provide a valid email address." 
        },
        { status: 400 }
      );
    }

    // Validate password
    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          success: false,
          message: passwordValidation.message 
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const [existingUserByEmail, existingUserByName] = await Promise.all([
      User.findOne({ email: trimmedEmail }).select('email').lean(),
      User.findOne({ name: trimmedName }).select('name').lean()
    ]);

    if (existingUserByEmail) {
      return NextResponse.json(
        { 
          success: false,
          message: "A user with this email address already exists." 
        },
        { status: 409 }
      );
    }

    if (existingUserByName) {
      return NextResponse.json(
        { 
          success: false,
          message: "A user with this name already exists." 
        },
        { status: 409 }
      );
    }

    // Hash password
    let hashedPassword: string;
    try {
      hashedPassword = await bcrypt.hash(password, 12); // Increased salt rounds for better security
    } catch (hashError) {
      console.error("Password hashing error:", hashError);
      const bcryptError = hashError as BcryptError;
      return NextResponse.json(
        { 
          success: false,
          message: `Error securing password: ${bcryptError.message || 'Unknown hashing error'}` 
        },
        { status: 500 }
      );
    }

    // Create new user
    try {
      const newUser = await User.create({
        name: trimmedName,
        email: trimmedEmail,
        password: hashedPassword,
        role: "lawyer",
      });

      // Log successful registration (without sensitive data)
      console.log(`New user registered: ${newUser.name} (${newUser.email})`);

      return NextResponse.json(
        { 
          success: true, 
          message: "User registered successfully!",
          data: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role
          }
        },
        { status: 201 }
      );
    } catch (createError) {
      console.error("User creation error:", createError);
      const errorMessage = getErrorMessage(createError);
      
      return NextResponse.json(
        { 
          success: false,
          message: `Failed to create user account: ${errorMessage}` 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Registration API Error:", error);
    const errorMessage = getErrorMessage(error);
    
    return NextResponse.json(
      { 
        success: false,
        message: `Server error during registration: ${errorMessage}` 
      },
      { status: 500 }
    );
  }
}

// Handle unsupported HTTP methods
export async function GET() {
  return NextResponse.json(
    { 
      success: false,
      message: "GET method is not allowed for this endpoint. Use POST to register." 
    }, 
    { 
      status: 405,
      headers: {
        'Allow': 'POST'
      }
    }
  );
}

export async function PUT() {
  return NextResponse.json(
    { 
      success: false,
      message: "PUT method is not allowed for this endpoint. Use POST to register." 
    }, 
    { 
      status: 405,
      headers: {
        'Allow': 'POST'
      }
    }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { 
      success: false,
      message: "DELETE method is not allowed for this endpoint. Use POST to register." 
    }, 
    { 
      status: 405,
      headers: {
        'Allow': 'POST'
      }
    }
  );
}