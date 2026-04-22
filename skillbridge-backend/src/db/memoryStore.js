const users = new Map();

export const saveUser = (user) => {
  users.set(user.clerk_user_id, user);
};

export const getUserByClerkId = (clerkId) => {
  return users.get(clerkId) || null;
};

export default {
  saveUser,
  getUserByClerkId,
};
