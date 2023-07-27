import { addNotification } from "../../components/Notifications";
import { API_URL } from "../../constants";
export const getPost = async (postId) => {
    try {
        const response = await fetch(`${API_URL}/posts/${postId}`);
        const data = await response.json();
        if (!response.ok)
            throw new Error(data?.message ?? response.statusText);
        return data;
    }
    catch (error) {
        addNotification({
            type: "error",
            text: error.message,
        });
    }
};
export const addPostComment = async (postId, comment) => {
    try {
        const response = await fetch(`${API_URL}/posts/${postId}/comments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ comment }),
        });
        const data = await response.json();
        if (!response.ok)
            throw new Error(data?.message ?? response.statusText);
        return data;
    }
    catch (error) {
        addNotification({
            type: "error",
            text: error.message,
        });
    }
};
export const addPostReaction = async (postId, reaction) => {
    try {
        const response = await fetch(`${API_URL}/posts/${postId}/reactions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ reaction }),
        });
        const data = await response.json();
        if (!response.ok)
            throw new Error(data?.message ?? response.statusText);
        return data;
    }
    catch (error) {
        addNotification({
            type: "error",
            text: error.message,
        });
    }
};
export const addPost = async (post) => {
    try {
        const response = await fetch(`${API_URL}/posts`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(post),
        });
        const data = await response.json();
        if (!response.ok)
            throw new Error(data?.message ?? response.statusText);
        return data;
    }
    catch (error) {
        console.error(error);
        addNotification({
            type: "error",
            text: error.message,
        });
    }
};
export const getPosts = async (communityId, offset) => {
    try {
        const response = await fetch(`${API_URL}/posts?communityId=${communityId}&offset=${offset}`);
        const data = await response.json();
        if (!response.ok)
            throw new Error(data?.message ?? response.statusText);
        return data;
    }
    catch (error) {
        addNotification({
            type: "error",
            text: error.message,
        });
    }
};
