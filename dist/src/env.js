import dotenv from "dotenv";
dotenv.config();
export const env = {
    db: {
        host: process.env.DB_HOST,
        name: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    },
    port: process.env.PORT || "3000",
    url: process.env.URL || "http://localhost:3000",
    domain: process.env.DOMAIN || "localhost",
    auth0: {
        google: {
            clientId: process.env.GOOGLE_AUTH0_CLIENT_ID,
            clientSecret: process.env.GOOGLE_AUTH0_CLIENT_SECRET,
        },
        github: {
            clientId: process.env.GITHUB_AUTH0_CLIENT_ID,
            clientSecret: process.env.GITHUB_AUTH0_CLIENT_SECRET,
        },
    },
};
// recursively ensure that all keys in the object are defined
function ensureKeys(obj) {
    for (const key in obj) {
        if (typeof obj[key] === "object") {
            ensureKeys(obj[key]);
        }
        else if (obj[key] === undefined) {
            throw new Error(`Missing environment variable: ${key}`);
        }
    }
    return obj;
}
ensureKeys(env);
