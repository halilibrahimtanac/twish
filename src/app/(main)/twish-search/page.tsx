import TwishSearch from "@/components/twish/TwishSearch";
import React from "react";

interface TwishSearchProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

const TwishSearchPage = async ({ searchParams }: TwishSearchProps) => {
  const params = await searchParams;

  return (
    <div className="w-full flex flex-col items-center box-border sm:p-3">
      <TwishSearch
        query={typeof params.query === "string" ? params.query : ""}
        type={
          params.type === "tag" || params.type === "word" ? params.type : "word"
        }
      />
    </div>
  );
};

export default TwishSearchPage;
