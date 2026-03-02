import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { parseAxiosError, formatErrorMessage, shouldShowError, ApiError } from './errors';

// Global error handler for axios interceptor
export function handleApiError(error: AxiosError): ApiError {
  const apiError = parseAxiosError(error);

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('🔴 API Error:', {
      type: apiError.type,
      message: apiError.message,
      statusCode: apiError.statusCode,
      details: apiError.details,
      url: error.config?.url,
      method: error.config?.method,
    });
  }

  // Show toast notification (pass URL and message to determine if we should show)
  if (shouldShowError(apiError.type, error.config?.url, apiError.message)) {
    showErrorToast(apiError);
  }

  return apiError;
}

// Show error toast with appropriate styling
export function showErrorToast(error: ApiError) {
  const message = formatErrorMessage(error);

  toast.error(message, {
    duration: 5000,
    position: 'top-right',
    className: 'error-toast',
    closeButton: true,
  });
}

// Show success toast
export function showSuccessToast(message: string) {
  toast.success(message, {
    duration: 3000,
    position: 'top-right',
    closeButton: true,
  });
}

// Show info toast
export function showInfoToast(message: string) {
  toast.info(message, {
    duration: 3000,
    position: 'top-right',
    closeButton: true,
  });
}

// Show loading toast
export function showLoadingToast(message: string = 'Загрузка...') {
  return toast.loading(message, {
    position: 'top-right',
  });
}

// Dismiss toast
export function dismissToast(toastId: string | number) {
  toast.dismiss(toastId);
}
