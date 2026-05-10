'use client'

import React from 'react'
import { LucideIcon } from 'lucide-react'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  )
)
Card.displayName = 'Card'

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`flex flex-col space-y-1.5 border-b border-gray-200 px-6 py-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
)
CardHeader.displayName = 'CardHeader'

interface CardTitleProps {
  children: React.ReactNode
  className?: string
}

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ children, className = '', ...props }, ref) => (
    <h2
      ref={ref}
      className={`text-2xl font-bold tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h2>
  )
)
CardTitle.displayName = 'CardTitle'

interface CardDescriptionProps {
  children: React.ReactNode
  className?: string
}

export const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ children, className = '', ...props }, ref) => (
    <p
      ref={ref}
      className={`text-sm text-gray-600 ${className}`}
      {...props}
    >
      {children}
    </p>
  )
)
CardDescription.displayName = 'CardDescription'

interface CardContentProps {
  children: React.ReactNode
  className?: string
}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`px-6 py-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
)
CardContent.displayName = 'CardContent'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'gradient'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'md', children, className = '', ...props }, ref) => {
    const baseStyles = 'font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2'

    const variants = {
      default: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl',
      outline: 'border-2 border-gray-200 text-gray-900 hover:bg-gray-50',
      ghost: 'text-gray-700 hover:bg-gray-100',
      gradient: 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ children, variant = 'default', className = '', ...props }, ref) => {
    const variants = {
      default: 'bg-blue-100 text-blue-800',
      success: 'bg-emerald-100 text-emerald-800',
      warning: 'bg-amber-100 text-amber-800',
      danger: 'bg-red-100 text-red-800',
      info: 'bg-cyan-100 text-cyan-800',
    }

    return (
      <div
        ref={ref}
        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Badge.displayName = 'Badge'
