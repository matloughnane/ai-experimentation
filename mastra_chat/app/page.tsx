import ChatBotDemo from "./components/ai-chat";

export default function Home() {
  return (
    <main className="flex items-center justify-center bg-[#1D897B] h-screen font-sans dark:bg-black">
      <div className="bg-zinc-50 flex flex-row w-full max-w-170 mx-4 my-10 rounded-lg sm:mx-auto">
        <ChatBotDemo />
      </div>
    </main>
  );
}
