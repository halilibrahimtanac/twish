import { authOptions } from "@/lib/authOptions";
import NextAuth from "next-auth";

const { handlers: { GET, POST } } = NextAuth(authOptions);

export { GET, POST };