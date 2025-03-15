import "./App.css";
import { Header } from "./components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Chat } from "@/components/Chat";
import { useState } from "react";
import { ChatProvider } from "./contexts/ChatContext";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "sonner";

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const newState = !prev;
      console.log(`Toggling sidebar to: ${newState}`);

      document.body.style.overflow = newState ? "hidden" : "auto";
      return newState;
    });
  };

  const closeSidebar = () => {
    console.log("Closing sidebar");
    document.body.style.overflow = "auto";
    setIsSidebarOpen(false);
  };

  return (
    <ChatProvider>
      <div className="flex h-screen overflow-hidden">
        <Header />
        <main className="flex flex-1 overflow-hidden relative">
          {/* Background Grid */}
          <div className="absolute inset-0 bg-grid-small [mask-image:radial-gradient(white,transparent)] opacity-30 pointer-events-none"></div>

          {/* Mobile menu button with clear tap target */}
          {!isSidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="absolute top-3 left-3 z-[100] md:hidden bg-background/95 shadow-md rounded-full h-10 w-10 flex items-center justify-center"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          <Sidebar
            className="md:w-[320px] lg:w-[350px] flex-shrink-0 border-r"
            isMobileOpen={isSidebarOpen}
            onMobileClose={closeSidebar}
          />

          <Chat
            className="flex-1"
            isMobileSidebarOpen={isSidebarOpen}
            onMobileMenuClick={toggleSidebar}
          />
        </main>
      </div>
      <Toaster />
    </ChatProvider>
  );
}

export default App;
