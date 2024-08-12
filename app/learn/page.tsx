"use client";

import Link from "next/link";
import { BookText, Bot, GraduationCap } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const navItems = [
  { 
    title: "Mini Stories", 
    href: "/stories", 
    icon: <BookText className="h-8 w-8" />, 
    description: "Explore short, engaging stories that help you improve your language skills in a fun and immersive way."
  },
  { 
    title: "Roleplay Chat", 
    href: "/chatbot", 
    icon: <Bot className="h-8 w-8" />, 
    description: "Engage in interactive roleplay conversations with our chatbot to practice real-life scenarios."
  },
  { 
    title: "AI Tutor", 
    href: "/tutor", 
    icon: <GraduationCap className="h-8 w-8" />, 
    description: "Get personalized guidance and lessons from our AI-powered tutor tailored to your learning needs."
  },
];

const Main = () => {
  return (
    <ScrollArea className="h-screen flex flex-col justify-center items-center pt-16 md:pt-32 text-[#028F9E]">
    <h2 className="text-center font-bold text-lg md:text-2xl">Learn Language in Multiple Ways</h2>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-8">
      {navItems.map((item, index) => (
        <Link
          key={index}
          href={item.href}
          className="max-h-96 flex flex-col items-center justify-center p-6 border  border-[#028F9E] rounded-lg hover:bg-[#06B6D4] hover:bg-opacity-25 transition"
        >
          <div className="mb-4">{item.icon}</div>
          <h2 className="text-xl font-semibold">{item.title}</h2>
          <p className="text-center text-gray-600 mt-2">{item.description}</p>
        </Link>
      ))}
    </div>
    </ScrollArea>
  );
};

export default Main;
