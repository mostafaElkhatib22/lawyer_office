"use client";
import EditCaseForm from "@/components/layout/EditCaseForm";
import { Skeleton } from "@/components/ui/skeleton";
import axios from "axios";
import { useEffect, useState } from "react";
import { use } from "react";

interface Case {
  _id: string;
  caseTypeOF: string;
  court: string;
  type:string;
  caseNumber: string; // تعديل النوع إلى number
  year: string; // تعديل النوع إلى number
  attorneyNumber: string;
  caseDate: string;
  sessiondate: string;
  decision: string;
  opponents: string[];
  files: string[];
  nots: string;
  client: { _id: string; name: string };
}

const EditCasePage = ({ params }: { params: Promise<{ id: string }> }) => {
  const resolvedParams = use(params); // فك الـ Promise قبل الاستخدام
  const [singleCase, setSingleCase] = useState<Case | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getSingleCase = async (id: string) => {
    try {
      const res = await axios.get(`/api/cases/${id}`);
      setSingleCase(res.data.singleCase);
    } catch (error) {
      console.error("Failed to fetch case:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getSingleCase(resolvedParams.id);
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

  const {
    _id,
    attorneyNumber,
    caseDate,
    opponents,
    decision,
    type,
    caseNumber,
    sessiondate,
    files,
    caseTypeOF,
    client,
    court,
    nots,
    year,
  } = singleCase || {};

  return (
    <div>
      {singleCase && (
        <EditCaseForm
          _id={_id || ""}
          attorneyNumber={attorneyNumber || ""}
          caseDate={caseDate || ""}
          type={type||""}
          sessiondate={sessiondate || ""}
          client={client || { _id: "", name: "" }}
          opponents={opponents || []}
          files={files || []}
          caseNumber={caseNumber || ""}
          caseTypeOF={caseTypeOF || ""}
          decision={decision || ""}
          court={court || ""}
          nots={nots || ""}
          year={year || ""}
        />
      )}
    </div>
  );
};

export default EditCasePage;
