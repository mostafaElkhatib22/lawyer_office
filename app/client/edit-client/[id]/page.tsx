"use client";
import EditClient from "@/components/layout/EditClient";
import { Skeleton } from "@/components/ui/skeleton";
import axios from "axios";
import { useEffect, useState } from "react";
import { use } from "react";
interface client {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}
const EditClientPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const resolvedParams = use(params); // فك الـ Promise قبل الاستخدام
  const [singleClient, setSingleClient] = useState<client | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getSingleClient = async (id: string) => {
    try {
      const res = await axios.get(`/api/clients/${id}`);
      setSingleClient(res.data.singleClient)
    } catch (error) {
      console.error("Failed to fetch case:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getSingleClient(resolvedParams.id);
  }, [resolvedParams]);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center w-full h-full mt-10">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
  }

  const { _id, name, email, phone, address } = singleClient || {};

  return (
    <div>
      {singleClient && (
        <EditClient
          _id={_id || ""}
          address={address || ""}
          email={email || ""}
          name={name || ""}
          phone={phone || ""}
        />
      )}
    </div>
  );
};

export default EditClientPage;
function setSingleCase(singleCase: any) {
  throw new Error("Function not implemented.");
}
