import { trpc } from "@/app/_trpc/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { User } from "@/lib/store/user.store";
import { cn, formatCityName, initials } from "@/lib/utils";
import { SaveUserInputType } from "@/server/routers/user/user.input";
import {
  MapPin,
  Edit,
  Camera,
  MessageCircle,
  Video,
} from "lucide-react";
import { useState, useRef, ChangeEvent, useEffect } from "react";

import { useWebRTC } from "../WebRTCContext";
import { useSocket } from "../SocketContext";

import { Spinner } from "../ui/Spinner";
import FollowButton from "./FollowButton";
import { ImageCropModal } from "./ImageCropModal";
import FollowList from "./FollowList";
import { City } from "@/lib/city-search";
import { useDebounce } from "use-debounce";
import ProfileTabs from "./ProfileTabs";
import FullScreenMedia from "../FullScreenMedia";
import { useSession } from "next-auth/react";
import { ChatModal } from "../messages/ChatModal";

export function UserProfileCard({
  id,
  name: initialName,
  username,
  bio: initialBio,
  profilePictureUrl: initialProfilePictureUrl,
  backgroundPictureUrl: initialBackgroundPictureUrl,
  location: initialLocation,
  canEdit = false
}: Partial<User & { canEdit: boolean; followerCount: number; followingCount: number; }>) {
  const { update: updateSession } = useSession();
  const utils = trpc.useUtils();
  const updateUserInfo = trpc.user.updateUserInfo.useMutation({
    onSuccess: async (_data, variables) => {
      await utils.user.getUserProfileInfos.invalidate();
    
      const updateObj: { profilePictureUrl?: string; backgroundPictureUrl?: string } = {};

      if (variables?.profilePictureUrl) {
        updateObj.profilePictureUrl = variables.profilePictureUrl;
      }
      if (variables?.backgroundPictureUrl) {
        updateObj.backgroundPictureUrl = variables.backgroundPictureUrl;
      }

      if (Object.keys(updateObj).length > 0) {
        await updateSession(updateObj);
      }
    },
    onError: (error) => {
      console.error("Update failed:", error);
    },
  });
  const { data, isPending } = trpc.follows.userFollowCounts.useQuery({ id: id || "" });

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName || "");
  const [bio, setBio] = useState(initialBio || "");

  const [followListOpen, setFollowListOpen] = useState(false);
  const [followListType, setFollowListType] = useState<"follower" | "following">("following");

  const [profilePictureUrl, setProfilePictureUrl] = useState<string | undefined>(initialProfilePictureUrl || undefined);
  const [backgroundPictureUrl, setBackgroundPictureUrl] = useState<
    string | undefined
  >(initialBackgroundPictureUrl || undefined);

  const [profilePictureFile, setProfilePictureFile] = useState<
    File | undefined
  >();
  const [backgroundPictureFile, setBackgroundPictureFile] = useState<
    File | undefined
  >();

  const [showProfileCropModal, setShowProfileCropModal] = useState(false);
  const [tempProfileImageSrc, setTempProfileImageSrc] = useState<string>("");
  const [tempProfileFileName, setTempProfileFileName] = useState<string>("");

  const profilePictureInputRef = useRef<HTMLInputElement>(null);
  const backgroundPictureInputRef = useRef<HTMLInputElement>(null);
  const [isOnline, setIsOnline] = useState(false);
  const { socket } = useSocket();
  const { startCall, isCallActive, isCalling } = useWebRTC();

  const [location, setLocation] = useState<City | null>(initialLocation as City || null);
  const [locationQuery, setLocationQuery] = useState(formatCityName(initialLocation || null));
  const [debouncedLocationQuery] = useDebounce(locationQuery, 300);
  
  const [suggestions, setSuggestions] = useState<City[]>([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [fullscreen, setFullscreen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (debouncedLocationQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search-cities?q=${encodeURIComponent(debouncedLocationQuery)}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data: City[] = await response.json();
        setSuggestions(data);
      } catch (error) {
        console.error("Failed to fetch city suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedLocationQuery]);

  useEffect(() => {
    if (socket && id) {
      socket.emit(
        "check-user-online",
        id,
        (response: { isOnline: boolean }) => {
          setIsOnline(response.isOnline);
        }
      );

      const handleOnlineStatusUpdate = (onlineUsers: string[]) => {
        setIsOnline(onlineUsers.includes(id));
      };

      socket.on("online-users-updated", handleOnlineStatusUpdate);

      return () => {
        socket.off("online-users-updated", handleOnlineStatusUpdate);
      };
    }
  }, [socket, id]);

  const handleStartCall = () => {
    if (id) {
      startCall(id);
    }
  };

  const uploadFile = async (file: File, userId: string) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`/api/upload?userId=${userId}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("File upload failed");
    }

    const data = await response.json();
    return data.url;
  };

  const handleSave = async () => {
    const updateObj: SaveUserInputType = {};

    let newProfilePictureUrl =
      profilePictureUrl === initialProfilePictureUrl
        ? undefined
        : profilePictureUrl;
    let newBackgroundPictureUrl =
      backgroundPictureUrl === initialBackgroundPictureUrl
        ? undefined
        : backgroundPictureUrl;

    if (profilePictureFile && id) {
      const uploadedProfileUrl = await uploadFile(profilePictureFile, id);
      newProfilePictureUrl = uploadedProfileUrl;
      updateObj.profilePictureUrl = newProfilePictureUrl;
    }

    if (backgroundPictureFile && id) {
      const uploadedBackgroundUrl = await uploadFile(backgroundPictureFile, id);
      newBackgroundPictureUrl = uploadedBackgroundUrl;
      updateObj.backgroundPictureUrl = newBackgroundPictureUrl;
    }

    if (JSON.stringify(location) !== JSON.stringify(initialLocation)) {
      updateObj.location = JSON.stringify(location);
    }

    if (name !== initialName) {
      updateObj.name = name;
    }

    if (bio !== initialBio) {
      updateObj.bio = bio;
    }

    if (Object.keys(updateObj).length > 0) {
      await updateUserInfo.mutateAsync(updateObj);
    }

    if (newProfilePictureUrl) {
      setProfilePictureUrl(newProfilePictureUrl);
    }
    if (newBackgroundPictureUrl) {
      setBackgroundPictureUrl(newBackgroundPictureUrl);
    }

    setIsEditing(false);
  };

  const handleCancel = () => {
    setName(initialName || "");
    setBio(initialBio || "");
    setProfilePictureUrl(initialProfilePictureUrl || undefined);
    setBackgroundPictureUrl(initialBackgroundPictureUrl || undefined);
    const initialLoc = initialLocation as City | null;
    setLocation(initialLoc);
    setLocationQuery(formatCityName(initialLoc));
    setIsEditing(false);
  };

  const handleBackgroundFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBackgroundPictureUrl(URL.createObjectURL(file));
      setBackgroundPictureFile(file);
    }
  };

  const handleProfileFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setTempProfileImageSrc(URL.createObjectURL(file));
      setTempProfileFileName(file.name);
      setShowProfileCropModal(true);
    }
  };

  const handleProfileCropComplete = (croppedImageFile: File) => {
    setProfilePictureFile(croppedImageFile);
    setProfilePictureUrl(URL.createObjectURL(croppedImageFile));
  };

  const handleLocationChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLocationQuery(e.target.value);
    if (e.target.value === "") {
        setLocation(null);
    }
    setIsSuggestionsOpen(true);
  }

  const handleSelectLocation = (selection: City) => {
    setLocation(selection);
    setLocationQuery(formatCityName(selection));
    setIsSuggestionsOpen(false);
  }

  const followListOpenHandler = (type: "follower" | "following") => {
    setFollowListOpen(true);
    setFollowListType(type);
  }

  return (
    <div className="w-full flex flex-col items-center">
      <Card className="w-full max-w-2xl border-t-0 rounded-none mx-auto overflow-hidden pt-0 shadow-none">
        <input
          type="file"
          ref={profilePictureInputRef}
          onChange={handleProfileFileChange}
          className="hidden"
          accept="image/*"
        />
        <input
          type="file"
          ref={backgroundPictureInputRef}
          onChange={handleBackgroundFileChange}
          className="hidden"
          accept="image/*"
        />

        <div className="relative">
          <div
            className="h-56 w-full bg-cover bg-center border-b-[0.5px] bg-muted"
            style={{ backgroundImage: `url(${backgroundPictureUrl})` }}
          />
          {isEditing && (
            <Button
              variant="outline"
              size="icon"
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white border-white/50"
              onClick={() => backgroundPictureInputRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
            </Button>
          )}

          <div className="absolute bottom-0 left-6 translate-y-1/2">
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-background">
                <AvatarImage
                  onClick={() => setFullscreen(true)}
                  src={profilePictureUrl ?? undefined}
                  alt={`${name}'s profile picture`}
                />
                <AvatarFallback className="text-4xl">
                  {initials(name)}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute bottom-1 right-1 rounded-full h-8 w-8 bg-black/50 hover:bg-black/70 text-white border-white/50"
                  onClick={() => profilePictureInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="pt-15 p-6 space-y-4">
          <div className="flex justify-between gap-2">
            <div className="w-fit">
              {isEditing ? (
                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    Name
                  </label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="sm:text-2xl text-lg font-bold h-8"
                  />
                </div>
              ) : (
                <h1 className="text-lg font-bold">{name}</h1>
              )}
              <p
                className={cn(
                  "text-sm text-muted-foreground",
                  isEditing && "mt-2"
                )}
              >
                @{username}
              </p>
            </div>

            {isEditing ? (
              <span className="flex justify-end gap-2 mt-5">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save</Button>
              </span>
            ) : (
              <>
                {canEdit ? (
                  <Button onClick={() => setIsEditing(true)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit Profile
                  </Button>
                ) : (
                  <span className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsChatOpen(true)}>
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={handleStartCall}
                      disabled={!isOnline || isCallActive || isCalling}
                      className="justify-center"
                    >
                      <Video className="h-4 w-4" />
                      {isOnline && isCalling ? (
                        <span className="inline-flex items-center">
                          <span className="dot-typing"></span>
                        </span>
                      ) : (
                        ""
                      )}
                    </Button>
                    <style jsx>{`
                      .dot-typing {
                        position: relative;
                        width: 24px;
                        height: 10px;
                        display: inline-block;
                      }
                      .dot-typing::before,
                      .dot-typing::after,
                      .dot-typing span {
                        content: "";
                        display: inline-block;
                        width: 6px;
                        height: 6px;
                        border-radius: 50%;
                        background: currentColor;
                        position: absolute;
                        top: 0;
                        animation: dotTyping 1s infinite linear;
                      }
                      .dot-typing::before {
                        left: 0;
                        animation-delay: 0s;
                      }
                      .dot-typing span {
                        left: 8px;
                        animation-delay: 0.2s;
                      }
                      .dot-typing::after {
                        left: 16px;
                        animation-delay: 0.4s;
                      }
                      @keyframes dotTyping {
                        0% {
                          opacity: 0.2;
                        }
                        20% {
                          opacity: 1;
                        }
                        100% {
                          opacity: 0.2;
                        }
                      }
                    `}</style>
                  </span>
                )}
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {isEditing ? (
              <>
                <div className="relative flex items-center gap-2 w-full sm:w-auto">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <Input 
                    placeholder="Location" 
                    value={locationQuery} 
                    onChange={handleLocationChange}
                    onFocus={() => setIsSuggestionsOpen(true)}
                    onBlur={() => setTimeout(() => setIsSuggestionsOpen(false), 150)}
                    className="h-8"
                    autoComplete="off"
                  />
                  {isSuggestionsOpen && (
                    <div className="absolute top-full mt-2 w-full bg-background border rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                      {isLoading ? <div><Spinner /></div> : suggestions.map((item) => (
                        <div 
                          key={item.id}
                          className="p-2 hover:bg-muted cursor-pointer text-sm"
                          onMouseDown={() => handleSelectLocation(item)}
                        >
                          {formatCityName(item)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {formatCityName(location)}
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            {isEditing ? (
              <div className="space-y-2">
                <label
                  htmlFor="bio"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Bio
                </label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                />
              </div>
            ) : (
              <p className="text-sm leading-relaxed">{bio}</p>
            )}
          </div>

          {isPending ? <div className="w-full flex justify-center items-center"><Spinner /></div> : <div className="items-center flex gap-4">
            <div className="cursor-pointer h-fit" onClick={() => followListOpenHandler("following")}>
              <span className="font-bold">{data?.followingCount || 0}</span>
              <span className="text-muted-foreground ml-1">Following</span>
            </div>
            <div className="cursor-pointer h-fit" onClick={() => followListOpenHandler("follower")}>
              <span className="font-bold">{data?.followerCount || 0}</span>
              <span className="text-muted-foreground ml-1">Followers</span>
            </div>

            {id && !canEdit && <FollowButton followingId={id} />}
          </div>}
        </div>
      </Card>

      {/* User Twish List */}
      {id && <ProfileTabs userIdParam={id}/>}

      {/* Profile Picture Crop Modal */}
      <ImageCropModal
        isOpen={showProfileCropModal}
        onClose={() => setShowProfileCropModal(false)}
        imageSrc={tempProfileImageSrc}
        onCropComplete={handleProfileCropComplete}
        fileName={tempProfileFileName}
      />

      {/* FollowList */}
      <FollowList id={id || ""} type={followListType} isOpen={followListOpen} onOpenChange={setFollowListOpen}/>
    
      {fullscreen && profilePictureUrl && <FullScreenMedia fullscreenMedia={{
        url: profilePictureUrl,
        originalName: "",
        mimeType: "image/"
      }} closeFullscreen={() => setFullscreen(false)} mediaCount={1} />}

      {/* Chat Modal */}
      {id && !canEdit && (
        <ChatModal open={isChatOpen} onOpenChange={setIsChatOpen} otherUserId={id} />
      )}
    </div>
  );
}
