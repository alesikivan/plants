import { AxiosError } from 'axios';

// Error types
export enum ErrorType {
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

// Custom error interface
export interface ApiError {
  type: ErrorType;
  message: string;
  statusCode?: number;
  code?: string;
  details?: Record<string, unknown>;
  originalError?: unknown;
}

// Error messages mapping
export const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.NETWORK]: 'Проблема с подключением к интернету. Проверьте соединение.',
  [ErrorType.TIMEOUT]: 'Превышено время ожидания ответа. Попробуйте снова.',
  [ErrorType.UNAUTHORIZED]: 'Необходима авторизация. Войдите в систему.',
  [ErrorType.FORBIDDEN]: 'У вас нет доступа к этому ресурсу.',
  [ErrorType.NOT_FOUND]: 'Запрашиваемый ресурс не найден.',
  [ErrorType.VALIDATION]: 'Проверьте правильность введенных данных.',
  [ErrorType.SERVER]: 'Ошибка сервера. Попробуйте позже.',
  [ErrorType.UNKNOWN]: 'Произошла неизвестная ошибка.',
};

// Status code to error type mapping
export const STATUS_TO_ERROR_TYPE: Record<number, ErrorType> = {
  400: ErrorType.VALIDATION,
  401: ErrorType.UNAUTHORIZED,
  403: ErrorType.FORBIDDEN,
  404: ErrorType.NOT_FOUND,
  408: ErrorType.TIMEOUT,
  422: ErrorType.VALIDATION,
  500: ErrorType.SERVER,
  502: ErrorType.SERVER,
  503: ErrorType.SERVER,
  504: ErrorType.TIMEOUT,
};

// Parse axios error to ApiError
export function parseAxiosError(error: AxiosError): ApiError {
  // Network error (no response)
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        type: ErrorType.TIMEOUT,
        message: ERROR_MESSAGES[ErrorType.TIMEOUT],
        originalError: error,
      };
    }

    return {
      type: ErrorType.NETWORK,
      message: ERROR_MESSAGES[ErrorType.NETWORK],
      originalError: error,
    };
  }

  // HTTP error with response
  const statusCode = error.response.status;
  const errorType = STATUS_TO_ERROR_TYPE[statusCode] || ErrorType.UNKNOWN;

  // Try to extract error message from response
  const responseData = error.response.data as any;
  let message = ERROR_MESSAGES[errorType];
  let details: Record<string, unknown> | undefined;

  // Check for custom error message from backend
  if (responseData) {
    if (typeof responseData.message === 'string') {
      message = responseData.message;
    } else if (Array.isArray(responseData.message)) {
      message = responseData.message.join(', ');
    } else if (typeof responseData.message === 'object' && responseData.message?.message) {
      // NestJS wraps object in message field: { message: { message: '...', code: '...' } }
      message = responseData.message.message;
    }

    // Include validation errors if present
    if (responseData.errors) {
      details = responseData.errors;
    }
  }

  // Extract custom error code if present
  let code: string | undefined;
  if (responseData?.code) {
    code = responseData.code;
  } else if (typeof responseData?.message === 'object' && responseData.message?.code) {
    code = responseData.message.code;
  }

  return {
    type: errorType,
    message,
    statusCode,
    details,
    code,
    originalError: error,
  };
}

// Format error for display
export function formatErrorMessage(error: ApiError): string {
  let message = error.message;

  // Add details if present (for validation errors)
  if (error.details && Object.keys(error.details).length > 0) {
    const detailMessages = Object.entries(error.details)
      .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
      .join('\n');
    message += `\n${detailMessages}`;
  }

  return message;
}

// Check if error should be shown to user
export function shouldShowError(errorType: ErrorType, url?: string, message?: string, code?: string): boolean {
  // EMAIL_NOT_VERIFIED is handled by the login page UI — suppress global toast
  if (code === 'EMAIL_NOT_VERIFIED') {
    return false;
  }

  // verify-email errors are shown inline on the page
  if (url?.includes('/auth/verify-email')) {
    return false;
  }

  // Show UNAUTHORIZED errors for login/register pages (invalid credentials)
  if (errorType === ErrorType.UNAUTHORIZED) {
    // Show toast for auth endpoints (login/register fail)
    if (url?.includes('/auth/login') || url?.includes('/auth/register')) {
      return true;
    }
    // Don't show for profile/refresh endpoints (silent fail, will redirect)
    if (url?.includes('/users/profile') || url?.includes('/auth/refresh')) {
      return false;
    }
    // Don't show for other endpoints (will redirect to login)
    return false;
  }

  // Don't show FORBIDDEN errors for blocked/deleted accounts — redirect handles it
  // Exception: on the login page we DO want to show the message
  if (errorType === ErrorType.FORBIDDEN) {
    if (message?.includes('заблокирован') || message?.includes('blocked')) {
      return url?.includes('/auth/login') ?? false;
    }
    // Don't show FORBIDDEN errors for public user profile endpoints — the UI
    // already shows an EyeOff block explaining the content is hidden.
    if (url?.match(/\/users\/[^/]+\/(plants|shelves)/)) {
      return false;
    }
  }

  // Show all other errors
  return true;
}
