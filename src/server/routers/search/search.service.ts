import { SearchTwishInput } from "./search.input";
import { queryRaw } from "@/db/neon";
import { searchTwishesByContent } from "../twish/twish.service";

type SearchUserRow = {
  id: string;
  name: string;
  username: string;
  profilePictureUrl: string | null;
  isFollowing: boolean;
  relevanceScore: number;
};

export async function searchUsers(query: string, currentUserId: string) {
  if (query.trim().length < 2) {
    return [];
  }

  const lowerCaseQuery = query.toLowerCase();
  const startsWithQuery = `${lowerCaseQuery}%`;
  const containsQuery = `%${lowerCaseQuery}%`;

  const foundUsers = await queryRaw<SearchUserRow>(
    `
    SELECT
      users.id,
      users.name,
      users.username,
      profile_pics.url AS "profilePictureUrl",
      CASE
        WHEN follows.follower_id IS NOT NULL THEN true
        ELSE false
      END AS "isFollowing",
      CASE
        WHEN lower(users.username) = $1 THEN 5
        WHEN lower(users.name) = $1 THEN 4
        WHEN lower(users.username) LIKE $2 THEN 3
        WHEN lower(users.name) LIKE $2 THEN 2
        WHEN lower(users.username) LIKE $3 OR lower(users.name) LIKE $3 THEN 1
        ELSE 0
      END AS "relevanceScore"
    FROM users
    LEFT JOIN pictures AS profile_pics
      ON users.profile_picture_id = profile_pics.id
    LEFT JOIN follows
      ON follows.following_id = users.id
     AND follows.follower_id = $4
    WHERE users.id <> $4
      AND (
        lower(users.name) LIKE $3
        OR lower(users.username) LIKE $3
      )
    ORDER BY "relevanceScore" DESC, users.name ASC
    LIMIT 20
    `,
    [lowerCaseQuery, startsWithQuery, containsQuery, currentUserId]
  );

  return foundUsers;
}

export async function searchTwishes(input: SearchTwishInput) {
  const { query, type } = input;

  if (query.trim().length < 2) {
    return [];
  }

  return searchTwishesByContent(query, type);
}
