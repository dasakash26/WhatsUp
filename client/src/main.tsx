import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ClerkProvider } from "@clerk/clerk-react";
import { secrets } from "./utils/secrets.ts";
import { ThemeProvider } from "./components/theme/theme-provider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system">
      <ClerkProvider publishableKey={secrets.CLERK_KEY} afterSignOutUrl="/">
        <App />
      </ClerkProvider>
    </ThemeProvider>
  </StrictMode>
);
