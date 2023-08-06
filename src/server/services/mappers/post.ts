import { FlatPostWithMeta, PostWithMeta } from "../../../types/post"

export const FlatToNestedPostWithMeta = (data: FlatPostWithMeta[]): PostWithMeta[] => {
  return data.reduce((acc, item) => {
    if (!item.post_id) return acc
    let post = acc.find((p) => p.id === item.post_id)
    if (!post) {
      const user = data.find((u) => u.user_id === item.post_owner_id)
      post = {
        id: item.post_id,
        title: item.post_title,
        content: item.post_content,
        createdAt: new Date(item.post_created_at),
        ownerId: item.post_owner_id,
        communityId: item.post_community_id,
        deleted: item.post_deleted,
        disabled: item.post_disabled,
        user: {
          id: user?.user_id ?? "",
          name: user?.user_name ?? "",
          avatarUrl: user?.user_avatar_url ?? "",
        },
        reactions: {
          positive: item.positive_reactions,
          negative: item.negative_reactions,
        },
        userReaction: null,
        totalComments: item.total_comments?.toString(),
        media: [],
        community: {
          id: "",
          title: "",
          url_title: "",
        },
      } as PostWithMeta
      if (typeof item.user_reaction !== "undefined" && item.user_reaction !== null) {
        post.userReaction = item.user_reaction
      }
      if (item.media_id && item.media_url) {
        post.media.push({
          id: item.media_id,
          url: item.media_url,
        })
      }
      if (item.community_id && item.community_title && item.community_url_title) {
        post.community = {
          id: item.community_id,
          title: item.community_title,
          url_title: item.community_url_title,
        }
      }
      acc.push(post)
      return acc
    } else {
      if (item.media_id && item.media_url && !post.media.find((m) => m.id === item.media_id)) {
        post.media.push({
          id: item.media_id,
          url: item.media_url,
        })
      }
      if (item.community_id && item.community_title && item.community_url_title) {
        post.community = {
          id: item.community_id,
          title: item.community_title,
          url_title: item.community_url_title,
        }
      }
    }
    return acc
  }, [] as PostWithMeta[])
}
