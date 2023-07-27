import * as Cinnabun from "cinnabun";
export default function Communities({ params, }) {
    return (<>
      <h2>
        Community {params?.communityId} - Post {params?.postId}
      </h2>
    </>);
}
