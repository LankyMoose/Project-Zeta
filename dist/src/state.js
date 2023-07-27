import { Cinnabun, createSignal } from "cinnabun";
const isClient = Cinnabun.isClient;
export const pathStore = createSignal(isClient ? window.location.pathname : "/");
const decodeCookie = (str) => str
    .split(";")
    .map((v) => v.split("="))
    .reduce((acc, v) => {
    acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());
    return acc;
}, {});
const getUserDataFromCookie = () => {
    if (!window.document.cookie)
        return null;
    const { user } = decodeCookie(window.document.cookie);
    if (!user)
        return null;
    const parsed = JSON.parse(user);
    return parsed ?? null;
};
export const userStore = createSignal(isClient ? getUserDataFromCookie() : null);
export const getUser = (self) => self.useRequestData("data.user", userStore.value);
export const isAuthenticated = (self) => !!getUser(self);
export const isNotAuthenticated = (self) => !getUser(self);
export const isCommunityMember = () => {
    if (!selectedCommunity.value)
        return true;
    return selectedCommunity.value.memberType !== "guest";
};
export const authModalOpen = createSignal(false);
export const authModalState = createSignal({
    title: "",
    message: "",
    callbackAction: undefined,
});
export const postCreatorModalOpen = createSignal(false);
export const communityCreatorModalOpen = createSignal(false);
export const communityEditorModalOpen = createSignal(false);
export const communityJoinModalOpen = createSignal(false);
export const selectedCommunity = createSignal(null);
export const selectedCommunityPost = createSignal(null);
export const sidebarOpen = createSignal(false);
export const userDropdownOpen = createSignal(false);
export const communityRole = () => {
    if (!selectedCommunity.value)
        return null;
    return selectedCommunity.value.memberType;
};
export const isCommunityOwner = () => {
    return selectedCommunity.value?.memberType === "owner";
};
