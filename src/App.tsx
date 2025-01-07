import { SignedIn, SignedOut } from '@clerk/clerk-react'
import './App.css';
import LandingPage from './components/LandingPage';
import MessagePage from './components/MessagePage';

export default function App() {
  return (
    <>
      <SignedOut>
        <LandingPage />
      </SignedOut>
      <SignedIn>
        <MessagePage />
      </SignedIn>
    </>
  )
}