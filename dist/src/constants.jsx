export const API_URL = "/api";
export var API_ERROR;
(function (API_ERROR) {
    API_ERROR["NOT_FOUND"] = "Not found";
    API_ERROR["NOT_AUTHENTICATED"] = "Unauthenticated";
    API_ERROR["UNAUTHORIZED"] = "Unauthorized";
    API_ERROR["FORBIDDEN"] = "Forbidden";
    API_ERROR["DISABLED"] = "Disabled";
    API_ERROR["INVALID_REQUEST"] = "Invalid";
    API_ERROR["SERVER_ERROR"] = "Server error";
    API_ERROR["COMMUNITY_NAME_NOT_AVAILABLE"] = "Community name not available";
})(API_ERROR || (API_ERROR = {}));
