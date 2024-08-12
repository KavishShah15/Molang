"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

const Welcome = () => {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/register' || pathname === '/register/') {
      router.replace('/register/nativeLanguage');
    }
  }, [pathname, router]);

  return <div>Loading...</div>;
};

export default Welcome;
