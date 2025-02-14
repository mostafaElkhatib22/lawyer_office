"use client";
import { useTheme } from "@/context/ThemeContext";
import React from "react";
import { Button } from "../ui/button";
import { LuSun } from "react-icons/lu";
import { IoMoonOutline } from "react-icons/io5";

function ModeToggle({ isVisible }: { isVisible: boolean }) {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return isDarkMode === false ? (
    <Button
      size={"icon"}
      variant={"transpernt"}
      onClick={toggleDarkMode}
    >
      <LuSun />
    </Button>
  ) : (
    <Button
      size={"icon"}
      variant={"transpernt"}
      onClick={toggleDarkMode}
      className="border-2 border-white"
    >
      <IoMoonOutline />
    </Button>
  );
}

export default ModeToggle;
