'use server'

import { NextRequest, NextResponse } from 'next/server'
import bcryptjs from 'bcryptjs'
import { getFirestoreDb } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

/**
 * POST /api/auth/employee-credentials
 * 
 * تحقق من كلمة المرور المجزأة (hashed) لموظف
 * Verify employee password hash
 * 
 * Body:
 * {
 *   employeeId: string    // Firebase UID
 *   password: string      // Plain text password to verify
 * }
 * 
 * Response:
 * { success: true }       // Password valid
 * { success: false }      // Password invalid or error
 */
export async function POST(req: NextRequest) {
  try {
    const { employeeId, password } = await req.json()

    // تحقق من المدخلات
    if (!employeeId || !password) {
      return NextResponse.json(
        { success: false, error: 'Missing employeeId or password' },
        { status: 400 }
      )
    }

    // احصل على بيانات الموظف من Firestore
    const db = getFirestoreDb()
    const credDoc = await getDoc(doc(db, 'employeeCredentials', employeeId))

    if (!credDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Employee credentials not found' },
        { status: 404 }
      )
    }

    const data = credDoc.data()
    const hashedPassword = data?.password

    if (!hashedPassword) {
      return NextResponse.json(
        { success: false, error: 'No password set' },
        { status: 400 }
      )
    }

    // تحقق من كلمة المرور باستخدام bcryptjs
    const isValid = await bcryptjs.compare(password, hashedPassword)

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      )
    }

    // كلمة المرور صحيحة
    return NextResponse.json(
      { success: true },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error in employee credentials verification:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
