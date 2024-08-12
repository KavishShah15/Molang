"use client";

import React, { useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

function LogIn() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  useEffect(() => {
    const checkUserDetails = async () => {
      if (session?.user?.email) {
        const res = await fetch(`/api/course/${session.user.email}`);
        const userData = await res.json();

        if (userData.course.instructLang && userData.course.learnLang) {
          router.replace("/learn");
        } else {
          router.replace("/register");
        }
      }
    };

    if (sessionStatus === "authenticated") {
      checkUserDetails();
    }
  }, [sessionStatus, session, router]);

  if (sessionStatus === "loading") {
    return <h1>Loading...</h1>;
  }

  return (
    sessionStatus !== "authenticated" && (
      <div className="flex items-center justify-center">
            <Button
              className="max-w-2/5 w-full my-4 bg-white text-black mx-auto p-8 space-y-8 rounded-xl shadow items-center justify-center text-center hover:bg-black hover:text-white transition duration-150"
              onClick={() => {
                signIn("google");
              }}
            >
              <Image className="object-contain" src="/googleicon.png" alt="Google Icon" width={50} height={50} />
              Sign in with Google
            </Button>
      </div>
    )
  );
}

export default LogIn;


