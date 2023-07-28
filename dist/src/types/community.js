export var JoinResultType;
(function (JoinResultType) {
    JoinResultType[JoinResultType["Success"] = 0] = "Success";
    JoinResultType[JoinResultType["Pending"] = 1] = "Pending";
    JoinResultType[JoinResultType["AlreadyJoined"] = 2] = "AlreadyJoined";
    JoinResultType[JoinResultType["Error"] = 3] = "Error";
    JoinResultType[JoinResultType["Banned"] = 4] = "Banned";
})(JoinResultType || (JoinResultType = {}));
export var LeaveResultType;
(function (LeaveResultType) {
    LeaveResultType[LeaveResultType["Success"] = 0] = "Success";
    LeaveResultType[LeaveResultType["NotAMember"] = 1] = "NotAMember";
    LeaveResultType[LeaveResultType["Error"] = 2] = "Error";
})(LeaveResultType || (LeaveResultType = {}));
export var DeleteResultType;
(function (DeleteResultType) {
    DeleteResultType[DeleteResultType["Success"] = 0] = "Success";
    DeleteResultType[DeleteResultType["Error"] = 1] = "Error";
})(DeleteResultType || (DeleteResultType = {}));
export var OwnershipTransferResultType;
(function (OwnershipTransferResultType) {
    OwnershipTransferResultType[OwnershipTransferResultType["Success"] = 0] = "Success";
    OwnershipTransferResultType[OwnershipTransferResultType["Error"] = 1] = "Error";
})(OwnershipTransferResultType || (OwnershipTransferResultType = {}));
