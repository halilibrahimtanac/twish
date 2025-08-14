"use client";
import { trpc } from "@/app/_trpc/client";
import { QueryStateHandler } from "@/components/QueryStateHandler";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { TwishCard, TwishData } from "@/components/twish/TwishCard";
import { useParams, useSearchParams } from "next/navigation";
import React, { useMemo } from "react";

export interface TwishDataWithChildren extends TwishData {
  children: TwishDataWithChildren[];
}

const CommentThread = ({ comments }: { comments: TwishDataWithChildren[] }) => {
  return (
    <div>
      {comments.map(comment => (
        <React.Fragment key={comment.id}>
          <TwishCard twish={comment} />
          {comment.children && comment.children.length > 0 && (
            <CommentThread comments={comment.children} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const Page = () => {
  const { twishId } = useParams();
  const searchParams = useSearchParams();
  const type = searchParams.get('type');
  const twishIdParam = twishId?.toString() || "";

  const singleTwishQuery = trpc.twish.getSingleTwish.useQuery({ twishId: twishIdParam });
  const commentsQuery = trpc.twish.getCommentsByTwishId.useQuery(
    { type: type || "", twishId: twishIdParam },
    { enabled: !!singleTwishQuery.data }
  );

  const hierarchicalComments = useMemo(() => {
    if (!commentsQuery.data) return [];
    
    const commentsMap: Map<string, TwishDataWithChildren> = new Map();
    commentsQuery.data.forEach(comment => {
      commentsMap.set(comment.id, { ...comment, children: [] });
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
  }, [commentsQuery.data]);

  return (
    <div className="sm:w-auto w-full flex flex-col mx-auto items-center box-border sm:p-3">
      <QueryStateHandler query={singleTwishQuery}>
        <TwishCard twish={singleTwishQuery.data!} />
        
        {commentsQuery.isLoading && <Spinner />}
        {commentsQuery.isError && <ErrorMessage message={commentsQuery.error?.message || "Yorumlar yüklenemedi."} />}
        {commentsQuery.data && (
          hierarchicalComments.length > 0 ? (
            <div className="w-full flex flex-col">
              <CommentThread comments={hierarchicalComments} />
            </div>
          ) : (
            <div className="mt-4 text-gray-500">Henüz yorum yok. İlk yorumu sen yap!</div>
          )
        )}
      </QueryStateHandler>
    </div>
  );
};

export default Page;