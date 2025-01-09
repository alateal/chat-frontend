import { SignedIn, SignedOut } from "@clerk/clerk-react";
import "./App.css";
import LandingPage from "./components/LandingPage";
import MessagePage from "./components/MessagePage";
import { UserStatusProvider } from './contexts/UserStatusContext';

export default function App() {
  return (
    <div>
      <UserStatusProvider>
        <SignedIn>
          <MessagePage />
        </SignedIn>
        <SignedOut>
          <LandingPage />
        </SignedOut>
      </UserStatusProvider>
    </div>
  );
}
