import {
  GetCommentsByTwishIdInput,
  GetFeedTwishes,
  LikeTwishInput,
  ReTwishInput,
  TwishInputType,
  UpdateTwishMediaPreviewInput,
} from "./twish.input";
import { ParamType, queryRaw, SqlParam } from "@/db/neon";

type TwishRow = {
  id: string;
  content: string;
  createdAt: unknown;
  type: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatarUrl: string | null;
  likes: unknown;
  likedByUserIds: unknown;
  comments: unknown;
  retwishes: unknown;
  retwishedByUserIds: unknown;
  originalTwishId: string | null;
  originalTwishContent: string | null;
  originalTwishCreatedAt: unknown | null;
  originalTwishType: string | null;
  originalAuthorId: string | null;
  originalAuthorName: string | null;
  originalAuthorUsername: string | null;
  originalAuthorAvatarUrl: string | null;
  quotedOriginalTwishId: string | null;
  quotedOriginalTwishContent: string | null;
  quotedOriginalTwishCreatedAt: unknown | null;
  quotedOriginalAuthorId: string | null;
  quotedOriginalAuthorName: string | null;
  quotedOriginalAuthorUsername: string | null;
  quotedOriginalAuthorAvatarUrl: string | null;
  quotedOriginalMediaPreview: string | null;
  originalLikes: unknown;
  originalLikedByUserIds: unknown;
  originalRetwishes: unknown;
  originalRetwishedByUserIds: unknown;
  originalComments: unknown;
  parentTwishId: string | null;
  parentTwishIdValue: string | null;
  parentTwishContent: string | null;
  parentTwishCreatedAt: unknown | null;
  parentAuthorId: string | null;
  parentAuthorName: string | null;
  parentAuthorUsername: string | null;
  parentAuthorAvatarUrl: string | null;
  mediaPreview: string | null;
};

type TwishResult = {
  id: string;
  content: string;
  createdAt: unknown;
  type: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatarUrl: string | null;
  likes: number;
  likedByUserIds: string[];
  comments: number;
  retwishes: number;
  retwishedByUserIds: string[];
  originalTwish: {
    id: string | null;
    content: string | null;
    createdAt: unknown | null;
    authorId: string | null;
    authorName: string | null;
    authorUsername: string | null;
    authorAvatarUrl: string | null;
    type: string | null;
  };
  originalQuotedTwish: {
    id: string | null;
    content: string | null;
    createdAt: unknown | null;
    authorId: string | null;
    authorName: string | null;
    authorUsername: string | null;
    authorAvatarUrl: string | null;
    mediaPreview: string | null;
  };
  originalLikes: number;
  originalLikedByUserIds: string[];
  originalRetwishes: number;
  originalRetwishedByUserIds: string[];
  originalComments: number;
  parentTwishId: string | null;
  parentTwish: {
    id: string | null;
    content: string | null;
    createdAt: unknown | null;
    authorId: string | null;
    authorName: string | null;
    authorUsername: string | null;
    authorAvatarUrl: string | null;
  };
  mediaPreview: string | null;
};

type TwishQueryOptions = {
  typeFilter?: string[];
  userId?: string;
  hasMedia?: boolean;
  twishId?: string;
  commentParentId?: string;
  commentOriginalId?: string;
  commentOnly?: boolean;
  likedByUserId?: string;
  contentSearch?: {
    mode: "tag" | "word";
    query: string;
  };
  limit?: number;
};

const toNumber = (value: unknown) => (value == null ? 0 : Number(value));

const normalizeStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item != null && String(item).length > 0)
      .map((item) => String(item));
  }

  if (value == null) {
    return [];
  }

  const raw = String(value).trim();
  if (!raw) {
    return [];
  }

  const trimmed =
    raw.startsWith("{") && raw.endsWith("}") ? raw.slice(1, -1) : raw;

  if (!trimmed) {
    return [];
  }

  return trimmed.split(",").filter(Boolean);
};

const parseMediaPreview = (value: string | null) =>
  value ? JSON.parse(value) : null;

const mapTwishRow = (row: TwishRow): TwishResult => ({
  id: row.id,
  content: row.content,
  createdAt: row.createdAt,
  type: row.type,
  authorId: row.authorId,
  authorName: row.authorName,
  authorUsername: row.authorUsername,
  authorAvatarUrl: row.authorAvatarUrl,
  likes: toNumber(row.likes),
  likedByUserIds: normalizeStringArray(row.likedByUserIds),
  comments: toNumber(row.comments),
  retwishes: toNumber(row.retwishes),
  retwishedByUserIds: normalizeStringArray(row.retwishedByUserIds),
  originalTwish: {
    id: row.originalTwishId,
    content: row.originalTwishContent,
    createdAt: row.originalTwishCreatedAt,
    authorId: row.originalAuthorId,
    authorName: row.originalAuthorName,
    authorUsername: row.originalAuthorUsername,
    authorAvatarUrl: row.originalAuthorAvatarUrl,
    type: row.originalTwishType,
  },
  originalQuotedTwish: {
    id: row.quotedOriginalTwishId,
    content: row.quotedOriginalTwishContent,
    createdAt: row.quotedOriginalTwishCreatedAt,
    authorId: row.quotedOriginalAuthorId,
    authorName: row.quotedOriginalAuthorName,
    authorUsername: row.quotedOriginalAuthorUsername,
    authorAvatarUrl: row.quotedOriginalAuthorAvatarUrl,
    mediaPreview: row.quotedOriginalMediaPreview,
  },
  originalLikes: toNumber(row.originalLikes),
  originalLikedByUserIds: normalizeStringArray(row.originalLikedByUserIds),
  originalRetwishes: toNumber(row.originalRetwishes),
  originalRetwishedByUserIds: normalizeStringArray(
    row.originalRetwishedByUserIds
  ),
  originalComments: toNumber(row.originalComments),
  parentTwishId: row.parentTwishId,
  parentTwish: {
    id: row.parentTwishIdValue,
    content: row.parentTwishContent,
    createdAt: row.parentTwishCreatedAt,
    authorId: row.parentAuthorId,
    authorName: row.parentAuthorName,
    authorUsername: row.parentAuthorUsername,
    authorAvatarUrl: row.parentAuthorAvatarUrl,
  },
  mediaPreview: row.mediaPreview,
});

const formatTwish = (twish: TwishResult) => ({
  ...twish,
  originalQuotedTwish: {
    ...twish.originalQuotedTwish,
    mediaPreview: parseMediaPreview(twish.originalQuotedTwish.mediaPreview),
  },
  mediaPreview: parseMediaPreview(twish.mediaPreview),
});

const buildTwishQuery = (options: TwishQueryOptions) => {
  const params: SqlParam[] = [];
  const whereClauses: string[] = [];

  const addParam = (value: ParamType) => {
    params.push(value);
    return `$${params.length}`;
  };

  let likedJoin = "";
  if (options.likedByUserId) {
    likedJoin = `INNER JOIN likes AS liked_filter
      ON liked_filter.twish_id = t.id
     AND liked_filter.user_id = ${addParam(options.likedByUserId)}`;
  }

  if (options.typeFilter && options.typeFilter.length > 0) {
    const placeholders = options.typeFilter.map(addParam).join(", ");
    whereClauses.push(`t.type IN (${placeholders})`);
  }

  if (options.userId) {
    whereClauses.push(`t.author_id = ${addParam(options.userId)}`);
  }

  if (options.hasMedia !== undefined) {
    whereClauses.push(
      `t.has_media = ${addParam(options.hasMedia ? 1 : 0)}`
    );
  }

  if (options.twishId) {
    whereClauses.push(`t.id = ${addParam(options.twishId)}`);
  }

  if (options.commentParentId) {
    whereClauses.push(
      `t.parent_twish_id = ${addParam(options.commentParentId)}`
    );
  }

  if (options.commentOriginalId) {
    whereClauses.push(
      `t.original_twish_id = ${addParam(options.commentOriginalId)}`
    );
  }

  if (options.commentOnly) {
    whereClauses.push(`t.type = ${addParam("comment")}`);
  }

  if (options.contentSearch) {
    const lowered = options.contentSearch.query.toLowerCase();
    const pattern =
      options.contentSearch.mode === "tag"
        ? `%#${lowered}%`
        : `%${lowered}%`;
    whereClauses.push(`LOWER(t.content) LIKE ${addParam(pattern)}`);
  }

  const whereClause =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const limitClause =
    options.limit !== undefined ? `LIMIT ${addParam(options.limit)}` : "";

  const query = `
    WITH reply_counts AS (
      SELECT
        original_twish_id,
        COUNT(id) AS reply_count
      FROM twishes
      WHERE type = 'comment'
        AND original_twish_id IS NOT NULL
      GROUP BY original_twish_id
    ),
    like_counts AS (
      SELECT
        twish_id,
        COUNT(user_id) AS like_count,
        ARRAY_AGG(user_id) AS liked_by_user_ids
      FROM likes
      GROUP BY twish_id
    ),
    retwish_counts AS (
      SELECT
        original_twish_id,
        COUNT(id) AS retwish_count,
        ARRAY_AGG(author_id) AS retwished_by_user_ids
      FROM twishes
      WHERE type = 'retwish'
        AND original_twish_id IS NOT NULL
      GROUP BY original_twish_id
    )
    SELECT
      t.id,
      t.content,
      t.created_at AS "createdAt",
      t.type,
      u.id AS "authorId",
      u.name AS "authorName",
      u.username AS "authorUsername",
      main_pp.url AS "authorAvatarUrl",
      COALESCE(lc.like_count, 0) AS likes,
      lc.liked_by_user_ids AS "likedByUserIds",
      COALESCE(rc.reply_count, 0) AS comments,
      COALESCE(rtw.retwish_count, 0) AS retwishes,
      rtw.retwished_by_user_ids AS "retwishedByUserIds",
      ot.id AS "originalTwishId",
      ot.content AS "originalTwishContent",
      ot.created_at AS "originalTwishCreatedAt",
      ot.type AS "originalTwishType",
      oa.id AS "originalAuthorId",
      oa.name AS "originalAuthorName",
      oa.username AS "originalAuthorUsername",
      opp.url AS "originalAuthorAvatarUrl",
      qt.id AS "quotedOriginalTwishId",
      qt.content AS "quotedOriginalTwishContent",
      qt.created_at AS "quotedOriginalTwishCreatedAt",
      qo.id AS "quotedOriginalAuthorId",
      qo.name AS "quotedOriginalAuthorName",
      qo.username AS "quotedOriginalAuthorUsername",
      qpp.url AS "quotedOriginalAuthorAvatarUrl",
      qt.media_preview AS "quotedOriginalMediaPreview",
      COALESCE(
        (SELECT like_count FROM like_counts WHERE twish_id = t.original_twish_id),
        0
      ) AS "originalLikes",
      (
        SELECT liked_by_user_ids
        FROM like_counts
        WHERE twish_id = t.original_twish_id
      ) AS "originalLikedByUserIds",
      COALESCE(
        (
          SELECT retwish_count
          FROM retwish_counts
          WHERE original_twish_id = t.original_twish_id
        ),
        0
      ) AS "originalRetwishes",
      (
        SELECT retwished_by_user_ids
        FROM retwish_counts
        WHERE original_twish_id = t.original_twish_id
      ) AS "originalRetwishedByUserIds",
      COALESCE(
        (
          SELECT reply_count
          FROM reply_counts
          WHERE original_twish_id = t.original_twish_id
        ),
        0
      ) AS "originalComments",
      t.parent_twish_id AS "parentTwishId",
      pt.id AS "parentTwishIdValue",
      pt.content AS "parentTwishContent",
      pt.created_at AS "parentTwishCreatedAt",
      pa.id AS "parentAuthorId",
      pa.name AS "parentAuthorName",
      pa.username AS "parentAuthorUsername",
      ppp.url AS "parentAuthorAvatarUrl",
      t.media_preview AS "mediaPreview"
    FROM twishes t
    JOIN users u ON t.author_id = u.id
    ${likedJoin}
    LEFT JOIN like_counts lc ON lc.twish_id = t.id
    LEFT JOIN reply_counts rc ON rc.original_twish_id = t.id
    LEFT JOIN retwish_counts rtw ON rtw.original_twish_id = t.id
    LEFT JOIN twishes ot ON t.original_twish_id = ot.id
    LEFT JOIN users oa ON ot.author_id = oa.id
    LEFT JOIN twishes pt ON pt.id = t.parent_twish_id
    LEFT JOIN users pa ON pa.id = pt.author_id
    LEFT JOIN pictures main_pp ON main_pp.id = u.profile_picture_id
    LEFT JOIN pictures opp ON opp.id = oa.profile_picture_id
    LEFT JOIN pictures ppp ON ppp.id = pa.profile_picture_id
    LEFT JOIN twishes qt ON ot.original_twish_id = qt.id
    LEFT JOIN users qo ON qt.author_id = qo.id
    LEFT JOIN pictures qpp ON qpp.id = qo.profile_picture_id
    ${whereClause}
    ORDER BY t.created_at DESC
    ${limitClause}
  `;

  return { query, params };
};

const fetchTwishes = async (options: TwishQueryOptions) => {
  const { query, params } = buildTwishQuery(options);
  const rows = await queryRaw<TwishRow>(query, params);
  return rows.map(mapTwishRow);
};

export async function getFeedTwishes(input: GetFeedTwishes) {
  const { userId, type } = input;

  const options: TwishQueryOptions = {
    typeFilter: ["quote", "retwish", "original"],
    limit: 20,
  };

  if (type === "likes" && userId) {
    options.likedByUserId = userId;
  } else {
    if (userId) {
      options.userId = userId;
    }
    if (type === "media") {
      options.hasMedia = true;
    }
  }

  const result = await fetchTwishes(options);

  return result.map(formatTwish);
}

export const searchTwishesByContent = async (
  query: string,
  mode: "tag" | "word"
) => {
  const result = await fetchTwishes({
    typeFilter: ["quote", "retwish", "original"],
    contentSearch: { query, mode },
    limit: 20,
  });

  return result.map(formatTwish);
};

export const newTwishService = async (
  userId: string,
  input: TwishInputType
) => {
  const { content, hasMedia, mediaCount } = input;
  const id = crypto.randomUUID();

  const result = await queryRaw<{
    id: string;
    content: string;
    authorId: string;
    originalTwishId: string | null;
    parentTwishId: string | null;
    hasMedia: number;
    mediaCount: number;
    firstMediaUrl: string | null;
    mediaPreview: string | null;
    createdAt: string;
    updatedAt: string;
    type: string;
  }>(
    `
    INSERT INTO twishes (id, content, author_id, has_media, media_count)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING
      id,
      content,
      author_id AS "authorId",
      has_media AS "hasMedia",
      media_count AS "mediaCount",
      first_media_url AS "firstMediaUrl",
      media_preview AS "mediaPreview",
      created_at AS "createdAt",
      updated_at AS "updatedAt",
      type,
      original_twish_id AS "originalTwishId",
      parent_twish_id AS "parentTwishId"
    `,
    [id, content, userId, hasMedia ? 1 : 0, mediaCount]
  );

  return result[0];
};

export const likeTwishService = async (input: LikeTwishInput) => {
  const { twishId, username } = input;

  const foundUser = await queryRaw<{ id: string }>(
    `
    SELECT id
    FROM users
    WHERE username = $1
    LIMIT 1
    `,
    [username]
  );

  if (!foundUser[0]) {
    throw new Error("User not found");
  }

  const existingLike = await queryRaw<{ found: number }>(
    `
    SELECT 1 AS found
    FROM likes
    WHERE twish_id = $1
      AND user_id = $2
    LIMIT 1
    `,
    [twishId, foundUser[0].id]
  );

  if (existingLike.length > 0) {
    return await queryRaw<{
      userId: string;
      twishId: string;
      createdAt: string;
    }>(
      `
      DELETE FROM likes
      WHERE twish_id = $1
        AND user_id = $2
      RETURNING
        user_id AS "userId",
        twish_id AS "twishId",
        created_at AS "createdAt"
      `,
      [twishId, foundUser[0].id]
    );
  }

  return await queryRaw<{
    userId: string;
    twishId: string;
    createdAt: string;
  }>(
    `
    INSERT INTO likes (twish_id, user_id)
    VALUES ($1, $2)
    RETURNING
      user_id AS "userId",
      twish_id AS "twishId",
      created_at AS "createdAt"
    `,
    [twishId, foundUser[0].id]
  );
};

export const reTwishService = async (input: ReTwishInput) => {
  const {
    content,
    originalTwishId,
    parentTwishId,
    userId,
    type,
    hasMedia,
    mediaCount,
  } = input;

  const originalTwish = await queryRaw<{ id: string }>(
    `
    SELECT id
    FROM twishes
    WHERE id = $1
    LIMIT 1
    `,
    [originalTwishId]
  );

  if (originalTwish.length === 0) {
    throw new Error("Original twish not found");
  }

  const foundUser = await queryRaw<{ id: string }>(
    `
    SELECT id
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [userId]
  );

  if (foundUser.length === 0) {
    throw new Error("User not found");
  }

  const id = crypto.randomUUID();
  await queryRaw(
    `
    INSERT INTO twishes (
      id,
      content,
      author_id,
      original_twish_id,
      parent_twish_id,
      type,
      has_media,
      media_count
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
    [
      id,
      content,
      userId,
      originalTwishId,
      parentTwishId ?? null,
      type,
      hasMedia ? 1 : 0,
      mediaCount,
    ]
  );

  const [fullNewTwish] = await fetchTwishes({ twishId: id });

  return fullNewTwish;
};

export const updateTwishMediaPreviewService = async (
  input: UpdateTwishMediaPreviewInput
) => {
  const { id, mediaPreview } = input;

  await queryRaw(
    `
    UPDATE twishes
    SET media_preview = $1
    WHERE id = $2
    `,
    [mediaPreview, id]
  );

  return true;
};

export const getSingleTwish = async (twishId: string) => {
  const [result] = await fetchTwishes({ twishId });

  return formatTwish(result);
};

export const getCommentsByTwishId = async ({
  type,
  twishId,
}: GetCommentsByTwishIdInput) => {
  const options: TwishQueryOptions = {
    commentOnly: true,
  };

  if (type === "comment") {
    options.commentParentId = twishId;
  } else {
    options.commentOriginalId = twishId;
  }

  const result = await fetchTwishes(options);

  return result.map(formatTwish);
};

export const deleteTwishService = async (
  userId: string,
  input: { id: string }
) => {
  const { id } = input;

  const existingTwish = await queryRaw<{ id: string }>(
    `
    SELECT id
    FROM twishes
    WHERE id = $1
      AND author_id = $2
    LIMIT 1
    `,
    [id, userId]
  );

  if (existingTwish.length === 0) {
    throw new Error("Twish not found");
  }

  await queryRaw(
    `
    DELETE FROM twishes
    WHERE id = $1
    `,
    [id]
  );

  return { success: true };
};
