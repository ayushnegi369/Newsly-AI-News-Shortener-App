import useAuthGuard from '../hooks/useAuthGuard';

export default function AuthorProfile() {
  useAuthGuard();
}
