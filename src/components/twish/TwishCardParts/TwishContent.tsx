import { CardContent } from '@/components/ui/card';
import React from 'react'
import { renderHighlightedText } from '../TwishCreator';
import { cn } from '@/lib/utils';

interface Props {
    content: string;
    originalAuthorUsername?: string | null;
    parentAuthorUsername?: string | null;
}

const sharedTextareaClasses = "w-full rounded-md border-input bg-transparent px-1 py-1 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none whitespace-pre-wrap break-word";


const TwishContent: React.FC<Props> = ({ content, originalAuthorUsername, parentAuthorUsername }) => {
  return (
    <CardContent className="px-4">
      {originalAuthorUsername ? (
        <span className="w-fit text-sm flex gap-1 text-slate-400">
          Replying to <p className="text-blue-400">@{originalAuthorUsername}</p>{" "}
          {parentAuthorUsername &&
            parentAuthorUsername !== originalAuthorUsername && (
              <p className="text-blue-400">@{parentAuthorUsername}</p>
            )}
        </span>
      ) : null}
      <div
        className={cn(
          sharedTextareaClasses,
          "text-lg pointer-events-none text-foreground [grid-area:1/1/2/2]"
        )}
        aria-hidden="true"
      >
        {renderHighlightedText(content + "\n")}
      </div>
    </CardContent>
  );
}

export default TwishContent