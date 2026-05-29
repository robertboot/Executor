'use client';

import { useEffect, useState } from 'react';

function localGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Good Evening';
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

// Renders "Good Morning/Afternoon/Evening, <name>." using the user's
// local browser time. Server render falls back to "Hello, <name>." to
// avoid hydration mismatches and the UTC-vs-local skew that produced
// wrong greetings (server running in UTC said "Good Morning" while the
// user's clock was 9pm).
export default function GreetingHeading({
  firstName,
  className,
}: {
  firstName: string;
  className?: string;
}) {
  const [greeting, setGreeting] = useState<string>('Hello');

  useEffect(() => {
    setGreeting(localGreeting());
  }, []);

  return <h1 className={className}>{greeting}, {firstName}.</h1>;
}
