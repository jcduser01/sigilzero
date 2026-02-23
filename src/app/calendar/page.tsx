import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SIGIL.ZERO | Book a Session",
  description: "Schedule a recording studio session. Redirecting to booking calendar...",
  robots: "noindex",
};

const CALENDAR_URL = "https://calendar.app.google/2js6obe7ePgkkMSU7";

export default function CalendarPage() {
  return (
    <>
      {/* Meta refresh redirect */}
      <meta httpEquiv="refresh" content={`3;url=${CALENDAR_URL}`} />

      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center">
          {/* Loading animation */}
          <div className="mb-8 flex justify-center">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-2 border-gray-800 rounded-full" />
              <div className="absolute inset-0 border-2 border-transparent border-t-white rounded-full animate-spin" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-6xl font-light mb-4 tracking-tight leading-tight">
            Redirecting...
          </h1>

          {/* Subheading */}
          <p className="text-lg text-gray-400 mb-8 font-light">
            Please wait while we redirect you to the booking calendar.
          </p>

          {/* Fallback message */}
          <div className="p-6 bg-gray-950 border border-gray-800 rounded-lg">
            <p className="text-sm text-gray-300 mb-4">
              If you are not redirected automatically within a few seconds,{" "}
              <a
                href={CALENDAR_URL}
                className="text-white font-medium hover:text-gray-200 border-b border-white hover:border-gray-200 transition-colors"
              >
                click here to proceed to the booking form
              </a>
              .
            </p>
          </div>

          {/* Footer note */}
          <p className="text-xs text-gray-600 mt-8">
            You will be redirected to Google Calendar to schedule your session.
          </p>
        </div>
      </div>
    </>
  );
}
