import { addNotification } from "../../components/Notifications";
import { API_URL } from "../../constants";
export const getCommunitySearch = async (title) => {
    try {
        const response = await fetch(`${API_URL}/communities/search?title=${title}`);
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
export const getCommunities = async (page = 0) => {
    try {
        const response = await fetch(`${API_URL}/communities?page=${page}`);
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
export const getCommunity = async (id) => {
    try {
        const response = await fetch(`${API_URL}/communities/${id}`);
        return await response.json();
    }
    catch (error) {
        return new Error(error.message);
    }
};
export const createCommunity = async (community) => {
    try {
        const response = await fetch(`${API_URL}/communities`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(community),
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
export const updateCommunity = async (community) => {
    try {
        const response = await fetch(`${API_URL}/communities/${community.id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(community),
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
export const joinCommunity = async (id) => {
    try {
        const response = await fetch(`${API_URL}/communities/${id}/join`, {
            method: "POST",
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
