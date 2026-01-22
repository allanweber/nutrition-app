import React, { useState, useCallback } from 'react'

// ============================================
// CLIENT-SIDE ERROR HANDLING UTILITIES
// ============================================

export interface ApiError {
  message: string
  field?: string
  code?: string
}

export function parseApiError(error: unknown): ApiError {
  if (error instanceof Error) {
    // Try to parse structured error from API response
    try {
      // If the error message is JSON, parse it
      const parsed = JSON.parse(error.message)
      if (parsed.error && typeof parsed.error === 'string') {
        return {
          message: parsed.error,
          field: parsed.field,
          code: parsed.code
        }
      }
    } catch {
      // Not JSON, use the error message as-is
    }

    return {
      message: error.message || 'An unexpected error occurred'
    }
  }

  if (typeof error === 'string') {
    return {
      message: error
    }
  }

  return {
    message: 'An unexpected error occurred'
  }
}

export function useApiError() {
  const [error, setError] = useState<ApiError | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const handleError = useCallback((error: unknown) => {
    const parsedError = parseApiError(error)
    setError(parsedError)
    setIsSubmitting(false)
    return parsedError
  }, [])

  const startSubmitting = useCallback(() => {
    setError(null)
    setIsSubmitting(true)
  }, [])

  const finishSubmitting = useCallback(() => {
    setIsSubmitting(false)
  }, [])

  return {
    error,
    isSubmitting,
    clearError,
    handleError,
    startSubmitting,
    finishSubmitting,
    setError: (error: ApiError | null) => setError(error)
  }
}

// Field-specific error helper
export function getFieldError(error: ApiError | null, fieldName: string): string | null {
  if (!error || !error.field) return null
  return error.field === fieldName ? error.message : null
}

// Form validation error component (React component - use in client components)
export function ValidationError({ error, field }: { error: ApiError | null; field?: string }) {
  if (!error) return null

  const message = field ? getFieldError(error, field) : error.message
  if (!message) return null

  return React.createElement('div', {
    className: "text-sm text-red-600 dark:text-red-400 mt-1",
    role: "alert"
  }, message)
}