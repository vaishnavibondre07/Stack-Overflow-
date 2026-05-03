import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  Clock,
  Flag,
  History,
  Share,
  Trash,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import axiosInstance from "@/lib/axiosinstance";
import { useAuth } from "@/lib/AuthContext";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";
const QuestionDetail = ({ questionId }: any) => {
  const getBookmarkState = (id: string) => {
    if (typeof window === "undefined") return false;
    const raw = localStorage.getItem("bookmarkedQuestions");
    const saved = raw ? JSON.parse(raw) : {};
    return Boolean(saved[id]);
  };

  const persistBookmarkState = (id: string, isBookmarked: boolean) => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("bookmarkedQuestions");
    const saved = raw ? JSON.parse(raw) : {};
    saved[id] = isBookmarked;
    localStorage.setItem("bookmarkedQuestions", JSON.stringify(saved));
  };

  const router = useRouter();
  const [question, setquestion] = useState<any>(null);
  const [answer, setanswer] = useState<any>();
  const [newanswer, setnewAnswer] = useState("");
  const [isSubmitting, setisSubmitting] = useState(false);
  const [loading, setloading] = useState(true);
  const { user } = useAuth();
  const renderSafeMarkdown = (content: string = "") => {
    const parsedHtml = marked.parse(content, { breaks: true, gfm: true, async: false });
    return DOMPurify.sanitize(parsedHtml as string);
  };

  const formatAnswerDate = (dateValue: string) => {
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return "unknown date";
    return parsed.toLocaleDateString();
  };

  useEffect(() => {
    const fetchuser = async () => {
      try {
        const res = await axiosInstance.get(`/question/getquestion/${questionId}`);
        setanswer(res.data.data.answer);
        const questionData = res.data.data;
        questionData.isBookmarked = getBookmarkState(questionData._id);
        setquestion(questionData);
      } catch (error) {
        console.log(error);
      } finally {
        setloading(false);
      }
    };
    fetchuser();
  }, [questionId]);
  if (loading) {
    return (
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
    );
  }
  if (!question) {
    return (
      <div className="text-center text-gray-500 mt-4">No question found.</div>
    );
  }

  const handleVote = async (vote: String) => {
    if(!user){
      toast.info("Please login to continue")
      router.push("/auth")
      return
    }
    try {
      const res = await axiosInstance.patch(`/question/vote/${question._id}`, {
        value: vote,
        userid: user?._id,
      });
      if (res.data.data) {
        setquestion(res.data.data);
        toast.success("Vote Updated");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to Vote question");
    }
  };
  const handlebookmark = () => {
    setquestion((prev: any) => {
      const nextBookmarkState = !prev.isBookmarked;
      persistBookmarkState(prev._id, nextBookmarkState);
      return { ...prev, isBookmarked: nextBookmarkState };
    });
  };
  const handleSubmitanswer = async () => {
    if(!user){
      toast.info("Please login to continue")
      router.push("/auth")
      return
    }
    if (!newanswer.trim()) return;
    setisSubmitting(true);
    try {
      const res = await axiosInstance.post(
        `/answer/postanswer/${question?._id}`,
        {
          answerbody: newanswer,
          useranswered: user.name,
          userid: user._id,
        }
      );
      if (res.data.data) {
        const newObj = {
          answerbody: newanswer,
          useranswered: user.name,
          userid: user._id,
          answeredon: new Date().toISOString(),
        };
        setquestion((prev: any) => ({
          ...prev,
          noofanswer: prev.noofanswer + 1,
          answer: [...(prev.answer || []), newObj],
        }));
        toast.success("Answer Uploaded");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to Answer");
    } finally {
      setnewAnswer("");
      setisSubmitting(false);
    }
  };
  const handleDelete = async () => {
    if(!user){
      toast.info("Please login to continue")
      router.push("/auth")
      return
    }
    if (!window.confirm("Are you sure you want to delete this question?"))
      return;
    try {
      const res = await axiosInstance.delete(
        `/question/delete/${question._id}`
      );
      if (res.data.message) {
        toast.success(res.data.message);
        router.push("/");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete question");
    }
  };
  const handleVoteAnswer = async (answerId: String, vote: String) => {
    if(!user){
      toast.info("Please login to continue")
      router.push("/auth")
      return
    }
    try {
      const res = await axiosInstance.patch(`/answer/vote/${question._id}/${answerId}`, {
        value: vote,
        userid: user?._id,
      });
      if (res.data.data) {
        setquestion(res.data.data);
        toast.success("Vote Updated");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to Vote answer");
    }
  };

  const handleDeleteanswer = async (id: String) => {
    if(!user){
      toast.info("Please login to continue")
      router.push("/auth")
      return
    }
    if (!window.confirm("Are you sure you want to delete this answer?"))
      return;
    try {
      const res = await axiosInstance.delete(`/answer/delete/${question._id}`, {
        data: {
          answerid: id,
        },
      });
      if (res.data.data) {
        const updateanswer = question.answer.filter(
          (ans: any) => ans._id !== id
        );
        setquestion((prev: any) => ({
          ...prev,
          noofanswer: updateanswer.length,
          answer: updateanswer,
        }));
        toast.success("deleted successfully");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete question");
    }
  };

  return (
    <div className="max-w-5xl w-full px-2 sm:px-4">
      {/* Question Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-2 sm:mb-4 text-gray-900 break-words">
          {question.questiontitle}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>Asked {new Date(question.askedon).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <Card className="mb-4 sm:mb-8">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            {/* Voting Section */}
            <div className="flex sm:flex-col items-center sm:items-center p-3 sm:p-4 lg:p-6 border-b sm:border-b-0 sm:border-r border-gray-200 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className={`p-2 ${"text-gray-600 hover:text-orange-500"}`}
                onClick={() => handleVote("upvote")}
              >
                <ChevronUp className="w-6 h-6" />
              </Button>
              <span>{question.upvote.length - question.downvote.length}</span>
              <Button
                variant="ghost"
                size="sm"
                className={`p-2 ${"text-gray-600 hover:text-orange-500"}`}
                onClick={() => handleVote("downvote")}
              >
                <ChevronDown className="w-6 h-6" />
              </Button>
              <div className="flex sm:flex-col gap-2 sm:gap-4 mt-4 sm:mt-6">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`p-2 ${
                    question?.isBookmarked
                      ? "text-yellow-500"
                      : "text-gray-600 hover:text-yellow-500"
                  }`}
                  onClick={handlebookmark}
                >
                  <Bookmark
                    className="w-5 h-5"
                    fill={question?.isBookmarked ? "currentColor" : "none"}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 text-gray-600 hover:text-gray-800"
                >
                  <History className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="flex-1 p-3 sm:p-4 lg:p-6 min-w-0">
              <div className="prose max-w-none mb-4 sm:mb-6 text-sm sm:text-base">
                <div
                  className="text-gray-800 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: renderSafeMarkdown(question.questionbody),
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {question.questiontags.map((tag: any) => (
                  <Link key={tag} href={`/tags/${tag}`}>
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                    >
                      {tag}
                    </Badge>
                  </Link>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <Share className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <Flag className="w-4 h-4 mr-1" />
                    Flag
                  </Button>
                  {question.userid === user?._id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDelete}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">
                    asked {new Date(question.askedon).toLocaleDateString()}
                  </span>
                  <Link
                    href={`/users/${question.userid}`}
                    className="flex items-center gap-2 hover:bg-blue-50 p-2 rounded"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-sm">
                        {question.userposted[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-blue-600 hover:text-blue-800 font-medium">
                        {question.userposted}
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="mb-4 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-gray-900">
          {question.answer?.length || 0} Answer
          {(question.answer?.length || 0) !== 1 ? "s" : ""}
        </h2>
        <div className="space-y-4 sm:space-y-6">
          {question.answer?.map((ans: any) => (
            <Card key={ans._id} className={""}>
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  {/* Voting Section for Answer */}
                  <div className="flex sm:flex-col items-center sm:items-center p-3 sm:p-4 lg:p-6 border-b sm:border-b-0 sm:border-r border-gray-200 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 text-gray-600 hover:text-orange-500"
                      onClick={() => handleVoteAnswer(ans._id, "upvote")}
                    >
                      <ChevronUp className="w-6 h-6" />
                    </Button>
                    <span>{(ans.upvote?.length || 0) - (ans.downvote?.length || 0)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 text-gray-600 hover:text-orange-500"
                      onClick={() => handleVoteAnswer(ans._id, "downvote")}
                    >
                      <ChevronDown className="w-6 h-6" />
                    </Button>
                  </div>
                  {/* Answer Content */}
                  <div className="flex-1 p-3 sm:p-4 lg:p-6 min-w-0">
                    <div className="prose max-w-none mb-4 sm:mb-6 text-sm sm:text-base">
                      <div
                        className="text-gray-800 leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: renderSafeMarkdown(ans.answerbody),
                        }}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 hover:text-gray-800"
                        >
                          <Share className="w-4 h-4 mr-1" />
                          Share
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 hover:text-gray-800"
                        >
                          <Flag className="w-4 h-4 mr-1" />
                          Flag
                        </Button>
                        {ans.userid === user?._id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteanswer(ans._id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600">
                          answered {formatAnswerDate(ans.answeredon)}
                        </span>
                        <Link
                          href={`/users/${ans.userid}`}
                          className="flex items-center gap-2 hover:bg-blue-50 p-2 rounded"
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-sm">
                              {ans.useranswered[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-blue-600 hover:text-blue-800 font-medium">
                              {ans.useranswered}
                            </div>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <Card>
        <CardContent className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900">
            Your Answer
          </h3>
          <Textarea
            placeholder="Write your answer here... You can use Markdown formatting."
            value={newanswer}
            onChange={(e) => setnewAnswer(e.target.value)}
            className="min-h-32 mb-3 sm:mb-4 resize-y text-sm sm:text-base"
          />
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Button
              onClick={handleSubmitanswer}
              disabled={!newanswer.trim() || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? "Posting..." : "Post Your Answer"}
            </Button>
            <p className="text-sm text-gray-600">
              By posting your answer, you agree to the{" "}
              <button
                onClick={(e) => e.preventDefault()}
                className="text-blue-600 hover:underline cursor-pointer bg-transparent border-0 p-0"
                title="Privacy policy (coming soon)"
              >
                privacy policy
              </button>{" "}
              and{" "}
              <button
                onClick={(e) => e.preventDefault()}
                className="text-blue-600 hover:underline cursor-pointer bg-transparent border-0 p-0"
                title="Terms of service (coming soon)"
              >
                terms of service
              </button>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionDetail;
