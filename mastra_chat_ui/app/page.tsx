import ChatBotDemo from "./components/ai-chat";

export default function Home() {
  return (
    <main className="flex items-center justify-center bg-[#1D897B] h-screen font-sans dark:bg-black">
      <div className="bg-zinc-50 flex flex-row w-170 my-10 rounded-lg">
        <ChatBotDemo />
      </div>
    </main>
  );
}
