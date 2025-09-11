import { Button } from "@/components/ui/button";

export default function FerryPage({
  searchParams,
}: {
  searchParams: { time?: string };
}) {
  const time = searchParams.time;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Ferry Services</h1>
      <div className="grid gap-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            Book a Ferry{time ? ` at ${time}` : ""}
          </h2>
          <p className="text-gray-600 mb-4">
            Find and book ferry services for your journey.
          </p>
          <Button>Book Ticket</Button>
        </div>
      </div>
    </div>
  );
}
