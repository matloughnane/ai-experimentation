import AIChat from "@/components/ai/ai-chat";

export const metadata = {
  title: "AI Chat",
  description: "AI Chat",
};

export default function Chat() {
  return (
    <div className="grid grid-cols-3 h-[100vh]">
      <div className="col-span-1 p-4 bg-gray-100 border-r shadow-sm shadow-right">
        <h1 className="text-2xl font-bold py-2">MCP Server</h1>
      </div>
      <div className="col-span-2 px-2 bg-gray-50">
        <AIChat />
      </div>
    </div>
  );
}
