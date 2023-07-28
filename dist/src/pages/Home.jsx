import * as Cinnabun from "cinnabun";
import { getLatestPostsFromMyCommunities } from "../client/actions/me";
import { getLatestPostsFromPublicCommunities } from "../client/actions/communities";
import { isAuthenticated, pathStore, selectedCommunity, userStore } from "../state";
import { DefaultLoader } from "../components/loaders/Default";
import { AuthorTag } from "../components/AuthorTag";
import { Link } from "cinnabun/router";
const PostCard = ({ post, community, user }) => {
    console.log(post, community, user);
    return (<div className="card" key={post.id}>
      <div className="card-title flex justify-content-between">
        {post.title}
        <Link onBeforeNavigate={() => {
            selectedCommunity.value = { ...(selectedCommunity.value ?? {}), ...community };
            return true;
        }} store={pathStore} to={`/communities/${community.url_title}`} className="text-primary">
          {community.title}
        </Link>
      </div>
      <div className="card-body">{post.content}</div>
      <div className="flex justify-content-between">
        <div></div>
        <div className="flex flex-column align-items-end">
          <AuthorTag user={user} date={post.createdAt.toString()}/>
        </div>
      </div>
    </div>);
};
const PostList = ({ promiseFn, }) => {
    return (<Cinnabun.Suspense promise={promiseFn} cache>
      {(loading, data) => {
            if (loading)
                return <DefaultLoader />;
            if (!data)
                return <></>;
            return <Cinnabun.For each={data} template={(item) => <PostCard {...item}/>}/>;
        }}
    </Cinnabun.Suspense>);
};
export default function Home() {
    return (<>
      <div className="flex gap flex-wrap">
        <section watch={userStore} bind:visible={isAuthenticated}>
          <div className="section-header">
            <h2>Latest from your communities</h2>
          </div>
          <PostList promiseFn={getLatestPostsFromMyCommunities}/>
        </section>
        <section>
          <div className="section-header">
            <h2>Latest from public communities</h2>
          </div>
          <PostList promiseFn={getLatestPostsFromPublicCommunities}/>
        </section>
      </div>
    </>);
}
