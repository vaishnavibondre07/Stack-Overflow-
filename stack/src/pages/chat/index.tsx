import Mainlayout from "@/layout/Mainlayout";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send } from "lucide-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { toast } from "react-toastify";

const Chat = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [message, setMessage] = useState("");

  if (!user) {
    return (
      <Mainlayout>
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <Card>
            <CardContent className="p-8">
              <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Please Login</h2>
              <p className="text-gray-600 mb-4">You need to be logged in to use the chat feature.</p>
              <Button onClick={() => router.push("/auth")} className="bg-blue-600 hover:bg-blue-700">
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </Mainlayout>
    );
  }

  return (
    <Mainlayout>
      <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <h1 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Chat</h1>
        
        <Card className="h-[calc(100vh-200px)] sm:h-[600px] flex flex-col">
          <CardHeader className="border-b">
            <CardTitle className="text-base sm:text-lg">Messages</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="text-center text-gray-500 py-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No messages yet. Start a conversation!</p>
                <p className="text-xs text-gray-400 mt-2">Chat feature coming soon...</p>
              </div>
            </div>
            <div className="border-t p-3 sm:p-4">
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && message.trim()) {
                      toast.info("Chat feature coming soon!");
                      setMessage("");
                    }
                  }}
                />
                <Button
                  onClick={() => {
                    if (message.trim()) {
                      toast.info("Chat feature coming soon!");
                      setMessage("");
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!message.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Mainlayout>
  );
};

export default Chat;

