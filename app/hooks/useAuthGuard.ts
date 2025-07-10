import { useEffect } from 'react';
import { useRouter, usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function useAuthGuard({ allowFirstTime = false } = {}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    (async () => {
      const userStr = await AsyncStorage.getItem('user');
      let user;
      try {
        user = userStr ? JSON.parse(userStr) : null;
      } catch {
        user = null;
      }
      if (!user || !user.token) {
        if (pathname !== '/signin') router.replace('/signin');
        return;
      }
      if (user.firstTimeLogin && !allowFirstTime && pathname !== '/choose-topic') {
        router.replace('/choose-topic');
      }
    })();
  }, [router, pathname, allowFirstTime]);
} 