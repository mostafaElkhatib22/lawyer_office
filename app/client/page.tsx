"use client";

import DeleteClientButton from "@/components/layout/RemoveClient";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaPenToSquare } from "react-icons/fa6";

interface client {
  _id: string;
  name: string;
  caseCount: number;
}

export default function Clients() {
  const [clients, setClients] = useState<client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const getAllClients = async (searchQuery: string = "") => {
    try {
      const res = await axios.get(`/api/clients?searchQuery=${searchQuery}`);
      setClients(res.data.data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllClients();
  }, []);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    getAllClients(searchQuery);
  };

  const handleDelete = () => {
    getAllClients(searchQuery);
  };

  if (loading) {
    return <div>Loading....</div>;
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="m-5 flex gap-2 justify-center items-center">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={
            "w-[150px] border-2 border-violet-400 md:w-[300px] lg:w-[400px] rounded-lg outline-none h-[40px] p-3"
          }
          placeholder="ابحث عن موكل "
        />
        <Button type="submit" variant={"destructive"} >Search</Button>
      </form>

      <Table className="text-center bg-violet-200">
        <TableCaption>A list of your clients ({clients.length})</TableCaption>
        <TableHeader className="text-center">
          <TableRow>
            <TableHead className="text-center">الموكل</TableHead>
            <TableHead className="text-center">عدد القضايا</TableHead>
            <TableHead className="text-center">تعديل او حذف</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.caseCount}</TableCell>
              <TableCell className="flex justify-center items-center gap-4">
                <DeleteClientButton
                  clientId={item._id}
                  onDelete={handleDelete}
                />
                <Button>
                  <Link href={`/client/edit-client/${item?._id}`}>
                    <FaPenToSquare />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
