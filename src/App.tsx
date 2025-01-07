import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'
import './App.css';
import LandingPage from './components/LandingPage';

export default function App() {
  return (
    <header>
      <SignedOut>
        <LandingPage />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </header>
  )
}