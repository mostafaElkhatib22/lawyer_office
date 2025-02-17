"use client";
import DisplayImage from "@/components/layout/DisplayImage";
import RemoveItem from "@/components/layout/RemoveCase";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useRouter } from "next/navigation";
import React, { use, useEffect, useState } from "react";
import { BsFillPrinterFill } from "react-icons/bs";

interface Case {
  _id: string;
  caseTypeOF: string;
  type: string;
  court: string;
  sessiondate: string;
  caseNumber: string;
  year: string;
  attorneyNumber: string;
  caseDate: string;
  nots: string;
  files: string[];
  opponents: string[];
  decision: string;
  client: { _id: string; name: string };
}

function SingleCasepage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [singleCase, setSingleCase] = useState<Case | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fullImage, setFullImage] = useState("");
  const router = useRouter();
  const [openFullScreenImage, setOpenFullScreenimage] = useState(false);

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
  const handleDelete = () => {
    router.push("/cases/all-cases"); // إعادة جلب القضايا بعد الحذف
  };
  useEffect(() => {
    getSingleCase(resolvedParams.id);
  }, [resolvedParams]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col justify-center items-center w-full h-full">
      <div className="flex flex-col justify-center items-center overflow-hidden w-[550px] md:w-[700px] lg:w-[900px] border-2 border-black p-4 mt-4 ">
        <div className="container mx-auto p-4">
          <h1 className="text-2xl text-center font-bold mb-4 border-b-2 border-black p-2">
            تقرير عن الدعوى رقم ({singleCase?.caseNumber})
          </h1>
        </div>
        <div className="flex flex-col justify-center items-end w-full">
          <div className="w-full flex justify-start items-center flex-row-reverse text-right">
            <label className="border-2 border-black p-2 w-[150px] text-center m-2 text-xl font-semibold">
              الموكل{" "}
            </label>
            <span className="border-2 border-black p-2 w-[400px] text-center text-xl  font-semibold">
              {singleCase?.client?.name || "لايوجد موكل"}
            </span>
          </div>
          <div className="w-full flex justify-start items-center flex-row-reverse text-right">
            <label className="border-2 border-black w-[150px] p-2 text-center m-2 text-xl font-semibold">
              الخصم{" "}
            </label>
            <span className="border-2 border-black items-center gap-2 p-2 w-[400px] text-center text-xl  font-semibold">
              {singleCase?.opponents.join(",") || "لا يوجد خصم"}
            </span>
          </div>
          <div className="w-full flex justify-start items-center flex-row-reverse text-right">
            <label className="border-2 border-black p-2 w-[150px] text-center m-2 text-xl font-semibold">
              ملاحظات{" "}
            </label>
            <span className="border-2 border-black p-2 w-[400px] text-center text-xl  font-semibold">
              {singleCase?.nots || "لا يوجد ملاحظات"}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 mt-4">
          <div className="w-full flex justify-center gap-3 items-center flex-col">
            {" "}
            <label className="border-2 w-[110px] border-black p-2 text-center  text-lg font-semibold">
              طبيعة الدعوى
            </label>
            <p className="border-2 w-[110px] border-black p-2 text-center  text-lg font-semibold">
              {singleCase?.caseTypeOF || "طبيعة الدعوى غير معروفة"}
            </p>
          </div>
          <div className="w-full flex justify-center gap-3 items-center flex-col">
            {" "}
            <label className="border-2 w-[110px] border-black p-2 text-center  text-lg font-semibold">
              نوع الدعوى
            </label>
            <p className="border-2 w-[110px] border-black p-2 text-center  text-lg font-semibold">
              {singleCase?.type || "نوع الدعوى غير معروفة"}
            </p>
          </div>
          <div className="w-full flex justify-center gap-3 items-center flex-col">
            <label className="border-2 w-[110px] border-black p-2 text-center text-lg font-semibold">
              المحكمة{" "}
            </label>
            <p className="border-2 w-[110px] border-black p-2 text-center text-lg font-semibold">
              {singleCase?.court || "المحكمة غير معروفه"}
            </p>
          </div>
          <div className="w-full flex justify-center gap-3 items-center flex-col">
            {" "}
            <label className="border-2 w-[110px] border-black p-2 text-center text-lg font-semibold">
              تاريخ الدعوى
            </label>
            <p className="border-2 w-[110px] border-black p-2 text-center text-lg font-semibold">
              {new Date(singleCase?.caseDate ?? "").toLocaleDateString() ||
                "لا يوجد تاريخ للدعوى"}
            </p>
          </div>
          <div className="w-full flex justify-center gap-3 items-center flex-col">
            {" "}
            <label className="border-2 w-[110px] border-black p-2 text-center text-lg font-semibold">
              تاريخ الجلسة
            </label>
            <p className="border-2 w-[110px] border-black p-2 text-center text-lg font-semibold">
              {new Date(singleCase?.sessiondate ?? "").toLocaleDateString() ||
                "تاريخ الجلسة لم يحدد بعد"}
            </p>
          </div>
          <div className="w-full flex justify-center gap-3 items-center flex-col">
            <label className="border-2 w-[110px] border-black p-2 text-center text-lg font-semibold">
              رقم التوكيل
            </label>
            <p className="border-2 w-[110px] border-black p-2 text-center  text-lg font-semibold">
              {singleCase?.attorneyNumber || "لا يوجد توكيل"}
            </p>
          </div>
        </div>
        <div className="text-center border-2 border-black p-2 m-2 text-4xl font-extrabold">
          <p>{singleCase?.decision || "لا يوجد قرار لحد الان"}</p>
        </div>
        <div className="flex justify-center items-center gap-7 no-print">
          <Button onClick={handlePrint} className="bg-sky-600 hover:bg-sky-800">
            <BsFillPrinterFill />
          </Button>
          <RemoveItem
            caseId={singleCase?._id || ""}
            onDelete={handleDelete}
            publicId={
              `lawyer_office/${
                singleCase?.files.join(",").split("/").pop()?.split(".")[0]
              }` || ""
            }
          />
        </div>
      </div>
      <div className="flex justify-center gap-5 w-[900px] h-[450px] no-print">
        {singleCase?.files?.map((el, i) => (
          <div key={i} className="max-w-[100px] mt-8 bg-slate-300 max-h-[100px]">
            <img
              src={el}
              alt=""
              className="w-[100px] h-[100px] cursor-pointer"
              onClick={() => {
                setOpenFullScreenimage(true);
                setFullImage(el);
              }}
            />
          </div>
        ))}
        {openFullScreenImage && (
          <DisplayImage
            onClose={() => setOpenFullScreenimage(false)}
            imgUrl={fullImage}
          />
        )}
      </div>
    </div>
  );
}

export default SingleCasepage;
