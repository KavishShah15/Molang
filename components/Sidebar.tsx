// "use client";
// import React, { useState, useEffect } from "react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { signOut, useSession } from "next-auth/react";
// import { cn } from "@/lib/utils";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { LogOut, BookText, Bot, School, PanelLeftOpen, PanelLeftClose } from "lucide-react";
// import { useTranslation } from "react-i18next";
// import { changeLanguage } from "@/i18n/i18n";
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import {
//   Select,
//   SelectContent,
//   SelectGroup,
//   SelectItem,
//   SelectLabel,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";

// const languageData = {
//   en: { displayName: 'English', flag: '/flags/America.png' },
//   vi: { displayName: 'Tiếng Việt', flag: '/flags/Vietnam.png' },
//   zh: { displayName: '中文', flag: '/flags/China.png' },
//   hi: { displayName: 'हिंदी', flag: '/flags/India.png' },
// };

// const navItems = [
//   { title: "Mini Stories", href: "/stories", icon: <BookText /> },
//   { title: "Roleplay Chat", href: "/chatbot", icon: <Bot /> },
//   { title: "AI Tutor", href: "/tutor", icon: <School /> },
//   // Add more items here as needed
// ];

// const Sidebar: React.FC = () => {
//   const { data: session, status } = useSession();
//   const pathname = usePathname();
//   const [isPinned, setIsPinned] = useState(true);
//   const [isHovered, setIsHovered] = useState(false);
//   const [userData, setUserData] = useState(null);
//   const [courses, setCourses] = useState([]);
//   const { t, i18n } = useTranslation();
//   const [instructLang, setInstructLang] = useState("");
//   const [learnLang, setLearnLang] = useState("");
//   const [level, setLevel] = useState(0);
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [errorMessage, setErrorMessage] = useState("");
//   const [translations, setTranslations] = useState({});

//   useEffect(() => {
//     const fetchUserData = async () => {
//       if (session) {
//         try {
//           const response = await fetch(`/api/user/${session.user.email}`);
//           const data = await response.json();
//           if (response.ok) {
//             setUserData(data);
//             if (data.currentInstruct) {
//               changeLanguage(data.currentInstruct); // Change the language based on the user's currentInstruct
//             }
//           } else {
//             console.error('Failed to fetch user data:', data.message);
//           }
//         } catch (error) {
//           console.error('Error fetching user data:', error);
//         }
//       }
//     };

//     const fetchCourses = async () => {
//       if (session) {
//         try {
//           const response = await fetch(`/api/register/${session.user.email}`);
//           const data = await response.json();
//           if (response.ok) {
//             setCourses(data.courses);
//             prepareTranslations(data.courses);
//           } else {
//             console.error('Failed to fetch courses:', data.message);
//           }
//         } catch (error) {
//           console.error('Error fetching courses:', error);
//         }
//       }
//     };

//     const prepareTranslations = async (courses) => {
//       const translations = {};
//       for (const course of courses) {
//         const originalLanguage = i18n.language;
//         await i18n.changeLanguage(course.instructLang);
//         translations[`${course.learnLang}_${course.instructLang}`] = t(`languages.${course.learnLang}`);
//         await i18n.changeLanguage(originalLanguage);
//       }
//       setTranslations(translations);
//       if (userData) {
//         changeLanguage(userData.currentInstruct); // revert to the user's instructLang
//       }
//     };

//     fetchUserData();
//     fetchCourses();
//   }, [session]);

//   const handleAddLanguage = async () => {
//     setErrorMessage("");
//     try {
//       const responseCheck = await fetch(`/api/register/${session.user.email}`);
//       const { courses } = await responseCheck.json();

//       const duplicateCourse = courses.find(course =>
//         course.instructLang === instructLang && course.learnLang === learnLang
//       );

//       if (duplicateCourse) {
//         setErrorMessage("This course already exists");
//         return;
//       }

//       const responseRegister = await fetch(`/api/register/${session.user.email}`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ instructLang, learnLang, level }),
//       });

//       const responseUser = await fetch(`/api/user/${session.user.email}`, {
//         method: 'PATCH',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ instructLang, learnLang, currentLevel: level }),
//       });

//       if (!responseRegister.ok) {
//         const errorData = await responseRegister.json();
//         setErrorMessage(errorData.message || 'Failed to create course');
//         return;
//       }

//       if (!responseUser.ok) {
//         const errorData = await responseUser.json();
//         setErrorMessage(errorData.message || 'Failed to update user');
//         return;
//       }

//       console.log('Course created and user updated successfully');
//       setIsDialogOpen(false);
//       window.location.reload(); // Force refresh the page
//     } catch (error) {
//       setErrorMessage('Error creating course or updating user');
//       console.error('Error creating course or updating user:', error);
//     }
//   };

//   const handleCourseClick = async (course) => {
//     try {
//       const response = await fetch(`/api/user/${session.user.email}`, {
//         method: 'PATCH',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ instructLang: course.instructLang, learnLang: course.learnLang, currentLevel: course.level }),
//       });

//       if (response.ok) {
//         console.log('User updated successfully');
//         window.location.reload(); // Force refresh the page
//       } else {
//         const errorData = await response.json();
//         setErrorMessage(errorData.message || 'Failed to update user');
//       }
//     } catch (error) {
//       setErrorMessage('Error updating user');
//       console.error('Error updating user:', error);
//     }
//   };

//   if (status === "loading") {
//     return null;
//   }

//   const handleMouseEnter = () => {
//     if (!isPinned) {
//       setIsHovered(true);
//     }
//   };

//   const handleMouseLeave = () => {
//     if (!isPinned) {
//       setIsHovered(false);
//     }
//   };

//   return (
//     <div
//       className={cn(
//         "p-2 z-50 flex flex-col justify-between h-screen transition-all duration-300 bg-white",
//         isPinned || isHovered ? "z-100 w-72 md:w-64" : "w-20"
//       )}
//       onMouseEnter={handleMouseEnter}
//       onMouseLeave={handleMouseLeave}
//     >
//       <div className="flex flex-col justify-between h-full bg-cyan-500 rounded-3xl">
//         <div>
//           <div className="p-4 flex items-center justify-between">
//             <h2 className={cn("text-2xl font-bold text-yellow-300", !isPinned && !isHovered && "hidden")}>Molang</h2>
//             <button onClick={() => setIsPinned(!isPinned)} className="text-white">
//               {isPinned ? <PanelLeftClose className="h-6 w-6" /> : <PanelLeftOpen className="h-6 w-6" />}
//             </button>
//           </div>

//           <nav className="mt-4 flex flex-col justify-center">
//             {navItems.map((item, index) => (
//               <Link
//                 key={index}
//                 href={item.href}
//                 className={cn(
//                   "flex items-center rounded-md p-2 m-2 hover:underline text-white font-medium",
//                   {
//                     "text-white": pathname === item.href,
//                   }
//                 )}
//               >
//                 <div className="flex items-center">
//                   <div className="h-6 w-6">{item.icon}</div>
//                   <div className="ml-2">{item.title}</div>
//                 </div>
//               </Link>
//             ))}
//           </nav>

//           <div className="mt-4 flex justify-center">
//             <img src="/smile.png" className={cn("h-28", !isPinned && !isHovered && "h-12")} />
//           </div>

//           {userData && (
//             <DropdownMenu>
//               <DropdownMenuTrigger asChild>
//                 <div className="mt-4 flex flex-col items-center cursor-pointer">
//                   {userData.currentInstruct && userData.currentLearn && languageData[userData.currentLearn] && (
//                     <div className="flex items-center mb-2">
//                       <img src={languageData[userData.currentLearn].flag} alt={userData.currentLearn} className="w-8 h-auto mr-2" />
//                       <span>{translations[`${userData.currentLearn}_${userData.currentInstruct}`]}</span>
//                     </div>
//                   )}
//                 </div>
//               </DropdownMenuTrigger>
//               <DropdownMenuContent>
//                 {courses.filter(course =>
//                   course.instructLang !== userData.currentInstruct || course.learnLang !== userData.currentLearn
//                 ).map((course, index) => (
//                   <DropdownMenuItem key={index} onClick={() => handleCourseClick(course)}>
//                     {languageData[course.learnLang] && (
//                       <>
//                         <img src={languageData[course.learnLang].flag} alt={course.learnLang} className="w-6 h-auto mr-2" />
//                         <span>{translations[`${course.learnLang}_${course.instructLang}`]}</span>
//                       </>
//                     )}
//                   </DropdownMenuItem>
//                 ))}
//                 <DropdownMenuItem asChild>
//                   <Dialog>
//                     <DialogTrigger asChild>
//                       <Button variant="outline" className="w-full">Add a new language</Button>
//                     </DialogTrigger>
//                     <DialogContent className="sm:max-w-[425px]">
//                       <DialogHeader>
//                         <DialogTitle>Add New Language</DialogTitle>
//                         <DialogDescription>
//                           Select the instruct language, learn language, and level.
//                         </DialogDescription>
//                       </DialogHeader>
//                       <div className="grid gap-4 py-4">
//                         <div className="grid grid-cols-4 items-center gap-4">
//                           <Label htmlFor="instructLang" className="text-right">
//                             Instruct Language
//                           </Label>
//                           <Select onValueChange={(value) => setInstructLang(value)}>
//                             <SelectTrigger className="col-span-3">
//                               <SelectValue placeholder="Select instruct language" />
//                             </SelectTrigger>
//                             <SelectContent>
//                               <SelectGroup>
//                                 <SelectItem value="en">English</SelectItem>
//                                 <SelectItem value="vi">Tiếng Việt</SelectItem>
//                                 <SelectItem value="zh">中文</SelectItem>
//                                 <SelectItem value="hi">हिंदी</SelectItem>
//                               </SelectGroup>
//                             </SelectContent>
//                           </Select>
//                         </div>
//                         <div className="grid grid-cols-4 items-center gap-4">
//                           <Label htmlFor="learnLang" className="text-right">
//                             Learn Language
//                           </Label>
//                           <Select onValueChange={(value) => setLearnLang(value)}>
//                             <SelectTrigger className="col-span-3">
//                               <SelectValue placeholder="Select learn language" />
//                             </SelectTrigger>
//                             <SelectContent>
//                               <SelectGroup>
//                                 <SelectItem value="en">English</SelectItem>
//                                 <SelectItem value="hi">हिंदी</SelectItem>
//                               </SelectGroup>
//                             </SelectContent>
//                           </Select>
//                         </div>
//                         <div className="grid grid-cols-4 items-center gap-4">
//                           <Label htmlFor="level" className="text-right">
//                             Level
//                           </Label>
//                           <Select onValueChange={(value) => setLevel(parseInt(value, 10))}>
//                             <SelectTrigger className="col-span-3">
//                               <SelectValue placeholder="Select level" />
//                             </SelectTrigger>
//                             <SelectContent>
//                               <SelectGroup>
//                                 <SelectItem value="0">A1: Beginner</SelectItem>
//                                 <SelectItem value="1">A2: Pre-Intermediate</SelectItem>
//                                 <SelectItem value="2">B1: Intermediate</SelectItem>
//                                 <SelectItem value="3">B2: Upper-Intermediate</SelectItem>
//                                 <SelectItem value="4">C1: Advanced</SelectItem>
//                                 <SelectItem value="5">C2: Mastery</SelectItem>
//                               </SelectGroup>
//                             </SelectContent>
//                           </Select>
//                         </div>
//                         {errorMessage && <p className="text-red-500 col-span-4">{errorMessage}</p>}
//                       </div>
//                       <DialogFooter>
//                         <Button type="button" onClick={handleAddLanguage}>Add Language</Button>
//                       </DialogFooter>
//                     </DialogContent>
//                   </Dialog>
//                 </DropdownMenuItem>
//               </DropdownMenuContent>
//             </DropdownMenu>
//           )}
//         </div>

//         {session && (
//           <div className="p-3 md:p-4 flex flex-col">
//             <DropdownMenu>
//               <DropdownMenuTrigger asChild>
//                 <button className="flex items-center space-x-2 focus:outline-none">
//                   <img
//                     src={session.user.image}
//                     alt={session.user.name}
//                     className="w-8 h-8 rounded-full"
//                   />
//                   {(isPinned || isHovered) && (
//                     <div className="flex flex-col items-start">
//                       <span className="text-sm text-white">{session.user.name}</span>
//                       <span className="text-[10px] text-white">{session.user.email}</span>
//                     </div>
//                   )}
//                 </button>
//               </DropdownMenuTrigger>
//               <DropdownMenuContent className="w-56">
//                 <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
//                   <LogOut className="mr-2 h-4 w-4" />
//                   <span>Sign out</span>
//                 </DropdownMenuItem>
//               </DropdownMenuContent>
//             </DropdownMenu>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Sidebar;


import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, BookText, Bot, GraduationCap, PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "@/i18n/i18n";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type LanguageCode = 'en' | 'hi';

type Course = {
  instructLang: LanguageCode;
  learnLang: LanguageCode;
  level: number;
};

type UserData = {
  email: string;
  currentInstruct: LanguageCode;
  currentLearn: LanguageCode;
};

const languageData: Record<LanguageCode, { displayName: string; flag: string }> = {
  en: { displayName: 'English', flag: '/flags/America.png' },
  hi: { displayName: 'हिंदी', flag: '/flags/India.png' },
};

const navItems = [
  { title: "Mini Stories", href: "/stories", icon: <BookText /> },
  { title: "Roleplay Chat", href: "/chatbot", icon: <Bot /> },
  { title: "AI Tutor", href: "/tutor", icon: <GraduationCap /> },
];

const Sidebar: React.FC = () => {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isPinned, setIsPinned] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const { t, i18n } = useTranslation();
  const [instructLang, setInstructLang] = useState<LanguageCode>("en");
  const [learnLang, setLearnLang] = useState<LanguageCode>("hi");
  const [level, setLevel] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [translations, setTranslations] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch(`/api/user/${session.user.email}`);
          const data = await response.json();
          if (response.ok) {
            setUserData(data);
            if (data.currentInstruct) {
              changeLanguage(data.currentInstruct);
            }
          } else {
            console.error('Failed to fetch user data:', data.message);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    const fetchCourses = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch(`/api/register/${session.user.email}`);
          const data = await response.json();
          if (response.ok) {
            setCourses(data.courses);
            prepareTranslations(data.courses);
          } else {
            console.error('Failed to fetch courses:', data.message);
          }
        } catch (error) {
          console.error('Error fetching courses:', error);
        }
      }
    };

    const prepareTranslations = async (courses: Course[]) => {
      const translations: Record<string, string> = {};
      for (const course of courses) {
        const originalLanguage = i18n.language;
        await i18n.changeLanguage(course.instructLang);
        translations[`${course.learnLang}_${course.instructLang}`] = t(`languages.${course.learnLang}`);
        await i18n.changeLanguage(originalLanguage);
      }
      setTranslations(translations);
      if (userData) {
        changeLanguage(userData.currentInstruct);
      }
    };

    fetchUserData();
    fetchCourses();
  }, [session]);

  const handleAddLanguage = async () => {
    setErrorMessage("");
    try {
      if (session?.user?.email) {
        const responseCheck = await fetch(`/api/register/${session.user.email}`);
        const { courses } = await responseCheck.json();

        const duplicateCourse = courses.find((course: Course) =>
          course.instructLang === instructLang && course.learnLang === learnLang
        );

        if (duplicateCourse) {
          setErrorMessage("This course already exists");
          return;
        }

        const responseRegister = await fetch(`/api/register/${session.user.email}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ instructLang, learnLang, level }),
        });

        const responseUser = await fetch(`/api/user/${session.user.email}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ instructLang, learnLang, currentLevel: level }),
        });

        if (!responseRegister.ok) {
          const errorData = await responseRegister.json();
          setErrorMessage(errorData.message || 'Failed to create course');
          return;
        }

        if (!responseUser.ok) {
          const errorData = await responseUser.json();
          setErrorMessage(errorData.message || 'Failed to update user');
          return;
        }

        console.log('Course created and user updated successfully');
        setIsDialogOpen(false);
        window.location.reload(); // Force refresh the page
      }
    } catch (error) {
      setErrorMessage('Error creating course or updating user');
      console.error('Error creating course or updating user:', error);
    }
  };

  const handleCourseClick = async (course: Course) => {
    try {
      if (session?.user?.email) {
        const response = await fetch(`/api/user/${session.user.email}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ instructLang: course.instructLang, learnLang: course.learnLang, currentLevel: course.level }),
        });

        if (response.ok) {
          console.log('User updated successfully');
          window.location.reload(); // Force refresh the page
        } else {
          const errorData = await response.json();
          setErrorMessage(errorData.message || 'Failed to update user');
        }
      }
    } catch (error) {
      setErrorMessage('Error updating user');
      console.error('Error updating user:', error);
    }
  };

  if (status === "loading") {
    return null;
  }

  const handleMouseEnter = () => {
    if (!isPinned) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isPinned) {
      setIsHovered(false);
    }
  };

  return (
    <div
      className={cn(
        "p-2 z-50 flex flex-col justify-between h-screen transition-all duration-300",
        isPinned || isHovered ? "z-100 w-56 md:w-56" : "w-20"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex flex-col justify-between h-full bg-[#06B6D4] bg-opacity-25 text-[#028F9E] rounded-full">
        <div>
          <div className="p-4 pt-16 gap-2 flex items-center justify-center">
            <img src="/molangicon.png" alt="Molang" className={cn("w-28", !isPinned && !isHovered && "hidden")}></img>
            <button onClick={() => setIsPinned(!isPinned)} className="">
              {isPinned ? <PanelLeftClose className="h-6 w-6" /> : <PanelLeftOpen className="h-6 w-6" />}
            </button>
          </div>

          {session?.user && (
          <div className="p-3 md:p-4 flex flex-col">
              <button className="flex flex-col items-center gap-2 space-x-2 focus:outline-none">
                <img
                  src="/defaultava.png"
                  alt={session.user.name || ""}
                  className={cn("rounded-full",isPinned || isHovered ? "w-20 h-20" : "w-8 h-8")}
                />
                {(isPinned || isHovered) && (
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-sm ">{session.user.name}</span>
                    <span className="text-[10px] ">{session.user.email}</span>
                  </div>
                )}
              </button>
          </div>
        )}


          {userData && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="mt-4 flex flex-col items-center cursor-pointer">
                  {userData.currentInstruct && userData.currentLearn && languageData[userData.currentLearn] && (
                    <div className="flex items-center mb-2">
                      <img src={languageData[userData.currentLearn].flag} alt={userData.currentLearn} className="w-8 h-auto mr-2 rounded-lg" />
                      <span className={cn(!isPinned && !isHovered && "hidden")}>{translations[`${userData.currentLearn}_${userData.currentInstruct}`]}</span>
                    </div>
                  )}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {courses.filter(course =>
                  course.instructLang !== userData.currentInstruct || course.learnLang !== userData.currentLearn
                ).map((course, index) => (
                  <DropdownMenuItem key={index} onClick={() => handleCourseClick(course)}>
                    {languageData[course.learnLang] && (
                      <>
                        <img src={languageData[course.learnLang].flag} alt={course.learnLang} className="w-6 h-auto mr-2" />
                        <span>{translations[`${course.learnLang}_${course.instructLang}`]}</span>
                      </>
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem asChild>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">Add a new language</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Add New Language</DialogTitle>
                        <DialogDescription>
                          Select the instruct language, learn language, and level.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="instructLang" className="text-right">
                            Instruct Language
                          </Label>
                          <Select onValueChange={(value) => setInstructLang(value as LanguageCode)}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select instruct language" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="hi">हिंदी</SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="learnLang" className="text-right">
                            Learn Language
                          </Label>
                          <Select onValueChange={(value) => setLearnLang(value as LanguageCode)}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select learn language" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="hi">हिंदी</SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="level" className="text-right">
                            Level
                          </Label>
                          <Select onValueChange={(value) => setLevel(parseInt(value, 10))}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectItem value="0">A1: Beginner</SelectItem>
                                <SelectItem value="1">A2: Pre-Intermediate</SelectItem>
                                <SelectItem value="2">B1: Intermediate</SelectItem>
                                <SelectItem value="3">B2: Upper-Intermediate</SelectItem>
                                <SelectItem value="4">C1: Advanced</SelectItem>
                                <SelectItem value="5">C2: Mastery</SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>
                        {errorMessage && <p className="text-red-500 col-span-4">{errorMessage}</p>}
                      </div>
                      <DialogFooter>
                        <Button className="bg-[#06B6D4] hover:bg-[#028F9E] hover:text-white" type="button" onClick={handleAddLanguage}>Add Language</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex justify-center items-center">
        <nav className="mt-4 flex flex-col justify-center">
            {navItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={cn(
                  "flex items-center rounded-md p-2 m-2 hover:underline font-medium",
                  {
                    "bg-[#028F9E] text-white rounded-full": pathname === item.href,
                  }
                )}
              >
                <div className="flex items-center">
                  <div className="h-6 w-6">{item.icon}</div>
                  <div className={cn("ml-2", !isPinned && !isHovered && "hidden")}>{item.title}</div>
                </div>
              </Link>
            ))}
          </nav>
        </div>

        {session?.user && (
          <div className="mb-5 p-3 md:p-4 flex flex-col items-center">
            <button
              className="flex items-center space-x-2 focus:outline-none  px-4 py-2 rounded-lg hover:underline"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="h-6 w-6" />
              <span className={cn(!isPinned && !isHovered && "hidden")}>Sign out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
