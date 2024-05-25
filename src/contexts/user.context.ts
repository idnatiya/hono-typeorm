/**
 * User context module
 *
 * This module provides functions to manage the current user context.
 * The current user context is stored in the global variable currentUser.
 *
 * The module exports the following functions:
 * - setUser: Sets the current user context
 * - getUser: Gets the current user context
 * - clearUser: Clears the current user context
 *
 * @module user.context
 */

import { User } from "../models";

let currentUser: User = null;

/**
 * Sets the current user context
 *
 * @param {User} user - The user object to set as the current user context
 */
const setUser = (user: User) => {
  currentUser = user;
};

/**
 * Gets the current user context
 *
 * @returns {User | null} - The current user context or null if not set
 */
const getUser = () => {
  return currentUser;
};

/**
 * Clears the current user context
 */
const clearUser = (user: User) => {
  currentUser = null;
};

export { setUser, getUser, clearUser };
