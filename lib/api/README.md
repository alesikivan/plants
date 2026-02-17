# Централизованная обработка ошибок API

## Обзор

Система автоматически обрабатывает все ошибки API через Axios interceptors и отображает красивые toast-уведомления пользователю.

## Возможности

### ✅ Автоматическая обработка ошибок

- **Network errors** - проблемы с интернет-соединением
- **Timeout errors** - превышение времени ожидания (30 сек)
- **401 Unauthorized** - автоматическое обновление токена
- **403 Forbidden** - нет доступа к ресурсу
- **404 Not Found** - ресурс не найден
- **400/422 Validation** - ошибки валидации с деталями
- **500+ Server errors** - ошибки сервера

### ✅ Красивые уведомления

- Toast-уведомления с цветовой индикацией
- Поддержка темной темы
- Автоматическое закрытие через 5 секунд
- Кнопка закрытия
- Позиционирование в правом верхнем углу

### ✅ Логирование в dev mode

- Детальное логирование запросов и ответов
- Информация об ошибках в консоли
- Помогает в отладке

## Использование

### Автоматическая обработка

Все API запросы автоматически обрабатываются:

```typescript
import { usersApi } from '@/lib/api/users';

// Ошибки обрабатываются автоматически
try {
  const users = await usersApi.getAllUsers();
  // Success
} catch (error) {
  // Ошибка уже показана пользователю через toast
  // Можно добавить дополнительную логику
}
```

### Ручные toast-уведомления

Для успешных операций используйте хелперы:

```typescript
import { showSuccessToast, showErrorToast, showInfoToast, showLoadingToast, dismissToast } from '@/lib/api/error-handler';

// Успешное уведомление
showSuccessToast('Профиль успешно обновлен!');

// Информационное уведомление
showInfoToast('Идет загрузка данных...');

// Уведомление об ошибке (если нужно вручную)
showErrorToast({
  type: ErrorType.VALIDATION,
  message: 'Заполните все поля',
  details: { email: 'Неверный формат email' }
});

// Загрузка с последующим закрытием
const toastId = showLoadingToast('Сохранение...');
// ... выполнение операции
dismissToast(toastId);
showSuccessToast('Сохранено!');
```

### Пример с React Query

```typescript
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { showSuccessToast } from '@/lib/api/error-handler';

function LoginForm() {
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: () => {
      showSuccessToast('Добро пожаловать!');
      router.push('/dashboard');
    },
    // onError не нужен - ошибки обрабатываются автоматически
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      loginMutation.mutate({ email, password });
    }}>
      {/* ... */}
    </form>
  );
}
```

## Кастомизация

### Изменение сообщений об ошибках

Отредактируйте `frontend/lib/api/errors.ts`:

```typescript
export const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.NETWORK]: 'Ваше сообщение здесь',
  // ...
};
```

### Изменение стилей toast

Отредактируйте `frontend/components/ui/toaster.tsx`:

```typescript
<Sonner
  position="top-right" // top-left, bottom-right, etc.
  toastOptions={{
    classNames: {
      // Ваши стили
    },
  }}
/>
```

### Изменение timeout

Отредактируйте `frontend/lib/api/client.ts`:

```typescript
export const apiClient = axios.create({
  timeout: 30000, // миллисекунды
  // ...
});
```

## Структура файлов

```
frontend/lib/api/
├── client.ts           # Axios instance с interceptors
├── errors.ts           # Типы ошибок и парсинг
├── error-handler.ts    # Обработчики и toast helpers
├── auth.ts             # API методы аутентификации
├── users.ts            # API методы пользователей
└── README.md           # Эта документация

frontend/components/ui/
└── toaster.tsx         # Toaster компонент (Sonner)
```

## Примеры ответов сервера

### Успешный ответ

```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe"
}
```

### Ошибка валидации

```json
{
  "statusCode": 400,
  "message": ["email должен быть валидным email", "password слишком короткий"],
  "error": "Bad Request"
}
```

### Ошибка с деталями

```json
{
  "statusCode": 422,
  "message": "Validation failed",
  "errors": {
    "email": ["Неверный формат email"],
    "password": ["Минимум 8 символов"]
  }
}
```

## Поддержка

При возникновении проблем проверьте:

1. **Console (Dev Tools)** - детальные логи в development mode
2. **Network tab** - статус коды и ответы сервера
3. **Toast уведомления** - пользовательские сообщения об ошибках
