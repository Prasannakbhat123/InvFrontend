'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, UserPlus, Eye, EyeOff } from 'lucide-react'
import { Input } from '@/app/components/ui/input'
import { Button } from '@/app/components/ui/button'
import { Card } from '@/app/components/ui/card'
import { employees } from '@/app/lib/api'
import { toast } from 'sonner'

export default function CreateEmployeePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  })

  const validateForm = () => {
    const newErrors = {
      username: '',
      password: '',
      confirmPassword: '',
    }
    let isValid = true

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
      isValid = false
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
      isValid = false
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
      isValid = false
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
      isValid = false
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    setIsLoading(true)

    try {
      const response = await employees.create({
        username: formData.username.trim(),
        password: formData.password,
      })

      toast.success(`Employee ${response.username} created successfully!`)
      router.push('/admin/employees')
    } catch (error: any) {
      console.error('Error creating employee:', error)
      toast.error(error.message || 'Failed to create employee')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Back to Employees</span>
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-[#13452D] to-[#1F764D] rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <UserPlus className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Create New Employee</h1>
              <p className="text-white/90 mt-1">Add a new team member to your ERP system</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter employee username"
                className={`h-12 ${errors.username ? 'border-red-500' : ''}`}
                disabled={isLoading}
              />
              {errors.username && (
                <p className="text-red-500 text-sm mt-1">{errors.username}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Username must be at least 3 characters long
              </p>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                  className={`h-12 pr-12 ${errors.password ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Password must be at least 6 characters long
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Re-enter password"
                className={`h-12 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Employee Account Details</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Employee ID will be auto-generated</li>
                <li>• Role will be set to "Employee" automatically</li>
                <li>• Employee can log in with their username and password</li>
                <li>• They will have access to employee-specific features</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1 h-12"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 bg-[#1F764D] hover:bg-[#13452D] text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5 mr-2" />
                    Create Employee
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
