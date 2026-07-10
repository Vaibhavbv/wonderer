import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="font-heading text-[7rem] leading-none text-primary-200">404</p>
        <h1 className="mt-2 font-heading text-3xl text-text-primary">
          This place isn&apos;t on the map yet
        </h1>
        <p className="mt-3 text-text-secondary">
          The page you&apos;re after has moved, was never here, or is still waiting to be explored.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/">
            <Button>
              <Compass className="mr-2 h-4 w-4" />
              Go home
            </Button>
          </Link>
          <Link href="/discover">
            <Button variant="outline">Discover journeys</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
