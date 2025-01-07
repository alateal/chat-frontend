import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'
import './App.css';
import LandingPage from './components/LandingPage';
import MessagePage from './components/MessagePage';

export default function App() {
  return (
    <header>
      <SignedOut>
        <LandingPage />
      </SignedOut>
      <SignedIn>
        <MessagePage />
        <UserButton />
      </SignedIn>
    </header>
  )
}