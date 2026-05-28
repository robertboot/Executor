// The root path is handled by middleware:
//   - signed in   → /home
//   - signed out  → /login
// Anything that reaches this component is a fallback.
import { redirect } from 'next/navigation';

export default function Root() {
  redirect('/login');
}
