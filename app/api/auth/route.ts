import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

// Mock user database
const users = [
  {
    user_id: '1',
    user_username: 'admin',
    user_password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    role: 'ADMIN' as const,
    created_at: new Date('2024-01-01'),
  },
  {
    user_id: '2',
    user_username: 'employee',
    user_password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    role: 'EMPLOYEE' as const,
    created_at: new Date('2024-01-01'),
  },
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Find user
    const user = users.find(u => u.user_username === username)
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // For demo purposes, accept simple passwords
    const isValidPassword = password === 'admin123' && username === 'admin' ||
                           password === 'emp123' && username === 'employee'
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Return user info (without password)
    const { user_password, ...userWithoutPassword } = user
    return NextResponse.json({
      user: userWithoutPassword,
      message: 'Login successful'
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Authentication endpoint - POST only' },
    { status: 405 }
  )
}