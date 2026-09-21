import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Link,
  useRouter,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <div className="text-7xl font-bold tracking-tight">404</div>

        <p className="mt-2 text-muted-foreground">Page not found</p>

        <Link
          to="/dashboard"
          className="mt-6 inline-flex rounded-xl gradient-teal px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

function ErrorComp({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>

        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>

        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 rounded-xl gradient-teal px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Ncuresoft — Hospital Management",
      },
      {
        name: "description",
        content: "Modern hospital management & OPD software.",
      },
    ],
  }),

  component: RootComponent,

  notFoundComponent: NotFound,

  errorComponent: ErrorComp,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <>
      <HeadContent />

      <QueryClientProvider client={queryClient}>
        <Outlet />

        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </>
  );
}
