import { customAlphabet } from "nanoid";

// Create a URL-safe token generator
// Using custom alphabet without ambiguous characters (0, O, l, 1, I)
const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";

export const generateShareToken = customAlphabet(alphabet, 12);
