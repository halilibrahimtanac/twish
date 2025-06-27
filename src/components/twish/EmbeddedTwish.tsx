import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { dateStringConverter } from "@/lib/utils";

interface PropType {
  embeddedTwish: {
    content: string | null;
    authorAvatarUrl: string | null;
    authorName: string | null;
    authorUsername: string | null;
    createdAt: string | null;
  };
}

const EmbeddedTwish: React.FC<PropType> = ({ embeddedTwish }) => {
  return (
    <div className="mx-2 rounded-xl border p-4">
      <div className="mb-2 flex items-center gap-2">
        <Avatar className="h-7 w-7">
          <AvatarImage src={embeddedTwish.authorAvatarUrl ?? undefined} />
          <AvatarFallback>{embeddedTwish.authorName?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="w-fit flex flex-col items-start">
          <span className="text-xs font-bold">{embeddedTwish.authorName}</span>
          <span className="text-xs text-muted-foreground">
            @{embeddedTwish.authorUsername}
          </span>
        </div>

        <span className="ml-auto text-xs text-muted-foreground">{dateStringConverter(embeddedTwish.createdAt || "")}</span>
      </div>
      <p className="text-muted-foreground">{embeddedTwish.content}</p>
    </div>
  );
};

export default EmbeddedTwish;
