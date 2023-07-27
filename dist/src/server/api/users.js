import { userService } from "../services/userService";
import { InvalidRequestError } from "../../errors";
export function configureUserRoutes(app) {
    app.get("/api/users", async (req) => {
        const users = await userService.getPage(req.query.page);
        return { users };
    });
    app.get("/api/users/:id", async (req) => {
        if (!req.params.id)
            throw new InvalidRequestError();
        const user = await userService.getById(req.params.id);
        return { user };
    });
}
