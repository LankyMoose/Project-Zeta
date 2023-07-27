import { communityService } from "../services/communityService";
import { communityValidation } from "../../db/validation";
import { ApiError, InvalidRequestError, NotAuthenticatedError, NotFoundError, ServerError, } from "../../errors";
import { JoinResultType } from "../../types/community";
export function configureCommunityRoutes(app) {
    app.get("/api/communities", async (req) => {
        const res = await communityService.getPage(req.query.page);
        if (!res)
            throw new ServerError();
        return res;
    });
    app.get("/api/communities/search", async (req) => {
        if (!req.query.title)
            throw new InvalidRequestError();
        const res = await communityService.fuzzySearchCommunity(req.query.title);
        if (!res)
            throw new ServerError();
        return res;
    });
    app.get("/api/communities/:id", async (req) => {
        if (!req.params.id)
            throw new InvalidRequestError();
        const res = await communityService.getCommunity(req.params.id);
        if (!res)
            throw new NotFoundError();
        let member;
        if (req.cookies.user) {
            const user = JSON.parse(req.cookies.user);
            member = await communityService.getCommunityMember(res.id, user.userId);
        }
        if (!res.private)
            return { ...res, memberType: member?.memberType ?? "guest" };
        if (!member)
            return {
                private: true,
                id: res.id,
                title: res.title,
                description: res.description,
            };
        return { ...res, memberType: member.memberType };
    });
    app.post("/api/communities/:id/join", async (req) => {
        if (!req.params.id)
            throw new InvalidRequestError();
        const community = await communityService.getCommunity(req.params.id);
        if (!community)
            throw new NotFoundError();
        if (!req.cookies.user_id) {
            // TODO: redirect to oauth login, add state param for action + communityId
            console.log("redirect to oauth login");
            return new NotAuthenticatedError();
        }
        const member = await communityService.getCommunityMember(community.id, req.cookies.user_id);
        if (member)
            return { type: JoinResultType.AlreadyJoined };
        const res = await communityService.joinCommunity(community.id, req.cookies.user_id);
        if (res instanceof ApiError)
            throw res;
        if (!res)
            throw new ServerError("Failed to join community");
        return res;
    });
    app.post("/api/communities", async (req) => {
        if (!req.cookies.user_id)
            throw new NotAuthenticatedError();
        const { title, description } = req.body;
        const userId = req.cookies.user_id;
        if (!communityValidation.isCommunityValid(title, description))
            throw new InvalidRequestError();
        if (req.body.url_title)
            delete req.body.url_title;
        const res = await communityService.createCommunity({
            title,
            description,
        }, userId);
        if (res instanceof ApiError)
            throw res;
        if (!res)
            throw new ServerError("Failed to create community");
        return res;
    });
    app.patch("/api/communities/:id", async (req) => {
        if (!req.cookies.user_id)
            throw new NotAuthenticatedError();
        if (!req.params.id)
            throw new InvalidRequestError();
        if (req.body.url_title)
            delete req.body.url_title;
        const communityId = req.params.id;
        const userId = req.cookies.user_id;
        const { title, description, private: _private } = req.body;
        if (!communityValidation.isCommunityValid(title, description))
            throw new InvalidRequestError();
        const member = await communityService.getCommunityMember(communityId, userId);
        if (!member || member.memberType !== "owner")
            throw new NotAuthenticatedError();
        const res = await communityService.updateCommunity({
            title,
            description,
            private: _private,
        }, communityId);
        if (res instanceof ApiError)
            throw res;
        if (!res)
            throw new ServerError("Failed to update community");
        return res;
    });
}
