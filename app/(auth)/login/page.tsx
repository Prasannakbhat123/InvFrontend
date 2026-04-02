'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { auth } from '@/app/lib/api'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Call the backend API
      const response = await auth.login(formData.username, formData.password)
      
      toast.success(`Welcome back, ${response.role}!`)
      
      // Redirect based on user role
      if (response.role === 'admin') {
        router.push('/admin')
      } else if (response.role === 'employee') {
        router.push('/employee')
      } else {
        router.push('/') // Fallback
      }
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error(error.message || 'Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div 
      className="min-h-screen relative flex items-center justify-center px-4"
      style={{
        backgroundImage: 'url(/assets/login/scene.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-6">
        <img src="/assets/logo.png" alt="Windscapes Landscaping" className="h-12 w-auto cursor-pointer" />
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-[#9DB57E] rounded-3xl shadow-2xl p-10 mt-16">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#13452D] mb-2">
            Welcome Back
          </h1>
          <p className="text-white text-sm">Sign in to continue to Windscapes</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="username" className="block text-[#13452D] font-semibold text-sm">
              User name
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              className="w-full h-12 px-4 rounded-lg border-2 border-[#13452D] focus:outline-none focus:ring-2 focus:ring-[#1F764D] transition-all text-black bg-amber-50"
              placeholder=""
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="block text-[#13452D] font-semibold text-sm">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full h-12 px-4 pr-12 rounded-lg border-2 border-[#13452D] focus:outline-none focus:ring-2 focus:ring-[#1F764D] transition-all text-black bg-amber-50"
                placeholder=""
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#13452D] hover:text-[#1F764D] transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full h-12 text-base font-bold bg-[#13452D] hover:bg-[#1F764D] text-white rounded-lg transition-all duration-300 uppercase tracking-wider cursor-pointer" 
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              'LOGIN'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}