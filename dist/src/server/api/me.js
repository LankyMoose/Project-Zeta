import { NotAuthenticatedError, ServerError } from "../../errors";
import { communityService } from "../services/communityService";
export function configureMeRoutes(app) {
    app.get("/api/me/from-my-communities", async (req) => {
        if (!req.cookies.user_id)
            throw new NotAuthenticatedError();
        const res = await communityService.getLatestPostsFromUserCommunities(req.cookies.user_id, req.query.page);
        if (!res)
            throw new ServerError();
        return res;
    });
}
