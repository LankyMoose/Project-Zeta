export var JoinResultType;
(function (JoinResultType) {
    JoinResultType[JoinResultType["Success"] = 0] = "Success";
    JoinResultType[JoinResultType["Pending"] = 1] = "Pending";
    JoinResultType[JoinResultType["AlreadyJoined"] = 2] = "AlreadyJoined";
    JoinResultType[JoinResultType["Error"] = 3] = "Error";
})(JoinResultType || (JoinResultType = {}));
