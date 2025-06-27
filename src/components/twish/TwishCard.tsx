import {
  Card,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Repeat,
} from "lucide-react";
import { initials } from "@/lib/utils";
import TwishHeader from "./TwishCardParts/TwishHeader";
import TwishContent from "./TwishCardParts/TwishContent";
import TwishFooter from "./TwishCardParts/TwishFooter";

export interface TwishData {
  id: string;
  authorName: string;
  authorUsername: string;
  authorAvatarUrl: string | null;
  content: string;
  createdAt: string;
  likes?: number;
  comments?: number;
  authorBio?: string;
  authorJoinedDate?: string;
  likedByUserIds?: string[];
  retwishes: number;
  retwishedByUserIds?: string[];
  originalTwish?: {
    id: string | null;
    content: string | null;
    createdAt: string | null;
    authorId: string | null;
    authorName: string | null;
    authorUsername: string | null;
    authorAvatarUrl: string | null;
  };
  originalLikes: number;
  originalLikedByUserIds?: string[];
  originalRetwishes: number;
  originalRetwishedByUserIds?: string[];
}

interface TwishCardProps {
  twish: TwishData;
}



export function TwishCard({ twish }: TwishCardProps) {
  const viewAuthorName = twish.originalTwish?.authorName || twish.authorName;
  const viewAuthorUserName = twish.originalTwish?.authorUsername || twish.authorUsername;
  const viewCreatedAt = twish.originalTwish?.createdAt || twish.createdAt;
  const viewAuthorNameInitials = initials(viewAuthorName);

  return (
    <Card className="sm:min-w-2xl w-full mx-auto py-2 rounded-none gap-3 border-t-0">
      {twish.originalTwish?.authorUsername && <p className="ml-4 flex items-center gap-2 text-xs font-bold"> <Repeat className="w-4 h-4"/> {twish.authorName} retwished</p>}
      
      <TwishHeader viewAuthorName={viewAuthorName} viewAuthorNameInitials={viewAuthorNameInitials} viewAuthorUserName={viewAuthorUserName} viewCreatedAt={viewCreatedAt} twish={twish}/>

      <TwishContent content={twish.content || twish.originalTwish?.content || ""}/>

      <Separator className="!h-[0.5px]" />

      <TwishFooter twish={twish}/>
    </Card>
  );
}