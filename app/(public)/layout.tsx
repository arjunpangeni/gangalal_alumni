import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { SessionProvider } from "@/components/layout/SessionProvider";
import { ChatbotWidget } from "@/components/chatbot/ChatbotWidget";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Navbar />
      <main className="pb-16 md:pb-0">{children}</main>
      <Footer />
      <MobileBottomNav />
      <ChatbotWidget />
    </SessionProvider>
  );
}
