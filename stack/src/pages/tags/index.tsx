import { Badge } from "@/components/ui/badge";
import Mainlayout from "@/layout/Mainlayout";
import axiosInstance from "@/lib/axiosinstance";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Tag {
  name: string;
  count: number;
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await axiosInstance.get("/question/getalltags");
        setTags(res.data.data || []);
      } catch (error) {
        console.error("Error fetching tags:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTags();
  }, []);

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Mainlayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Mainlayout>
    );
  }

  return (
    <Mainlayout>
      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold mb-2">
            Tags
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            A tag is a keyword or label that categorizes your question with other, similar questions.
          </p>
        </div>

        <div className="mb-4 sm:mb-6">
          <input
            type="text"
            placeholder="Filter by tag name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-96 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {filteredTags.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-lg mb-2">No tags found.</p>
            {searchQuery && (
              <p className="text-sm">Try a different search term.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filteredTags.map((tag) => (
              <div
                key={tag.name}
                className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <Link
                    href={`/questions?tag=${encodeURIComponent(tag.name)}`}
                    className="flex-1"
                  >
                    <Badge
                      variant="secondary"
                      className="text-xs sm:text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer mb-2"
                    >
                      {tag.name}
                    </Badge>
                  </Link>
                </div>
                <p className="text-xs sm:text-sm text-gray-600">
                  {tag.count} {tag.count === 1 ? "question" : "questions"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Mainlayout>
  );
}

