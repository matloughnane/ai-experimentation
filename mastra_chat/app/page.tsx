import ChatBotDemo from "./components/ai-chat";

export default function Home() {
  return (
    <main className="flex items-center justify-center bg-[#1D897B] h-dvh font-sans dark:bg-black">
      <div className="bg-zinc-50 flex flex-row w-full h-full max-w-170 sm:mx-auto sm:my-10 sm:h-auto sm:rounded-lg">
        <ChatBotDemo />
      </div>
    </main>
  );
}
