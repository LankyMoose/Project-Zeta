import * as Cinnabun from "cinnabun"

export default function Communities({
  params,
}: {
  params?: { url_title?: string; postId?: string }
}) {
  console.log(params)
  return (
    <>
      <h2>
        Community {params?.url_title} - Post {params?.postId}
      </h2>
    </>
  )
}
