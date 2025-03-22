"use client";
import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FaEye, FaTrash } from "react-icons/fa";
import { FaPenToSquare } from "react-icons/fa6";
import Link from "next/link";
import axios from "axios";
import RemoveItem from "@/components/layout/RemoveCase";

interface Case {
  _id: string;
  caseTypeOF: string;
  type: string;
  court: string;
  caseNumber: number;
  sessiondate: string;
  decision: string;
  year: number;
  attorneyNumber: string;
  caseDate: string;
  opponents: string[];
  nots: string;
  files: string[];
  client: { _id: string; name: string };
}

function All_Cases() {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchCases = async () => {
    try {
      const res = await axios.get(`/api/cases?searchQuery=${searchQuery}`);
      setCases(res.data.data);
    } catch (error) {
      console.error("Error fetching cases:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [searchQuery]);

  if (isLoading) {
    return <div>loading....</div>;
  }

  const handleDelete = () => {
    fetchCases(); // إعادة جلب القضايا بعد الحذف
  };

  return (
    <div>
      <div className="m-2">

            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={
               "w-[150px] border-2 border-violet-400 md:w-[300px] lg:w-[400px] rounded-lg outline-none h-[40px] p-3"
              }
              placeholder="ابحث عن موكل أو قضية"
            />
          
      </div>

      <Table className="text-center text-black">
        <TableCaption className="text-black">اجمالي عدد القضايا ({cases.length})</TableCaption>
        <TableHeader className="text-lg">
          <TableRow >
            <TableHead className="text-center text-black">رقم الدعوى</TableHead>
            <TableHead className="text-center text-black">اسم الموكل</TableHead>
            <TableHead className="text-center text-black">اسم الخصم</TableHead>
            <TableHead className="text-center text-black">تاريخ الدعوى</TableHead>
            <TableHead className="text-center text-black">تاريخ الجلسة</TableHead>
            <TableHead className="text-center text-black">نوع الدعوى</TableHead>
            <TableHead className="text-center text-black">طبيعة الدعوى</TableHead>
            <TableHead className="text-center text-black">رقم التوكيل</TableHead>
            <TableHead className="text-center text-black">المحكمة</TableHead>
            <TableHead className="text-center text-black">قرار الجلسة</TableHead>
            <TableHead className="text-center text-black">ملاحظات</TableHead>
            <TableHead className="text-center text-black">تعديل او حذف</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cases.map((item, index) => {
            return (
              <TableRow key={index}>
                <TableCell>{item.caseNumber}</TableCell>
                <TableCell>{item?.client?.name}</TableCell>
                <TableCell>{item?.opponents.join(",")}</TableCell>
                <TableCell>
                  {new Date(item.caseDate).toLocaleDateString() || ""}
                </TableCell>
                <TableCell>
                  {new Date(item.sessiondate || "").toLocaleDateString() || ""}
                </TableCell>
                <TableCell>{item.caseTypeOF}</TableCell>
                <TableCell>{item.type}</TableCell>
                <TableCell>{item.attorneyNumber}</TableCell>
                <TableCell>{item.court}</TableCell>
                <TableCell>{item.decision}</TableCell>
                <TableCell>{item.nots}</TableCell>
                <TableCell className="flex justify-center items-center gap-4">
                  <Link href={`/cases/editcase/${item._id}`}>
                    <Button type="button" className="bg-blue-500 hover:bg-blue-700">
                      <FaPenToSquare />
                    </Button>
                  </Link>
                  <Link href={`/cases/singleCase/${item._id}`}>
                    <Button type="button" className="bg-violet-500 hover:bg-violet-700">
                      <FaEye />
                    </Button>
                  </Link>
                  <RemoveItem
                    caseId={item._id}
                    onDelete={handleDelete}
                    publicId={
                      `lawyer_office/${
                        item.files.join(",").split("/").pop()?.split(".")[0]
                      }` || ""
                    }
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default All_Cases;
