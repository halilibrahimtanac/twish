import { CardContent } from '@/components/ui/card';
import React from 'react'

interface Props {
    content: string;
}

const TwishContent: React.FC<Props> = ({ content }) => {
  return (
    <CardContent className="px-4">
        <p className="text-base whitespace-pre-wrap leading-relaxed">
          {content}
        </p>
      </CardContent>
  )
}

export default TwishContent