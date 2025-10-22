
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
import { chat, type ChatMessage } from '@/ai/flows/chat-flow';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {runFlow} from '@genkit-ai/next';

type DisplayMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  isStreaming?: boolean;
};

const initialMessage: DisplayMessage = {
  id: '1',
  role: 'assistant',
  content: "Hello! I'm MentorAI. How can I help you with your studies, schedule, or emails today?",
};

// Simple regex to extract courseId from prompt
const courseQueryRegex = /\b([A-Z]{2,5}-?\d{2,4})\b/i;

export function ChatInterface() {
  const { user } = useUser();
  const [messages, setMessages] = useState<DisplayMessage[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<React.ElementRef<'div'>>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Auto-scroll to the bottom
    if (scrollAreaRef.current) {
      scrollAreaRef.current.children[1].scrollTop = scrollAreaRef.current.children[1].scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !user) return;

    const currentInput = input;
    setInput('');
    setIsLoading(true);

    const userMessage: DisplayMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: currentInput,
    };

    const assistantMessageId = crypto.randomUUID();
    const assistantMessage: DisplayMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        isStreaming: true,
    }
    
    setMessages(prev => [...prev, userMessage, assistantMessage]);

    // Transform DisplayMessage[] to the ChatMessage[] format expected by the flow
    const history: ChatMessage[] = messages.filter(m => m.id !== initialMessage.id).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        content: [{ text: m.content }]
    }));
    
    const courseMatch = currentInput.match(courseQueryRegex);
    const courseId = courseMatch ? courseMatch[1].toUpperCase() : undefined;

    try {
        const stream = runFlow(chat, { 
            prompt: currentInput, 
            history, 
            userId: user.uid,
            courseId
        });
        
        for await (const chunk of stream) {
            setMessages(prev =>
              prev.map(msg =>
                msg.id === assistantMessageId
                  ? { ...msg, content: (msg.content || '') + chunk }
                  : msg
              )
            );
        }

    } catch (error: any) {
        console.error("Error calling AI flow:", error);
        toast({
            variant: 'destructive',
            title: 'An Error Occurred',
            description: error.message || 'I was unable to process your request. Please try again.',
        });
        setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
    } finally {
        setIsLoading(false);
        setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg
            )
        );
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
                      {message.isStreaming && <span className="animate-pulse">▍</span>}
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
          {isLoading && messages[messages.length-1]?.role === 'user' && (
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
            placeholder="Ask me anything..."
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
