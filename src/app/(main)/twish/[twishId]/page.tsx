"use client";
import { trpc } from "@/app/_trpc/client";
import { TwishCard, TwishData } from "@/components/twish/TwishCard";
import { useParams, useSearchParams } from "next/navigation";
import React, { useMemo } from "react";

export interface TwishDataWithChildren extends TwishData {
  children: TwishDataWithChildren[];
}


const CommentThread = ({ comments, level = 0 }: { comments: TwishDataWithChildren[]; level?: number }) => {
  
  return (
    <div>
      {comments.map(comment => (
        <React.Fragment key={comment.id}>
          <TwishCard twish={comment} />
          {comment.children && comment.children.length > 0 && (
            <CommentThread comments={comment.children} level={level + 1} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}


const Page = () => {
  const { twishId } = useParams();
  const searchParams = useSearchParams();
  const type = searchParams.get('type');
  const twishIdParam = twishId?.toString() || ""
  const { data, isError, error, isLoading } = trpc.twish.getSingleTwish.useQuery({ twishId: twishIdParam });
  const { data: comments, isError: isErrorComments, error: commentError, isLoading: isLoadingComments } = trpc.twish.getCommentsByTwishId.useQuery({ type: type || "", twishId: twishIdParam });

  const hierarchicalComments = useMemo(() => {
    if (!comments) return [];
    
    const commentsMap: Map<string, TwishDataWithChildren> = new Map();
    
    comments.forEach(comment => {
      commentsMap.set(comment.id, {
        ...comment,
        children: [] 
      });
    });

    const rootComments: TwishDataWithChildren[] = [];

    commentsMap.forEach(comment => {
      if (comment.parentTwish?.id && commentsMap.has(comment.parentTwish.id)) {
        commentsMap.get(comment.parentTwish.id)!.children.push(comment);
      } else {
        rootComments.push(comment);
      }
    });

    return rootComments;
  }, [comments]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <span className="text-red-500">{error.message}</span>;
  }

  if (data) {
    return (
      <div className="sm:w-auto w-full flex flex-col mx-auto items-center box-border sm:p-3">
        <TwishCard twish={data} />
        {isLoadingComments && <div>Yorumlar yükleniyor...</div>}
        {isErrorComments && <div>Hata: {commentError?.message}</div>}
        {hierarchicalComments && hierarchicalComments.length > 0 ? (
          <div className="w-full flex flex-col">
            <CommentThread comments={hierarchicalComments} />
          </div>
        ) : (
          !isLoadingComments && <div className="mt-4">Henüz yorum yok. İlk yorumu sen yap!</div>
        )}
      </div>
    );
  }

  return <div>No twish found.</div>;
};

export default Page;