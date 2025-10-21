import { ChatInterface } from "@/components/dashboard/chat-interface";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chat | MentorAI',
  description: 'Chat with your AI-powered student mentor.',
};

export default function DashboardPage() {
    return (
        <div className="h-screen w-full flex flex-col">
            <ChatInterface />
        </div>
    );
}
