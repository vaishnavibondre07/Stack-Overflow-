import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Mainlayout from "@/layout/Mainlayout";
import axiosInstance from "@/lib/axiosinstance";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const questions = [
  {
    id: 1,
    votes: 0,
    answers: 0,
    views: 3,
    title:
      "Mouse Cursor in 16-bit Assembly (NASM) Overwrites Screen Content in VGA Mode 0x12",
    content:
      "I'm developing a PS/2 mouse driver in 16-bit assembly (NASM) for a custom operating system running in VGA mode 0x12 (640x480, 16 colors). The driver initializes the mouse, handles mouse events, and ...",
    tags: ["assembly", "operating-system", "driver", "osdev"],
    author: "PR0X",
    authorId: 1,
    authorRep: 3,
    timeAgo: "2 mins ago",
  },
  {
    id: 2,
    votes: 0,
    answers: 1,
    views: 12,
    title:
      "Template specialization inside a template class using class template parameters",
    content:
      "template<typename TypA, typename TypX> struct MyClass { using TypAlias = TypA<TypX>; // error: 'TypA' is not a template [-Wtemplate-body] }; MyClass is very often specialized like ...",
    tags: ["c++", "templates"],
    author: "Felix.leg",
    authorId: 2,
    authorRep: 799,
    timeAgo: "11 mins ago",
  },
  {
    id: 3,
    votes: -2,
    answers: 0,
    views: 13,
    title: "How can i block user with middleware?",
    content:
      "The problem I am trying to create a complete user login form in NextJS and I want to block the user to go to other pages without a login process before. So online i found that one of the most complete ...",
    tags: ["node.js", "forms", "authentication", "next.js", "middleware"],
    author: "Aledi5",
    authorId: 3,
    authorRep: 31,
    timeAgo: "20 mins ago",
  },
  {
    id: 4,
    votes: 0,
    answers: 0,
    views: 6,
    title:
      "call:fail action: private-web3-wallet-v2-o pen-wallet-connect, error: Pairing error: Subscribe error: Timed out waiting for 60000 ms /what it means",
    content:
      "Can't connect my web3 wallet with a dApp. A message pops: Accounts must be CAIP-10 compliant The error message reads: call:fail action: private-web3-wallet-v2-o pen-wallet-connect, error: Pairing ...",
    tags: ["web3", "wallet", "blockchain"],
    author: "CryptoUser",
    authorId: 4,
    authorRep: 1,
    timeAgo: "25 mins ago",
  },
];
export default function Home() {
  const [question, setquestion] = useState<any>(null);
  const [loading, setloading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"newest" | "active" | "unanswered">("newest");
  const router = useRouter();
  useEffect(() => {
    const fetchquestion = async () => {
      try {
        const res = await axiosInstance.get("/question/getallquestion");
        setquestion(res.data.data);
      } catch (error) {
        console.log(error);
      } finally {
        setloading(false);
      }
    };
    fetchquestion();
  }, []);
  if (loading) {
    return (
      <Mainlayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Mainlayout>
    );
  }
  if (!question || question.length === 0) {
    return (
      <Mainlayout>
        <div className="text-center text-gray-500 mt-4">No question found.</div>
      </Mainlayout>
    );
  }

  const filteredQuestions =
    activeFilter === "unanswered"
      ? question.filter((q: any) => (q.answer?.length || 0) === 0)
      : [...question].sort((a: any, b: any) => {
          if (activeFilter === "active") {
            return (b.answer?.length || 0) - (a.answer?.length || 0);
          }
          return (
            new Date(b.askedon).getTime() - new Date(a.askedon).getTime()
          );
        });

  return (
    <Mainlayout>
      <main className="min-w-0 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4 px-2 sm:px-0">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold">Top Questions</h1>
          <button
            onClick={() => router.push("/ask")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-sm font-medium whitespace-nowrap w-full sm:w-auto"
          >
            Ask Question
          </button>
        </div>
        <div className="w-full px-2 sm:px-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4 text-xs sm:text-sm gap-2 sm:gap-4">
            <span className="text-gray-600">{filteredQuestions.length} questions</span>
            <div className="flex flex-wrap gap-1 sm:gap-2 w-full sm:w-auto">
              <button
                onClick={() => setActiveFilter("newest")}
                className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm ${
                  activeFilter === "newest"
                    ? "bg-gray-200 text-gray-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Newest
              </button>
              <button
                onClick={() => setActiveFilter("active")}
                className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm ${
                  activeFilter === "active"
                    ? "bg-gray-200 text-gray-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setActiveFilter("unanswered")}
                className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm ${
                  activeFilter === "unanswered"
                    ? "bg-gray-200 text-gray-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Unanswered
              </button>
            </div>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {filteredQuestions.map((question: any) => (
              <div key={question._id} className="border-b border-gray-200 pb-3 sm:pb-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  {/*
                    Use answer.length as a single source of truth for UI count
                    to avoid stale noofanswer display mismatches.
                  */}
                  {(() => {
                    const answerCount = question.answer?.length || 0;
                    return (
                  <div className="flex sm:flex-col items-center sm:items-center text-xs sm:text-sm text-gray-600 sm:w-16 lg:w-20 gap-3 sm:gap-2 flex-shrink-0">
                    <div className="text-center">
                      <div className="font-medium">
                        {(question.upvote?.length || 0) - (question.downvote?.length || 0)}
                      </div>
                      <div className="text-xs">votes</div>
                    </div>
                    <div className="text-center">
                      <div
                        className={`font-medium ${
                          answerCount > 0
                            ? "text-green-600 bg-green-100 px-2 py-1 rounded"
                            : ""
                        }`}
                      >
                        {answerCount}
                      </div>
                      <div className="text-xs">
                        {answerCount === 1
                          ? "answer"
                          : "answers"}
                      </div>
                    </div>
                  </div>
                    );
                  })()}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/questions/${question._id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm sm:text-base lg:text-lg font-medium mb-1 sm:mb-2 block line-clamp-2"
                    >
                      {question.questiontitle}
                    </Link>
                    <p className="text-gray-700 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">
                      {question.questionbody}
                    </p>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1">
                        {question.questiontags?.map((tag: any) => (
                          <div key={tag}>
                            <Badge
                              variant="secondary"
                              className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                            >
                              {tag}
                            </Badge>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center text-xs text-gray-600 flex-shrink-0">
                        <Link
                          href={`/users/${question.userid}`}
                          className="flex items-center"
                        >
                          <Avatar className="w-4 h-4 mr-1">
                            <AvatarFallback className="text-xs">
                              {question.userposted[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-blue-600 hover:text-blue-800 mr-1">
                            {question.userposted}
                          </span>
                        </Link>

                        <span>asked {new Date(question.askedon).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </Mainlayout>
  );
}
