import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import fastify from "fastify";
import cookie from "@fastify/cookie";
import compress from "@fastify/compress";
import fStatic from "@fastify/static";
import websocket from "@fastify/websocket";
import oauthPlugin from "@fastify/oauth2";
import { SSR } from "cinnabun/ssr";
import { Cinnabun } from "cinnabun";
import { log } from "../../.cb/logger.js";
import { Document } from "../Document.jsx";
import { App } from "../App";
import { env } from "../env.js";
import { authService } from "./services/authService.js";
import { userService } from "./services/userService.js";
import { socketHandler } from "./socket.js";
import { generateUUID } from "../utils.js";
import { configureCommunityRoutes } from "./api/communities.js";
import { configurePostsRoutes } from "./api/posts.js";
import { configureUserRoutes } from "./api/users.js";
import { InvalidRequestError, ServerError } from "../errors.jsx";
import { AuthProvider } from "../types/auth.js";
const _fetch = globalThis.fetch ?? fetch;
globalThis.fetch = async (input, init) => {
    try {
        if (typeof input === "string" && input.startsWith("/")) {
            input = `${env.url}${input}`;
        }
        return await _fetch(input, init);
    }
    catch (error) {
        console.error(error);
        throw error;
    }
};
const isDev = process.env.NODE_ENV === "development";
const app = fastify();
app.register(cookie);
const cookieSettings = {
    domain: env.domain || "localhost",
    path: "/",
    sameSite: "lax",
    secure: !isDev,
};
app.register(compress, { global: false });
app.register(fStatic, {
    prefix: "/static/",
    root: path.join(path.dirname(fileURLToPath(import.meta.url)), "../../dist/static"),
});
app.register(websocket, {
    options: { maxPayload: 1024 },
});
app.addHook("onRequest", async (req, res) => {
    if (!req.cookies["user_anon_id"]) {
        res.setCookie("user_anon_id", generateUUID(), {
            domain: env.domain,
            path: "/",
            sameSite: "lax",
            httpOnly: true,
            secure: !isDev,
        });
    }
});
app.register(async function () {
    app.route({
        method: "GET",
        url: "/ws",
        handler: (_, res) => res.status(400).send(),
        wsHandler: socketHandler,
    });
});
app.register(oauthPlugin, {
    name: "googleOAuth2",
    credentials: {
        client: {
            id: env.auth0.google.clientId,
            secret: env.auth0.google.clientSecret,
        },
        auth: oauthPlugin.GOOGLE_CONFIGURATION,
    },
    scope: ["profile", "email", "openid"],
    startRedirectPath: "/login/google",
    callbackUri: `${env.url}/login/google/callback`,
});
app.register(oauthPlugin, {
    name: "githubOAuth2",
    credentials: {
        client: {
            id: env.auth0.github.clientId,
            secret: env.auth0.github.clientSecret,
        },
        auth: oauthPlugin.GITHUB_CONFIGURATION,
    },
    scope: [],
    startRedirectPath: "/login/github",
    callbackUri: `${env.url}/login/github/callback`,
});
app.setErrorHandler(function (error, _, reply) {
    // Log error
    this.log.error(error);
    // Send error response
    reply.status(error.statusCode ?? 500).send({ message: error.message ?? "Internal Server Error" });
});
const loadUserInfo = async (provider, reqOrToken) => {
    const tkn = typeof reqOrToken === "string" ? reqOrToken : reqOrToken.cookies["access_token"];
    if (!tkn)
        return null;
    switch (provider) {
        case AuthProvider.Google: {
            const userDataRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
                method: "GET",
                headers: {
                    Authorization: "Bearer " + tkn,
                },
            });
            if (!userDataRes.ok)
                throw new ServerError("Failed to load user data");
            return userDataRes.json();
        }
        case AuthProvider.Github: {
            const userDataRes = await fetch("https://api.github.com/user", {
                method: "GET",
                headers: {
                    Authorization: "Bearer " + tkn,
                },
            });
            if (!userDataRes.ok)
                throw new ServerError("Failed to load user data");
            return userDataRes.json();
        }
        default:
            throw new ServerError("Invalid provider");
    }
};
app.get("/login/:provider/callback", async function (request, reply) {
    const { provider } = request.params;
    if (!provider)
        throw new InvalidRequestError("Missing provider");
    let access_token;
    switch (provider) {
        case AuthProvider.Google: {
            const res = await app.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
            access_token = res.token.access_token;
            break;
        }
        case AuthProvider.Github: {
            const res = await app.githubOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
            access_token = res.token.access_token;
            break;
        }
        default:
            throw new ServerError("Invalid provider");
    }
    const userInfo = (await loadUserInfo(provider, access_token));
    if (!userInfo)
        throw new ServerError("Failed to load user data");
    const { userId, name, picture } = await handleProviderLogin(provider, userInfo);
    if (!userId)
        throw new ServerError();
    reply.setCookie("user", JSON.stringify({ userId, name, picture }), {
        ...cookieSettings,
        httpOnly: false,
    });
    reply.setCookie("user_id", userId, {
        ...cookieSettings,
        httpOnly: true,
    });
    // if later you need to refresh the token you can use
    // const { token: newToken } = await this.getNewAccessTokenUsingRefreshToken(token)
    reply.setCookie("access_token", access_token, {
        ...cookieSettings,
        httpOnly: true,
    });
    reply.redirect("/");
});
async function handleProviderLogin(provider, info) {
    const userAuth = await authService.getByProviderId(provider, info.id);
    switch (provider) {
        case AuthProvider.Google: {
            const { name, picture, id, email } = info;
            const userId = await saveUser(provider, userAuth, name, picture, id, email);
            return { userId, name, picture };
        }
        case AuthProvider.Github: {
            const { login, avatar_url, id, email } = info;
            const userId = await saveUser(provider, userAuth, login, avatar_url, id, email);
            return { userId, name: login, picture: avatar_url };
        }
        default:
            throw new ServerError("Invalid provider");
    }
}
async function saveUser(provider, auth, name, picture, id, email) {
    const user = await userService.save({
        id: auth?.userId,
        name,
        avatarUrl: picture,
    });
    if (!user)
        throw new ServerError();
    if (!auth) {
        const res = await authService.save({
            email,
            provider,
            providerId: id,
            userId: user.id,
        });
        if (!res)
            throw new ServerError();
    }
    return user.id;
}
function clearAuthCookies(reply) {
    reply.clearCookie("user", {
        ...cookieSettings,
        httpOnly: false,
    });
    reply.clearCookie("user_id", {
        ...cookieSettings,
        httpOnly: true,
    });
    reply.clearCookie("access_token", {
        ...cookieSettings,
        httpOnly: true,
    });
}
app.get("/logout", async function (_, reply) {
    clearAuthCookies(reply);
    reply.redirect("/");
});
app.get("/favicon.ico", (_, res) => {
    res.status(404).send();
});
if (isDev)
    await import("../../.cb/sse").then(({ configureSSE }) => configureSSE(app));
configureUserRoutes(app);
configureCommunityRoutes(app);
configurePostsRoutes(app);
app.get("/*", async (req, res) => {
    const reqUser = req.cookies["user"];
    const reqUserId = req.cookies["user_id"];
    const cinnabunInstance = new Cinnabun();
    cinnabunInstance.setServerRequestData({
        path: req.url,
        data: {
            user: reqUser ? JSON.parse(reqUser) : null,
            userId: reqUserId ?? null,
        },
    });
    res.raw.writeHead(200, {
        "Transfer-Encoding": "chunked",
        "Content-Type": "text/html",
    });
    res.raw.write("<!DOCTYPE html><html>");
    await SSR.serverBake(Document(App), {
        cinnabunInstance,
        stream: res.raw,
    });
    res.raw.end("</html>");
});
app.listen({ port: parseInt(env.port), host: "0.0.0.0" }, async (err) => {
    if (err) {
        app.log.error(err);
        process.exit(1);
    }
    log("FgGreen", `
Server is running at ${env.url}`);
    if (isDev) {
        try {
            log("Dim", "  evaluating application... 🔍");
            await SSR.serverBake(Document(App), {
                cinnabunInstance: new Cinnabun(),
                stream: null,
            });
            log("Dim", "  good to go! ✅");
        }
        catch (error) {
            if ("message" in error) {
                const err = error;
                log("FgRed", `
Failed to evaluate application.
${err.stack}
`);
                process.exit(96);
            }
        }
    }
});
