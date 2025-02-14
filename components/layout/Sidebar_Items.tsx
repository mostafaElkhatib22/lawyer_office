import Link from "next/link";
import React from "react";
interface SidebarItems {
  lable: string;
  href: string;
  icons: React.ReactNode;
}
const Sidebar_Items: React.FC<SidebarItems> = ({ lable, href ,icons}) => {
  return (
    <li className="py-2 text-sm font-bold">
      <Link href={href} className="p-2 flex gap-2 justify-center items-center">
        {lable}
      {icons}
      </Link>
    </li>
  );
};

export default Sidebar_Items;
