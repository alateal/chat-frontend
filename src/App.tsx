import { SignedIn, SignedOut } from "@clerk/clerk-react";
import "./App.css";
import LandingPage from "./components/LandingPage";
import MessagePage from "./components/MessagePage";

export default function App() {
  return (
    <div>
      <SignedIn>
        <MessagePage />
      </SignedIn>
      <SignedOut>
        <LandingPage />
      </SignedOut>
    </div>
  );
}
