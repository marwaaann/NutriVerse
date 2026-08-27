import { useQuery } from "@tanstack/react-query";
import { getMe } from "../services/authMe";

export const useAuth = () => {
  return useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    retry: false,
    staleTime: 5 * 60 * 1000
  });
};