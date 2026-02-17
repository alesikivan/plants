/**
 * Примеры использования централизованной обработки ошибок
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from './auth';
import { usersApi } from './users';
import { showSuccessToast, showLoadingToast, dismissToast } from './error-handler';

// ========================================
// Пример 1: Простой API вызов
// ========================================

export async function simpleApiCall() {
  try {
    const users = await usersApi.getAllUsers();
    console.log('Users:', users);
    // Успех - никаких дополнительных действий не требуется
  } catch (error) {
    // Ошибка уже показана пользователю через toast
    // Можно добавить дополнительную логику если нужно
    console.error('Failed to fetch users', error);
  }
}

// ========================================
// Пример 2: API вызов с success toast
// ========================================

export async function apiCallWithSuccessToast() {
  try {
    await authApi.logout();
    showSuccessToast('Вы успешно вышли из системы');
    // Redirect или другие действия
  } catch (error) {
    // Ошибка показана автоматически
  }
}

// ========================================
// Пример 3: API вызов с loading toast
// ========================================

export async function apiCallWithLoadingToast() {
  const toastId = showLoadingToast('Сохранение профиля...');

  try {
    // Допустим есть метод updateProfile
    // await usersApi.updateProfile(data);

    dismissToast(toastId);
    showSuccessToast('Профиль успешно обновлен!');
  } catch (error) {
    dismissToast(toastId);
    // Ошибка показана автоматически
  }
}

// ========================================
// Пример 4: С React Query (useQuery)
// ========================================

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAllUsers,
    // Ошибки обрабатываются автоматически
    // onError не нужен!
  });
}

// ========================================
// Пример 5: С React Query (useMutation)
// ========================================

export function useLogin() {
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: () => {
      showSuccessToast('Добро пожаловать! 🌱');
      // Redirect или другие действия
    },
    // onError не нужен - ошибки обрабатываются автоматически!
  });
}

// ========================================
// Пример 6: В компоненте с useState
// ========================================

export function ComponentExample() {
  // const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    // setIsLoading(true);

    try {
      // await authApi.login(credentials);
      showSuccessToast('Успешный вход!');
      // router.push('/dashboard');
    } catch (error) {
      // Ошибка показана автоматически через interceptor
    } finally {
      // setIsLoading(false);
    }
  };

  // return <button onClick={handleSubmit}>Login</button>;
}

// ========================================
// Пример 7: Множественные параллельные запросы
// ========================================

export async function parallelRequests() {
  try {
    const [profile, users] = await Promise.all([
      usersApi.getProfile(),
      usersApi.getAllUsers(),
    ]);

    console.log('Profile:', profile);
    console.log('Users:', users);
  } catch (error) {
    // Первая ошибка будет показана через toast
  }
}

// ========================================
// Пример 8: Последовательные запросы
// ========================================

export async function sequentialRequests() {
  try {
    const loginResponse = await authApi.login({
      email: 'test@example.com',
      password: 'password',
    });

    showSuccessToast('Вход выполнен');

    // Теперь можем загрузить профиль
    const profile = await usersApi.getProfile();
    console.log('Profile:', profile);

  } catch (error) {
    // Ошибка показана автоматически
  }
}

// ========================================
// Пример 9: Кастомная обработка специфических ошибок
// ========================================

export async function customErrorHandling() {
  try {
    await usersApi.getAllUsers();
  } catch (error: any) {
    // Общая ошибка уже показана через toast

    // Но можно добавить специфическую логику
    if (error.response?.status === 403) {
      console.log('User has no access, redirecting...');
      // window.location.href = '/no-access';
    }
  }
}

// ========================================
// Пример 10: С оптимистичными обновлениями (React Query)
// ========================================

export function useOptimisticUpdate() {
  // const queryClient = useQueryClient();

  return useMutation({
    // mutationFn: updateUser,
    // onMutate: async (newUser) => {
    //   // Оптимистичное обновление
    //   await queryClient.cancelQueries(['users']);
    //   const previousUsers = queryClient.getQueryData(['users']);
    //   queryClient.setQueryData(['users'], (old: any) => [...old, newUser]);
    //   return { previousUsers };
    // },
    onSuccess: () => {
      showSuccessToast('Пользователь обновлен!');
    },
    // onError: (err, newUser, context) => {
    //   // Ошибка показана автоматически
    //   // Откатываем оптимистичное обновление
    //   queryClient.setQueryData(['users'], context?.previousUsers);
    // },
  });
}
