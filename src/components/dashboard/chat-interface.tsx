'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { generateContextAwareStudyGuide } from '@/ai/flows/study-guide-flow';
import { summarizeUnreadEmails } from '@/ai/flows/email-summarization';
import { updateAttendanceRecord } from '@/ai/flows/attendance-update';
import { useToast } from '@/hooks/use-toast';

type Message = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
};

const initialMessage: Message = {
  id: 1,
  role: 'assistant',
  content: "Hello! I'm MentorAI. How can I help you with your studies, schedule, or emails today?",
};

export function ChatInterface() {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<React.ElementRef<'div'>>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.children[1].scrollTop = scrollAreaRef.current.children[1].scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !user) return;

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: input,
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let assistantContent: string;
      const lowercasedInput = input.toLowerCase();

      if (lowercasedInput.includes('summarize') && lowercasedInput.includes('email')) {
        const response = await summarizeUnreadEmails({ userId: user.uid });
        assistantContent = response.summary;
      } else if (lowercasedInput.includes('attendance') || lowercasedInput.includes('present')) {
        const response = await updateAttendanceRecord({
          studentId: user.uid,
          date: new Date().toISOString().split('T')[0],
          isPresent: true,
        });
        assistantContent = response.message + " I've updated your status on the dashboard.";
      } else {
        const response = await generateContextAwareStudyGuide({ query: input });
        assistantContent = response.answer;
      }
      
      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: assistantContent,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error calling AI flow:", error);
      toast({
        variant: 'destructive',
        title: 'An Error Occurred',
        description: 'I was unable to process your request. Please try again.',
      });
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: "I'm sorry, but I encountered an error while processing your request. Please try again later.",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const userName = user?.displayName || 'User';
  const userAvatar = user?.photoURL || '';

  return (
    <div className="flex flex-col h-full bg-card">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex items-start gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <Avatar className="w-8 h-8 border-2 border-primary/50">
                  <div className="w-full h-full flex items-center justify-center bg-primary">
                    <BrainCircuit className="h-5 w-5 text-primary-foreground" />
                  </div>
                </Avatar>
              )}
              <div
                className={cn(
                  'max-w-md rounded-lg px-4 py-2 text-sm md:text-base whitespace-pre-wrap',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-muted text-muted-foreground rounded-bl-none'
                )}
              >
                {message.content}
              </div>
              {message.role === 'user' && user && (
                <Avatar className="w-8 h-8">
                  <AvatarImage src={userAvatar} alt={userName} />
                  <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && (
             <div className="flex items-start gap-3 justify-start">
                <Avatar className="w-8 h-8 border-2 border-primary/50">
                  <div className="w-full h-full flex items-center justify-center bg-primary">
                    <BrainCircuit className="h-5 w-5 text-primary-foreground" />
                  </div>
                </Avatar>
                <div className="bg-muted text-muted-foreground rounded-lg px-4 py-3 rounded-bl-none">
                    <Loader2 className="h-5 w-5 animate-spin" />
                </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="border-t p-4 bg-background">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your exams, emails, or attendance..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
