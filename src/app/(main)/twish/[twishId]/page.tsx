"use client";
import { trpc } from "@/app/_trpc/client";
import { TwishCard, TwishData } from "@/components/twish/TwishCard";
import { useParams, useSearchParams } from "next/navigation";
import React from "react";

const Page = () => {
  const { twishId } = useParams();
  const searchParams = useSearchParams();
  const type = searchParams.get('type');
  const twishIdParam = twishId?.toString() || ""
  const { data, isError, error, isFetching } = trpc.twish.getSingleTwish.useQuery({ twishId: twishIdParam });
  const { data:comments, isError:isErrorComments, error:commentError, isFetching:isFetchingComment } = trpc.twish.getCommentsByTwishId.useQuery({ type: type || "", twishId: twishIdParam });

  if (isFetching) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <span className="text-red-500">{error.message}</span>;
  }

  if (data) {
    return (
      <div className="sm:w-auto w-full flex flex-col mx-auto items-center box-border p-3">
        <TwishCard twish={data} />
        {isFetchingComment && <div>Yorumlar yükleniyor...</div>}
        {isErrorComments && <div>Hata: {commentError?.message}</div>}
        {comments && comments.length > 0 ? (
          <div className="w-full flex flex-col">
            {comments.map((comment: TwishData) => (
              <TwishCard key={comment.id} twish={comment}/>
            ))}
          </div>
        ) : (
          !isFetchingComment && <div>Henüz yorum yok.</div>
        )}
      </div>
    );
  }

  return <div>No twish found.</div>;
};

export default Page;
