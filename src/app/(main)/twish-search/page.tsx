import TwishSearch from "@/components/twish/TwishSearch";
import React from "react";

interface TwishSearchProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const TwishSearchPage = async ({ searchParams }: TwishSearchProps) => {
  const params = await searchParams;
  const query = typeof params.query === "string" ? params.query : "";
  const type = params.type === "tag" || params.type === "word" ? params.type : "word";

  return (
    <div className="w-full flex flex-col items-center box-border sm:p-3">
      {type === "word" && query && (
        <div className="w-full max-w-2xl mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Searched word:
          </h2>
          <p className="text-gray-700 dark:text-gray-300 font-medium">
            {`"${query}"`}
          </p>
        </div>
      )}

      <TwishSearch
        query={query}
        type={type}
      />
    </div>
  );
};

export default TwishSearchPage;
