'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, BrainCircuit, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { summarizeUnreadEmails } from '@/ai/flows/email-summarization';
import { updateAttendanceRecord } from '@/ai/flows/attendance-update';
import { recommendLearningResources } from '@/ai/flows/learning-recommendation-flow';
import { generateCareerInsights } from '@/ai/flows/career-insights-flow';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


type Message = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
};

const initialMessage: Message = {
  id: 1,
  role: 'assistant',
  content: "Hello! I'm MentorAI. How can I help you with your studies, schedule, or emails today?",
};

// More robust regex for various query types
const courseQueryRegex = /in|for|about|on\s+([A-Z]{2,5}-?\d{2,4})\b/i;
const resourceQueryRegex = /(?:recommend|find|get|suggest)\s.*(resources|links|videos|articles|tutorials)\s.*(?:for|on|about)\s(.+)/i;
const careerQueryRegex = /career|insights on (.+)/i;
const emailQueryRegex = /summarize|read|check\smy\s(email|emails)/i;
const attendanceQueryRegex = /attendance|present|absent/i;


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
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      let assistantMessage: Message;
      const lowercasedInput = currentInput.toLowerCase();
      
      const courseMatch = currentInput.match(courseQueryRegex);
      const resourceMatch = currentInput.match(resourceQueryRegex);
      const careerMatch = lowercasedInput.match(careerQueryRegex);
      const emailMatch = lowercasedInput.match(emailQueryRegex);
      const attendanceMatch = lowercasedInput.match(attendanceQueryRegex);

      if (courseMatch && courseMatch[1]) {
        const courseId = courseMatch[1].toUpperCase();
        const response = await fetch('/api/study-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: currentInput, courseId, userId: user.uid }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to get study guide from RAG.');
        
        assistantMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: result.answer,
          sources: result.sources,
        };
      } else if (emailMatch) {
        const response = await summarizeUnreadEmails({ userId: user.uid });
        assistantMessage = { id: Date.now() + 1, role: 'assistant', content: response.summary };
      } else if (attendanceMatch) {
        const response = await updateAttendanceRecord({
          studentId: user.uid,
          date: new Date().toISOString().split('T')[0],
          isPresent: true,
        });
        assistantMessage = { id: Date.now() + 1, role: 'assistant', content: response.message + " You can view the change on the attendance page." };
      } else if (resourceMatch && resourceMatch[2]) {
        const topic = resourceMatch[2].trim();
        const response = await recommendLearningResources({ topic });
        assistantMessage = { id: Date.now() + 1, role: 'assistant', content: response.recommendations };
      } else if (careerMatch) {
        const field = careerMatch[1] ? careerMatch[1].trim() : currentInput.replace(/career insights for/i, '').trim();
        const response = await generateCareerInsights({ field });
        assistantMessage = { id: Date.now() + 1, role: 'assistant', content: response.insights };
      } else {
         assistantMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: "I can help with questions about your courses (e.g., 'explain mitosis in BIO-101'), summarizing emails, or recommending resources. What would you like to do?",
        };
      }
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Error calling AI flow:", error);
      toast({
        variant: 'destructive',
        title: 'An Error Occurred',
        description: error.message || 'I was unable to process your request. Please try again.',
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
       <TooltipProvider>
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
              <div className="flex flex-col gap-2 items-start">
                <div
                    className={cn(
                    'max-w-md rounded-lg px-4 py-2 text-sm md:text-base',
                    message.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-muted text-muted-foreground rounded-bl-none'
                    )}
                >
                    <article className="prose prose-sm dark:prose-invert prose-p:my-0 prose-headings:my-2 prose-a:text-primary hover:prose-a:underline">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </article>
                </div>
                {message.sources && message.sources.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 max-w-md">
                        <p className="text-xs text-muted-foreground font-semibold">SOURCES:</p>
                        {message.sources.map((source, index) => (
                          <Tooltip key={index}>
                            <TooltipTrigger asChild>
                               <Badge variant="secondary" className="cursor-pointer flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    <span className='truncate max-w-[120px]'>{source}</span>
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{source}</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                    </div>
                )}
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
       </TooltipProvider>
      <div className="border-t p-4 bg-background">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your course, e.g., 'explain mitosis in BIO-101'"
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
