import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { CardHeader } from '@/components/ui/card'
import { HoverCard, HoverCardTrigger } from '@/components/ui/hover-card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { dateStringConverter } from '@/lib/utils'
import { MoreHorizontal } from 'lucide-react'
import React from 'react'
import { TwishData } from '../TwishCard'

interface Props {
    viewAuthorName: string;
    viewAuthorNameInitials: string;
    viewAuthorUserName: string;
    viewCreatedAt: string;
    twish: TwishData;
}

const TwishHeader: React.FC<Props> = ({ viewAuthorName, viewAuthorNameInitials, viewAuthorUserName, viewCreatedAt, twish }) => {
  const avatarUrl = twish.type === "retwish" ? twish.originalTwish?.authorAvatarUrl : twish.authorAvatarUrl;
  return (
    <CardHeader className="flex flex-row items-center gap-2 space-y-0 px-3">
        
         <HoverCard>
          <HoverCardTrigger asChild>
            <a href={`/${viewAuthorName}`} className="flex-shrink-0">
              <Avatar>
                <AvatarImage src={avatarUrl || undefined} alt={twish.authorName} />
                <AvatarFallback>
                  {viewAuthorNameInitials}
                </AvatarFallback>
              </Avatar>
            </a>
          </HoverCardTrigger>
        </HoverCard> 
      
        

        <div className="flex-grow">
          <div className="flex items-center justify-between">
            <div>
              <a
                href={`/${viewAuthorUserName}`}
                className="font-semibold text-sm hover:underline"
              >
                {viewAuthorName}
              </a>
              <p className="text-xs text-muted-foreground">
                @{viewAuthorUserName}
              </p>
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>{dateStringConverter(viewCreatedAt)}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 ml-2"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>More options</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </CardHeader>
  )
}

export default TwishHeader