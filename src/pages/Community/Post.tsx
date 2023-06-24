import * as Cinnabun from "cinnabun"

export default function Communities({
  params,
}: {
  params?: { communityId?: string; postId?: string }
}) {
  return (
    <>
      <h2>
        Community {params?.communityId} - Post {params?.postId}
      </h2>
    </>
  )
}
