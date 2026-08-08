import type { InputHTMLAttributes } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'

interface AuthFormFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'id'
> {
  error?: string
  field: UseFormRegisterReturn
  id: string
  label: string
}

function AuthFormField({
  error,
  field,
  id,
  label,
  ...inputProps
}: AuthFormFieldProps) {
  const errorId = `${id}-error`

  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <input
        {...inputProps}
        {...field}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <span id={errorId} role="alert">
          {error}
        </span>
      )}
    </div>
  )
}

export default AuthFormField
