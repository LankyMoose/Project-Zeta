export const getUsers = async (page = 0) => {
    const res = await fetch(`/api/users?page=${page}`);
    if (!res.ok)
        throw new Error("Failed to fetch users");
    return await res.json();
};
export const getUser = async (id) => {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok)
        throw new Error("Failed to fetch user");
    return await res.json();
};
