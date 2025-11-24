import Link from 'next/link'

export default function AuthCodeError() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
            <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 shadow-lg">
                <div className="flex justify-center">
                    <div className="rounded-full bg-destructive/10 p-4">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="48"
                            height="48"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-destructive"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" x2="12" y1="8" y2="12" />
                            <line x1="12" x2="12.01" y1="16" y2="16" />
                        </svg>
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Authentication Error
                    </h1>
                    <p className="text-muted-foreground">
                        There was a problem signing you in. This link may have expired or is invalid.
                    </p>
                </div>

                <div className="flex flex-col gap-2">
                    <Link
                        href="/login"
                        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    >
                        Try Again
                    </Link>
                    <Link
                        href="/"
                        className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    >
                        Go Home
                    </Link>
                </div>
            </div>
        </div>
    )
}
