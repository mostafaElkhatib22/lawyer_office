"use client";
import Link from "next/link";
import React, { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { usePathname, useRouter } from "next/navigation";
import Sidebar_Items from "./Sidebar_Items";
import { MdOutlineDashboardCustomize } from "react-icons/md";
import { ImHammer2 } from "react-icons/im";
import { RiCustomerService2Line } from "react-icons/ri";
import { SiSession } from "react-icons/si";
import { FaBalanceScale } from "react-icons/fa";
import { IoMdPersonAdd } from "react-icons/io";
import { Button } from "../ui/button";
import { FiAlignLeft } from "react-icons/fi";
import LogoutButton from "./Logout";
import { useSession } from "next-auth/react";

function Navbar() {
  const { isDarkMode } = useTheme();
  const { data: session, status } = useSession();
  console.log(session?.user?.name);
  const router = useRouter();
  const currentPath = usePathname();
  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(false);

  const [searchTerm, setSearchTerm] = useState("");

  const toggleSidebar = (): void => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleSearch = () => {
    if (searchTerm.trim() === "") return;
    router.push(`/search?query=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <header className="flex flex-col justify-between w-full items-center rounded-l-lg rounded-r-lg z-[1000] shadow-md shadow-black no-print bg-gradient-to-r from-[#f2709c]  to-[#ff9472] mb-1">
      <div className="flex justify-between items-center gap-[3rem] md:gap-[30rem] lg:gap-[40rem] w-full">
        <Link href={"/"} className="rounded-full w-full">
          <img
            src="https://res.cloudinary.com/dbtbxt0fj/image/upload/v1739993862/lawyer_office/appecsgy6emn6pre5gbp.png"
            alt="logo"
            className="w-[200px] h-[80px] rounded-full"
            loading="lazy"
          />
        </Link>
        <div className="m-2">
          <Button variant={"destructive"} size={"icon"} onClick={toggleSidebar}>
            <FiAlignLeft className="scale-[1.5]" />
          </Button>
        </div>
      </div>
      <nav
        className={`${
          isSidebarVisible
            ? "flex flex-col gap-10 md:flex lg:flex lg:justify-between lg:items-center lg:gap-[50px] lg:flex-row mb-1"
            : "hidden"
        }`}
      >
        <ul
          className={
            currentPath === "/home"
              ? "bg-gradient-to-r from-[#3a7bd5] to-[#00d2ff] text-white rounded-md flex justify-center items-center"
              :"flex justify-center items-center hover:bg-gradient-to-r from-[#3a7bd5] to-[#00d2ff] hover:text-white hover:rounded-md transition-all duration-100 "
          }
        >
          <Sidebar_Items
            lable="الرئيسية"
            href="/home"
            icons={<MdOutlineDashboardCustomize size={20} />}
          />
        </ul>
        <ul
          className={
            currentPath === "/cases/all-cases"
              ? "bg-gradient-to-r from-[#3a7bd5] to-[#00d2ff] text-white rounded-md flex justify-center items-center"
              : "flex justify-center items-center hover:bg-gradient-to-r from-[#3a7bd5] to-[#00d2ff] hover:text-white hover:rounded-md transition-all duration-100 "
          }
        >
          <Sidebar_Items
            lable="الدعاوى"
            href="/cases/all-cases"
            icons={<FaBalanceScale size={20} />}
          />
        </ul>
        <ul
          className={
            currentPath === "/client/add"
              ? "bg-gradient-to-r from-[#3a7bd5] to-[#00d2ff] text-white rounded-md flex justify-center items-center"
              : "flex justify-center items-center hover:bg-gradient-to-r from-[#3a7bd5] to-[#00d2ff] hover:text-white hover:rounded-md transition-all duration-100 "
          }
        >
          <Sidebar_Items
            lable="اضافة موكل"
            href="/client/add"
            icons={<IoMdPersonAdd size={20} />}
          />
        </ul>
        <ul
          className={
            currentPath === "/cases/add-case"
              ? "bg-gradient-to-r from-[#3a7bd5] to-[#00d2ff] text-white rounded-md flex justify-center items-center"
              : "flex justify-center items-center hover:bg-gradient-to-r from-[#3a7bd5] to-[#00d2ff] hover:text-white hover:rounded-md transition-all duration-100 "
          }
        >
          <Sidebar_Items
            lable="اضافة دعوى"
            href="/cases/add-case"
            icons={<ImHammer2 size={20} />}
          />
        </ul>
        <ul
          className={
            currentPath === "/client"
              ? "bg-gradient-to-r from-[#3a7bd5] to-[#00d2ff] text-white rounded-md flex justify-center items-center "
              : "flex justify-center items-center hover:bg-gradient-to-r from-[#3a7bd5] to-[#00d2ff] hover:text-white hover:rounded-md transition-all duration-100 "
          }
        >
          <Sidebar_Items
            lable="الموكلين"
            href="/client"
            icons={<RiCustomerService2Line size={25} />}
          />
        </ul>
        <ul
          className={
            currentPath === "/sessions"
              ? "bg-gradient-to-r from-[#3a7bd5] to-[#00d2ff] text-white rounded-md flex justify-center items-center"
              : "flex justify-center items-center hover:bg-gradient-to-r from-[#3a7bd5] to-[#00d2ff] hover:text-white hover:rounded-md transition-all duration-100 "
          }
        >
          <Sidebar_Items
            lable="الجلسات"
            href="/sessions"
            icons={<SiSession size={20} />}
          />
        </ul>
        {status === "authenticated" ? <LogoutButton /> : ""}
        {status === "authenticated"
          ? `Hello, ${session?.user?.email?.trim()}`
          : ""}
      </nav>
    </header>
  );
}

export default Navbar;
