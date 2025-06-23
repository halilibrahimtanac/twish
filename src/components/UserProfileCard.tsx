// src/components/UserProfileCard.tsx

import { trpc } from "@/app/_trpc/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { User, useUserStore } from "@/lib/store/user.store";
import { cn, initials } from "@/lib/utils";
import { Mail, MapPin, Link as LinkIcon, Edit, Camera } from "lucide-react";
import { useState, useRef, ChangeEvent } from "react";

export function UserProfileCard({
  id,  
  name: initialName,
  username,
  bio: initialBio,
  profilePictureUrl: initialProfilePictureUrl,
  backgroundPictureUrl: initialBackgroundPictureUrl,
}: Partial<User>) {
  const { setUser } = useUserStore();
  const updateUserInfo = trpc.user.updateUserInfo.useMutation({
    onSuccess: (data) => {
        console.log("saved: ", data);
    }
  });
  const [isEditing, setIsEditing] = useState(false);

  const [name, setName] = useState(initialName || "");
  const [bio, setBio] = useState(initialBio || "");
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | undefined>(initialProfilePictureUrl || undefined);
  const [backgroundPictureUrl, setBackgroundPictureUrl] = useState<string | undefined>(initialBackgroundPictureUrl || undefined);
  
  const profilePictureInputRef = useRef<HTMLInputElement>(null);
  const backgroundPictureInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    console.log("Saving data:", { name, bio, profilePictureUrl, backgroundPictureUrl });
    await updateUserInfo.mutateAsync({ id: id ?? "", name, bio, profilePictureUrl, backgroundPictureUrl });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setName(initialName || "");
    setBio(initialBio || "");
    setProfilePictureUrl(initialProfilePictureUrl || undefined);
    setBackgroundPictureUrl(initialBackgroundPictureUrl || undefined);
    setIsEditing(false);
  };

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string | undefined>>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Create a temporary URL for the selected image for preview purposes
      setter(URL.createObjectURL(file));
      // In a real app, you would also prepare this file for upload.
    }
  };

  return (
    <Card className="w-full max-w-2xl border-t-0 rounded-none mx-auto overflow-hidden pt-0">
      {/* Hidden file inputs for image selection */}
      <input
        type="file"
        ref={profilePictureInputRef}
        onChange={(e) => handleFileChange(e, setProfilePictureUrl)}
        className="hidden"
        accept="image/*"
      />
      <input
        type="file"
        ref={backgroundPictureInputRef}
        onChange={(e) => handleFileChange(e, setBackgroundPictureUrl)}
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
              <AvatarImage src={profilePictureUrl || undefined} alt={`${name}'s profile picture`} />
              <AvatarFallback className="text-4xl">{initials(name)}</AvatarFallback>
            </Avatar>
            {/* Edit button for profile picture, shown only in edit mode */}
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

      <div className="pt-20 p-6 space-y-4">
        <div className="flex justify-end gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save</Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="icon">
                <Mail className="h-4 w-4" />
              </Button>
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" /> Edit Profile
              </Button>
            </>
          )}
        </div>

        <div>
          {isEditing ? (
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-muted-foreground">Name</label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="text-2xl font-bold p-2 h-auto" />
            </div>
          ) : (
            <h1 className="text-2xl font-bold">{name}</h1>
          )}
          <p className={cn("text-muted-foreground", isEditing && "mt-2")}>@{username}</p>
        </div>

        <div>
          {isEditing ? (
            <div className="space-y-2">
              <label htmlFor="bio" className="text-sm font-medium text-muted-foreground">Bio</label>
              <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." />
            </div>
          ) : (
            <p className="text-sm leading-relaxed">{bio}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            San Francisco, CA
          </div>
          <div className="flex items-center gap-1">
            <LinkIcon className="h-4 w-4" />
            <a href="#" className="hover:underline text-blue-500">
              portfolio.com
            </a>
          </div>
        </div>

        <div className="flex gap-4 pt-2">
          <div>
            <span className="font-bold">1,234</span>
            <span className="text-muted-foreground ml-1">Following</span>
          </div>
          <div>
            <span className="font-bold">5,678</span>
            <span className="text-muted-foreground ml-1">Followers</span>
          </div>
        </div>
      </div>
    </Card>
  );
}