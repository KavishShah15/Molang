import LogIn from "@/components/Login";

export default function Home() {
  return (
    <main className=" bg-[#06B6D4] bg-opacity-25 w-screen h-screen flex flex-col justify-center items-center oveflow-hidden">
      <img src="/molangicon.png" alt="Molang" className="w-2/3 md:w-1/3"></img>
      <LogIn />
    </main>
  );
}
