declare interface AuthUser {
  id: string;
  email: string | null;
}

declare type AuthChangeHandler = (currentUser: AuthUser | null) => void;

declare type LocalGameHandler = () => void;
