import { trpc } from "@/app/_trpc/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { User, useUserStore } from "@/lib/store/user.store";
import { cn, initials } from "@/lib/utils";
import { SaveUserInputType } from "@/server/routers/user/user.input";
import { MapPin, Link as LinkIcon, Edit, Camera } from "lucide-react";
import { useState, useRef, ChangeEvent } from "react";
import TwishList from "./twish/TwishList";

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
    },
  });
  const [isEditing, setIsEditing] = useState(false);

  const [name, setName] = useState(initialName || "");
  const [bio, setBio] = useState(initialBio || "");

  const [profilePictureUrl, setProfilePictureUrl] = useState<
    string | undefined
  >(initialProfilePictureUrl || undefined);
  const [backgroundPictureUrl, setBackgroundPictureUrl] = useState<
    string | undefined
  >(initialBackgroundPictureUrl || undefined);

  const [profilePictureFile, setProfilePictureFile] = useState<
    File | undefined
  >();
  const [backgroundPictureFile, setBackgroundPictureFile] = useState<
    File | undefined
  >();

  const profilePictureInputRef = useRef<HTMLInputElement>(null);
  const backgroundPictureInputRef = useRef<HTMLInputElement>(null);

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
    const updateObj: SaveUserInputType = { id: id ?? "" };

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
      newProfilePictureUrl = `/uploads/${id}/${uploadedProfileUrl}`;
      updateObj.profilePictureUrl = newProfilePictureUrl;
    }

    if (backgroundPictureFile && id) {
      const uploadedBackgroundUrl = await uploadFile(backgroundPictureFile, id);
      newBackgroundPictureUrl = `/uploads/${id}/${uploadedBackgroundUrl}`;
      updateObj.backgroundPictureUrl = newBackgroundPictureUrl;
    }

    if (name !== initialName) {
      updateObj.name = name;
    }

    if (bio !== initialBio) {
      updateObj.bio = bio;
    }

    if (Object.keys(updateObj).length > 1) {
      await updateUserInfo.mutateAsync(updateObj);
      setUser(
        "profilePictureUrl",
        newProfilePictureUrl || initialProfilePictureUrl
      );
      setUser(
        "backgroundPictureUrl",
        newBackgroundPictureUrl || initialBackgroundPictureUrl
      );
    }

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
    setter: React.Dispatch<React.SetStateAction<string | undefined>>,
    fileSetter: React.Dispatch<React.SetStateAction<File | undefined>>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setter(URL.createObjectURL(file));
      fileSetter(file);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <Card className="w-full max-w-2xl border-t-0 rounded-none mx-auto overflow-hidden pt-0">
        {/* Hidden file inputs for image selection */}
        <input
          type="file"
          ref={profilePictureInputRef}
          onChange={(e) =>
            handleFileChange(e, setProfilePictureUrl, setProfilePictureFile)
          }
          className="hidden"
          accept="image/*"
        />
        <input
          type="file"
          ref={backgroundPictureInputRef}
          onChange={(e) =>
            handleFileChange(
              e,
              setBackgroundPictureUrl,
              setBackgroundPictureFile
            )
          }
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
                  src={profilePictureUrl ?? undefined}
                  alt={`${name}'s profile picture`}
                />
                <AvatarFallback className="text-4xl">
                  {initials(name)}
                </AvatarFallback>
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
                    className="text-2xl font-bold p-2 h-auto"
                  />
                </div>
              ) : (
                <h1 className="text-2xl font-bold">{name}</h1>
              )}
              <p className={cn("text-muted-foreground", isEditing && "mt-2")}>
                @{username}
              </p>
            </div>

            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save</Button>
              </>
            ) : (
              <>
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit Profile
                </Button>
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

      <TwishList userIdParam={id} />
    </div>
  );
}
