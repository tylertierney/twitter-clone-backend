SELECT
  date,
  posts.text,
  author,
  username,
  name,
  profile_pic,
  posts.id AS id,
  posts.photo_url,
  posts.replying_to,
  COALESCE(
    ARRAY_AGG(DISTINCT tags.text) FILTER (
      WHERE
        tags.text IS NOT NULL
    ),
    '{}'
  ) tags,
  COALESCE(
    ARRAY_AGG(DISTINCT likes.user_id) FILTER (
      WHERE
        likes.user_id IS NOT NULL
    ),
    '{}'
  ) likes,
  COALESCE(reply_counts.replies_count, 0) AS reply_count
FROM
  posts
  JOIN users ON users.id = posts.author
  LEFT JOIN tags ON posts.id = tags.post_id
  LEFT JOIN likes ON posts.id = likes.post_id
  LEFT JOIN (
    SELECT
      replying_to,
      COUNT(*) :: int as replies_count
    FROM
      posts
    GROUP BY
      posts.id
  ) reply_counts ON posts.id = reply_counts.replying_to
GROUP BY
  posts.id,
  users.id,
  reply_count
ORDER BY
  date DESC;