import { trpc } from "@/app/_trpc/client";
import TwishListExternal from "./TwishListExternal";


export default function TwishList({ userIdParam, type, emptyMessage }: { userIdParam?: string; type?: string; emptyMessage?: React.ReactNode; }) {
  const twishes = trpc.twish.getAllTwishes.useQuery({ userId: userIdParam, type });

  return (
    <TwishListExternal 
      twishes={twishes}
      emptyMessage={emptyMessage}
    />
  );
}