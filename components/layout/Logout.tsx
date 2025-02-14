import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import React from "react";
import { Button } from "../ui/button";

const LogoutButton = () => {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <Button
      onClick={handleSignOut}
      variant={"link"}
    >
      Sign out
    </Button>
  );
};

export default LogoutButton;
