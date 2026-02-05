import ChatBotDemo from "./components/ai-chat";

export default function Home() {
  return (
    <div className="flex items-center justify-center bg-[#1D897B] h-screen font-sans dark:bg-black">
      {/* <main className="flex w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start"> */}
      {/* <ChatUI /> */}
      <div className="bg-zinc-50 flex flex-row w-170 my-10 rounded-lg">
        <ChatBotDemo />
      </div>
      {/* </main> */}
    </div>
  );
}
