import * as Cinnabun from "cinnabun";
import { For } from "cinnabun";
import { PostCard } from "./PostCard";
export const CommunityPosts = ({ posts }) => {
    return (<div className="flex flex-column">
      {posts.length ? (<div className="flex flex-column">
          <For each={posts} template={(post) => <PostCard post={post}/>}/>
        </div>) : (<div>
          <i className="text-muted">No posts yet 😢</i>
        </div>)}
    </div>);
};
