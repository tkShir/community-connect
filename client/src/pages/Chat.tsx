import { useState, useEffect, useRef } from "react";
import { useMatches, useRespondMatch } from "@/hooks/use-matches";
import { useMessages, useSendMessage } from "@/hooks/use-messages";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { Send, Check, X, Clock, MessageSquare, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Chat() {
  const { user } = useAuth();
  const { data: matches, isLoading: matchesLoading } = useMatches();
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);

  // Group matches
  const pendingReceived = matches?.filter(m => m.status === 'pending' && m.receiverId === matches.find(x => x.id === m.id)?.partner.id); // Tricky logic because list returns match obj.
  // Actually the hook returns matches where I am either initiator or receiver.
  // The partner is already joined.
  // If I am receiver and status pending -> Incoming request.
  // If I am initiator and status pending -> Outgoing request (waiting).
  // If status accepted -> Active chat.
  
  // Let's refine based on the partner object returned from API
  // NOTE: Schema logic implies `useMatches` returns { ...match, partner: Profile }
  
  const activeMatches = matches?.filter(m => m.status === 'accepted') || [];
  const incomingRequests = matches?.filter(m => m.status === 'pending' && m.receiverId !== m.partner.id) || []; 
  // Wait, if I am the receiver, my ID is receiverId. The partner IS the initiator. 
  // So if m.receiverId == myProfileId (we don't have myProfileId here easily without context).
  // Actually simpler: API implementation of `list` should handle "who is partner". 
  // Assuming the API returns the *other person* as `partner`.
  // If `initiatorId` matches `partner.id`, then *they* initiated. -> Incoming for me.
  
  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6 overflow-hidden">
      {/* Sidebar List */}
      <div className="w-full md:w-80 flex flex-col gap-4 bg-card/30 rounded-2xl border border-white/5 p-4">
        <h2 className="text-lg font-bold font-display px-2">Messages</h2>
        
        {/* Incoming Requests Section */}
        {incomingRequests.length > 0 && (
          <div className="mb-4 space-y-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2">Requests</h3>
            {incomingRequests.map(match => (
              <RequestItem key={match.id} match={match} />
            ))}
          </div>
        )}

        {/* Active Chats List */}
        <ScrollArea className="flex-1">
          <div className="space-y-2">
             <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 mb-2">Active</h3>
            {activeMatches.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm px-4">
                No active connections yet. Go to Discover to find people!
              </div>
            )}
            {activeMatches.map(match => (
              <div
                key={match.id}
                onClick={() => setSelectedMatchId(match.id)}
                className={cn(
                  "p-3 rounded-xl cursor-pointer transition-colors flex items-center gap-3",
                  selectedMatchId === match.id 
                    ? "bg-primary/10 border border-primary/20" 
                    : "hover:bg-white/5 border border-transparent"
                )}
              >
                <Avatar className="h-10 w-10 border border-white/10">
                  <AvatarFallback className="bg-secondary text-primary font-bold text-xs">
                    {match.partner.alias.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="overflow-hidden">
                  <h4 className="font-semibold text-sm truncate">{match.partner.alias}</h4>
                  <p className="text-xs text-muted-foreground truncate">{match.partner.profession}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-card rounded-2xl border border-white/5 overflow-hidden flex flex-col shadow-2xl">
        {selectedMatchId ? (
          <ChatWindow matchId={selectedMatchId} partner={matches?.find(m => m.id === selectedMatchId)?.partner} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 opacity-50" />
            </div>
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}

function RequestItem({ match }: { match: any }) {
  const { mutate: respond } = useRespondMatch();
  
  // Only show buttons if *they* initiated (meaning partner is initiator)
  // Logic check: The API for `list` ensures `partner` is the other person.
  // If `match.initiatorId === match.partner.id`, then THEY initiated.
  const isIncoming = match.initiatorId === match.partner.id;

  if (!isIncoming) return null; // Pending outgoing request, don't show in "Requests" list necessarily, or show as "Waiting"

  return (
    <div className="p-3 bg-secondary/30 rounded-xl border border-white/5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
          {match.partner.alias.substring(0, 1)}
        </div>
        <div>
          <p className="text-sm font-bold">{match.partner.alias}</p>
          <p className="text-xs text-muted-foreground">{match.partner.goal}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button 
          size="sm" 
          className="flex-1 h-8 bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground"
          onClick={() => respond({ id: match.id, status: 'accepted' })}
        >
          <Check className="w-4 h-4 mr-1" /> Accept
        </Button>
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-8 px-2 text-muted-foreground hover:text-destructive"
          onClick={() => respond({ id: match.id, status: 'rejected' })}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function ChatWindow({ matchId, partner }: { matchId: number, partner: any }) {
  const { data: messages, isLoading } = useMessages(matchId);
  const { mutate: sendMessage, isPending } = useSendMessage();
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth(); // Need to know my ID to distinguish sent vs received messages.
  // Wait, messages don't have user ID directly accessible easily unless we fetched profile.
  // The message object has senderId (Profile ID).
  // We need current user's PROFILE ID to compare. 
  // Let's assume the API returns `isMine` boolean or we fetch profile.
  // Strategy: In `useMessages` hook or API, we could augment.
  // OR: fetch `useMyProfile()` here.
  
  // This is a bit inefficient to fetch profile in chat window, but cached so ok.
  // Ideally, `messages` API response should include `isSender` flag.
  // Assuming standard schema return, we need profile ID.
  
  // Let's pretend `useMyProfile` is instant from cache.
  // Actually, let's just align messages to right if senderId !== partner.id (since partner is the other one).
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;
    sendMessage({ matchId, content: inputValue });
    setInputValue("");
  };

  return (
    <>
      {/* Header */}
      <div className="h-16 border-b border-white/5 flex items-center px-6 justify-between bg-card/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-primary/20">
            <AvatarFallback className="bg-secondary text-primary">
              {partner?.alias.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-bold text-sm">{partner?.alias}</h3>
            <span className="text-xs text-primary flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Online
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {isLoading ? (
          <div className="flex justify-center pt-10"><Clock className="animate-spin text-muted-foreground" /></div>
        ) : (
          messages?.map((msg) => {
            const isMine = msg.senderId !== partner.id; // If sender is NOT the partner, it must be me.
            return (
              <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                <div 
                  className={cn(
                    "max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed",
                    isMine 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-secondary text-foreground rounded-tl-none border border-white/5"
                  )}
                >
                  {msg.content}
                  <div className={cn("text-[10px] mt-1 opacity-70", isMine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    {format(new Date(msg.createdAt), "HH:mm")}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/5 bg-card">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            className="bg-secondary/50 border-transparent focus:border-primary/50"
            disabled={isPending}
          />
          <Button type="submit" size="icon" disabled={!inputValue.trim() || isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </>
  );
}
