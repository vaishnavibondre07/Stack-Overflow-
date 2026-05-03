import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Mainlayout from "@/layout/Mainlayout";
import axiosInstance from "@/lib/axiosinstance";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function QuestionsPage() {
  const [question, setquestion] = useState<any>(null);
  const [loading, setloading] = useState(true);
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
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Mainlayout>
    );
  }

  if (!question || question.length === 0) {
    return (
      <Mainlayout>
        <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
          <div className="text-center text-gray-500 mt-4">
            <p className="text-lg mb-2">No questions found.</p>
            <button
              onClick={() => router.push("/ask")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
            >
              Ask the first question
            </button>
          </div>
        </div>
      </Mainlayout>
    );
  }

  return (
    <Mainlayout>
      <main className="min-w-0 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4 px-2 sm:px-0">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold">All Questions</h1>
          <button
            onClick={() => router.push("/ask")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-sm font-medium whitespace-nowrap w-full sm:w-auto"
          >
            Ask Question
          </button>
        </div>

        <div className="w-full px-2 sm:px-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4 text-xs sm:text-sm gap-2 sm:gap-4">
            <span className="text-gray-600">{question.length} questions</span>
            <div className="flex flex-wrap gap-1 sm:gap-2 w-full sm:w-auto">
              <button className="px-2 sm:px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs sm:text-sm">
                Newest
              </button>
              <button className="px-2 sm:px-3 py-1 text-gray-600 hover:bg-gray-100 rounded text-xs sm:text-sm">
                Active
              </button>
              <button className="px-2 sm:px-3 py-1 text-gray-600 hover:bg-gray-100 rounded flex items-center text-xs sm:text-sm">
                Bountied
                <Badge variant="secondary" className="ml-1 text-xs">
                  0
                </Badge>
              </button>
              <button className="px-2 sm:px-3 py-1 text-gray-600 hover:bg-gray-100 rounded text-xs sm:text-sm">
                Unanswered
              </button>
              <button className="px-2 sm:px-3 py-1 text-gray-600 hover:bg-gray-100 rounded text-xs sm:text-sm">
                More ▼
              </button>
              <button className="px-2 sm:px-3 py-1 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded ml-auto text-xs sm:text-sm">
                🔍 Filter
              </button>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {question.map((q: any) => (
              <div key={q._id} className="border-b border-gray-200 pb-3 sm:pb-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex sm:flex-col items-center sm:items-center text-xs sm:text-sm text-gray-600 sm:w-16 lg:w-20 gap-3 sm:gap-2 flex-shrink-0">
                    <div className="text-center">
                      <div className="font-medium">
                        {(q.upvote?.length || 0) - (q.downvote?.length || 0)}
                      </div>
                      <div className="text-xs">votes</div>
                    </div>
                    <div className="text-center">
                      <div
                        className={`font-medium ${
                          (q.answer?.length || 0) > 0
                            ? "text-green-600 bg-green-100 px-2 py-1 rounded"
                            : ""
                        }`}
                      >
                        {q.answer?.length || 0}
                      </div>
                      <div className="text-xs">
                        {(q.answer?.length || 0) === 1 ? "answer" : "answers"}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/questions/${q._id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm sm:text-base lg:text-lg font-medium mb-1 sm:mb-2 block line-clamp-2"
                    >
                      {q.questiontitle}
                    </Link>
                    <p className="text-gray-700 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">
                      {q.questionbody}
                    </p>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1">
                        {q.questiontags?.map((tag: any) => (
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
                          href={`/users/${q.userid}`}
                          className="flex items-center"
                        >
                          <Avatar className="w-4 h-4 mr-1">
                            <AvatarFallback className="text-xs">
                              {q.userposted?.[0] || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-blue-600 hover:text-blue-800 mr-1">
                            {q.userposted || "Unknown"}
                          </span>
                        </Link>

                        <span>
                          asked {new Date(q.askedon).toLocaleDateString()}
                        </span>
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

