import { CardContent } from '@/components/ui/card';
import React from 'react'

interface Props {
    content: string;
    originalAuthorUsername?: string | null;
    parentAuthorUsername?: string | null;
}

const TwishContent: React.FC<Props> = ({ content, originalAuthorUsername, parentAuthorUsername }) => {
  return (
    <CardContent className="px-4">
      {originalAuthorUsername ? <span className='w-fit text-sm flex gap-1 text-slate-400'>Replying to  <p className='text-blue-400'>@{originalAuthorUsername}</p> {parentAuthorUsername && <p className='text-blue-400'>@{parentAuthorUsername}</p>}</span> : null}
        <p className="text-base whitespace-pre-wrap leading-relaxed">
          {content}
        </p>
      </CardContent>
  )
}

export default TwishContent