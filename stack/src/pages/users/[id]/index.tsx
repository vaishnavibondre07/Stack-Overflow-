import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Mainlayout from "@/layout/Mainlayout";
import { useAuth } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { Calendar, Edit, Plus, X, Coins, Search, Send, History, Monitor, Smartphone, Laptop, Globe } from "lucide-react";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
const index = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [users, setusers] = useState<any>(null);
  const [loading, setloading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    about: "",
    tags: [] as string[],
  });
  const [newTag, setNewTag] = useState("");
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [transferPoints, setTransferPoints] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [showLoginHistory, setShowLoginHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const fetchuser = async () => {
      try {
        if (!id) return;
        const res = await axiosInstance.get(`/user/getuser/${id}`);
        setusers(res.data.data);
      } catch (error) {
        console.log(error);
      } finally {
        setloading(false);
      }
    };
    fetchuser();
  }, [id]);

  useEffect(() => {
    if (users) {
      setEditForm({
        name: users.name || "",
        about: users.about || "",
        tags: users.tags || [],
      });
    }
  }, [users]);

  const fetchLoginHistory = async () => {
    if (!user || id !== user._id) return;
    setLoadingHistory(true);
    try {
      const res = await axiosInstance.get("/user/login-history");
      setLoginHistory(res.data.data || []);
      setShowLoginHistory(true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load login history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case "mobile":
        return <Smartphone className="w-4 h-4" />;
      case "tablet":
        return <Smartphone className="w-4 h-4" />;
      case "laptop":
        return <Laptop className="w-4 h-4" />;
      case "desktop":
        return <Monitor className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };
  if (loading) {
    return (
      <Mainlayout>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </Mainlayout>
    );
  }
  if (!users || users.length === 0) {
    return <div className="text-center text-gray-500 mt-4">No user found.</div>;
  }

  const handleSaveProfile = async () => {
    try {
      const res = await axiosInstance.patch(`/user/update/${user?._id}`, {
        editForm,
      });
      if (res.data.data) {
        const updatedUser = {
          ...users,
          name: editForm.name,
          about: editForm.about,
          tags: editForm.tags,
        };

        setusers(updatedUser);
        setIsEditing(false);
        toast.success("Profile updated successfully!");
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !editForm.tags.includes(trimmedTag)) {
      setEditForm({ ...editForm, tags: [...editForm.tags, trimmedTag] });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditForm({
      ...editForm,
      tags: editForm.tags.filter((tag: any) => tag !== tagToRemove),
    });
  };

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await axiosInstance.get(`/user/search?query=${encodeURIComponent(searchQuery)}`);
      setSearchResults(res.data.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to search users");
    } finally {
      setIsSearching(false);
    }
  };

  const handleTransferPoints = async () => {
    if (!selectedRecipient) {
      toast.error("Please select a recipient");
      return;
    }
    const points = parseInt(transferPoints);
    if (isNaN(points) || points <= 0) {
      toast.error("Please enter a valid number of points");
      return;
    }
    if ((user?.points || 0) < 10) {
      toast.error("You need at least 10 points to transfer points");
      return;
    }
    if ((user?.points || 0) < points) {
      toast.error("Insufficient points");
      return;
    }
    
    setIsTransferring(true);
    try {
      const res = await axiosInstance.post("/user/transfer-points", {
        recipientId: selectedRecipient._id,
        points: points,
      });
      toast.success(`Successfully transferred ${points} points to ${selectedRecipient.name}`);
      setShowTransferDialog(false);
      setSelectedRecipient(null);
      setTransferPoints("");
      setSearchQuery("");
      setSearchResults([]);
      // Refresh user data
      const userRes = await axiosInstance.get("/user/getalluser");
      const updatedUser = userRes.data.data.find((u: any) => u._id === user?._id);
      if (updatedUser) {
        // Update auth context if needed
        window.location.reload(); // Simple refresh
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to transfer points");
    } finally {
      setIsTransferring(false);
    }
  };

  const currentUserId = user?._id;
  const isOwnProfile = String(id) === String(currentUserId);
  return (
    <Mainlayout>
      <div className="max-w-6xl w-full px-2 sm:px-4">
        {/* User Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Avatar className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 flex-shrink-0">
            <AvatarFallback className="text-xl sm:text-2xl lg:text-3xl">
              {users.name
                .split(" ")
                .map((n: any) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-1 break-words">
                    {users.name}
                  </h1>
                </div>

              {isOwnProfile && (
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 bg-transparent"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white text-gray-900">
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      {/* Basic Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">
                          Basic Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="name">Display Name</Label>
                            <Input
                              id="name"
                              value={editForm.name}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  name: e.target.value,
                                })
                              }
                              placeholder="Your display name"
                            />
                          </div>
                        </div>
                      </div>
                      {/* About Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">About</h3>
                        <div>
                          <Label htmlFor="about">About Me</Label>
                          <Textarea
                            id="about"
                            value={editForm.about}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                about: e.target.value,
                              })
                            }
                            placeholder="Tell us about yourself, your experience, and interests..."
                            className="min-h-32"
                          />
                        </div>
                      </div>

                      {/* Tags/Skills Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">
                          Skills & Technologies
                        </h3>

                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <Input
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              placeholder="Add a skill or technology"
                              onKeyPress={(e) =>
                                e.key === "Enter" && handleAddTag()
                              }
                            />
                            <Button
                              onClick={handleAddTag}
                              variant="outline"
                              size="sm"
                              className="bg-orange-600 text-white"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {editForm.tags.map((tag: any) => {
                              return (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="bg-orange-100 text-orange-800 flex items-center gap-1"
                                >
                                  {tag}
                                  <button
                                    onClick={() => handleRemoveTag(tag)}
                                    className="ml-1 hover:text-red-600"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                          className="bg-white text-gray-800 hover:text-gray-900"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveProfile}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Member since{" "}
                {new Date(users.joinDate).toISOString().split("T")[0]}
              </div>
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-yellow-500" />
                <span className="font-semibold text-yellow-600">{users.points || 0}</span>
                <span className="text-gray-600">points</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center space-x-6 text-sm mb-4">
              {users.badges && users.badges.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Badges:</span>
                  {users.badges.map((badge: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="bg-purple-100 text-purple-800">
                      {badge}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            {isOwnProfile && (
              <div className="mb-4 flex gap-2">
                <Button
                  variant="outline"
                  onClick={fetchLoginHistory}
                  className="flex items-center gap-2"
                  disabled={loadingHistory}
                >
                  <History className="w-4 h-4" />
                  {loadingHistory ? "Loading..." : "Login History"}
                </Button>
                {(user?.points || 0) >= 10 && (
                  <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Transfer Points
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Transfer Points</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Search User</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleSearchUsers()}
                            placeholder="Search by name or email"
                          />
                          <Button onClick={handleSearchUsers} disabled={isSearching}>
                            <Search className="w-4 h-4" />
                          </Button>
                        </div>
                        {searchResults.length > 0 && (
                          <div className="mt-2 border rounded-md max-h-40 overflow-y-auto">
                            {searchResults.map((result) => (
                              <div
                                key={result._id}
                                className={`p-2 cursor-pointer hover:bg-gray-100 ${
                                  selectedRecipient?._id === result._id ? "bg-blue-100" : ""
                                }`}
                                onClick={() => setSelectedRecipient(result)}
                              >
                                <div className="font-semibold">{result.name}</div>
                                <div className="text-sm text-gray-600">{result.email}</div>
                                <div className="text-sm text-yellow-600">
                                  {result.points || 0} points
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {selectedRecipient && (
                        <div className="p-3 bg-blue-50 rounded-md">
                          <div className="font-semibold">Selected: {selectedRecipient.name}</div>
                          <div className="text-sm text-gray-600">{selectedRecipient.email}</div>
                        </div>
                      )}
                      <div>
                        <Label>Points to Transfer</Label>
                        <Input
                          type="number"
                          value={transferPoints}
                          onChange={(e) => setTransferPoints(e.target.value)}
                          placeholder="Enter points"
                          min="1"
                          max={user?.points || 0}
                        />
                        <div className="text-sm text-gray-500 mt-1">
                          Your current points: {user?.points || 0}
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowTransferDialog(false);
                            setSelectedRecipient(null);
                            setTransferPoints("");
                            setSearchQuery("");
                            setSearchResults([]);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleTransferPoints}
                          disabled={!selectedRecipient || !transferPoints || isTransferring}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {isTransferring ? "Transferring..." : "Transfer"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">About</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {users.about}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Top Tags</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3">
                  {(users.tags || []).length === 0 ? (
                    <p className="text-sm text-gray-500">No tags yet</p>
                  ) : (
                    users.tags.map((tag: string) => (
                    <div
                      key={tag}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                        >
                          {tag}
                        </Badge>
                      </div>
                    </div>
                  ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Login History Dialog */}
        {isOwnProfile && (
          <Dialog open={showLoginHistory} onOpenChange={setShowLoginHistory}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Login History</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {loginHistory.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No login history available
                  </div>
                ) : (
                  <div className="space-y-3">
                    {loginHistory.map((history: any, idx: number) => (
                      <Card key={idx} className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              {getDeviceIcon(history.deviceType)}
                              <span className="font-semibold">{history.browser}</span>
                              <span className="text-sm text-gray-500">on</span>
                              <span className="text-sm">{history.os}</span>
                              {getStatusBadge(history.status)}
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex items-center gap-2">
                                <Globe className="w-3 h-3" />
                                <span>IP: {history.ipAddress}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  {new Date(history.loginTime).toLocaleString()}
                                </span>
                              </div>
                              {history.requiresOTP && (
                                <div className="text-xs text-blue-600">
                                  {history.otpVerified ? "✓ OTP Verified" : "⏳ OTP Pending"}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">
                            {history.deviceType}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Mainlayout>
  );
};

export default index;
