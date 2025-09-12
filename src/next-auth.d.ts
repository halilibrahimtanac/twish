import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username: string;
      bio: string | null;
      profilePictureUrl: string | null;
      backgroundPictureUrl: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    username: string;
    bio: string | null;
    profilePictureUrl: string | null;
    backgroundPictureUrl: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: string;
    bio: string | null;
    profilePictureUrl: string | null;
    backgroundPictureUrl: string | null;
  }
}