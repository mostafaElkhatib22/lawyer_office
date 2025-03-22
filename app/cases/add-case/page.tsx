"use client";
import axios from "axios";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Select from "react-select";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { FaCloudUploadAlt } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import cloudinary from "cloudinary";
import UploadImage from "@/helper/uploadImage";
import DisplayImage from "@/components/layout/DisplayImage";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
cloudinary.v2.config({
  cloud_name: "dbtbxt0fj",
  api_key: "582481432838658",
  api_secret: "IUlsq3VOt1Hp0VIRPjQBHgJ3dpo",
});
interface CaseData {
  client: string;
  caseDate: string;
  type: string;
  sessiondate: string;
  opponents: string[];
  caseTypeOF: string;
  nots: string;
  decision: string;
  court: string;
  caseNumber: string;
  year: string;
  files: string[];
  attorneyNumber: string;
  _id: string;
}
const AddCase = () => {
  const router = useRouter();
  const [data, setData] = useState<CaseData>({
    client: "",
    caseDate: "",
    type: "",
    sessiondate: "",
    opponents: [""],
    caseTypeOF: "",
    nots: "",
    decision: "",
    court: "",
    caseNumber: "",
    year: "",
    files: [],
    attorneyNumber: "",
    _id: "",
  });
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fullImage, setFullImage] = useState("");
  const [openFullScreenImage, setOpenFullScreenImage] = useState(false);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await axios.get("/api/clients");
        setClients(res.data.data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClients();
  }, []);

  const handleOpponentChange = (index: number, value: string) => {
    const updatedOpponents = [...data.opponents];
    updatedOpponents[index] = value;
    setData((prevData) => ({ ...prevData, opponents: updatedOpponents }));
  };

  const addOpponent = () =>
    setData((prevData) => ({
      ...prevData,
      opponents: [...prevData.opponents, ""],
    }));

  const removeOpponent = (index: number) => {
    const updatedOpponents = [...data.opponents];
    if (updatedOpponents.length === 1) {
      return toast.error("لا يوجد خصم ");
    }
    updatedOpponents.splice(index, 1);
    setData((prevData) => ({ ...prevData, opponents: updatedOpponents }));
  };

  const handleOnChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClientChange = (selectedOption: any) => {
    setSelectedClient(selectedOption);
    setData((prev) => ({ ...prev, client: selectedOption.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (new Date(data.caseDate) > new Date(data.sessiondate)) {
      return Swal.fire({
        icon: "error",
        title: "نعتذر",
        text: "يجب ان يكون تاريخ الجلسة بعد تاريخ الدعوى",
      });
    }
    if (!selectedClient) {
      return Swal.fire({
        icon: "error",
        title: "نعتذر",
        text: " يجب اختيار الموكل ",
      });
    }
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const dataApi = await res.json();
      if (dataApi.success) {
        toast.success(dataApi.message);
        router.push("/cases/all-cases");
        setData({
          client: "",
          caseDate: "",
          caseTypeOF: "",
          sessiondate: "",
          opponents: [""],
          files: [],
          nots: "",
          type: "",
          decision: "",
          court: "",
          caseNumber: "",
          year: "",
          attorneyNumber: "",
          _id: "",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "نعتذر",
          text: `${dataApi.message}`,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleUploadImage = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    const uploadImageCloudinary = await UploadImage(file);
    setData((prev) => ({
      ...prev,
      files: [...prev.files, uploadImageCloudinary.url],
    }));
  };

  const handleDeleteImage = async (index: number, imageUrl: string) => {
    const updatedFiles = data.files.filter((_, i) => i !== index);
    setData((prev) => ({ ...prev, files: updatedFiles }));
    const publicId = imageUrl.split("/").pop()?.split(".")[0] || "";
    try {
      const res = await fetch("/api/deleteImage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId: `lawyer_office/${publicId}` }),
      });
      const dataApi = await res.json();
      if (!res.ok) {
        Swal.fire({
          icon: "error",
          title: "نعتذر",
          text: `${dataApi.message}`,
        });
      } else {
        Swal.fire({
          icon: "success",
          title: "تم الحذف",
          text: "تم حذف الصورة بنجاح",
        });
      }
    } catch (error) {
      console.error("Error deleting image from Cloudinary:", error);
    }
  };

  const clientOptions = clients.map((client: any) => ({
    value: client._id,
    label: client.name,
  }));

  if (isLoading) {
    return (
      <div className="flex justify-center items-center mt-[200px]">
        <div className="flex flex-col space-y-3">
          <Skeleton className="h-[125px] w-[250px] rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </div>
    );
  }
  const renderInputField = (
    label: string,
    placeholder: string,
    name: string,
    value: string,
    type = "text",
    additionalClass = "",
    handleOnChange: (
      e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => void
  ) => (
    <div>
      <label>{label} :</label>
      <Input
        placeholder={placeholder}
        name={name}
        value={value}
        onChange={handleOnChange}
        type={type}
        className={additionalClass}
      />
    </div>
  );

  return (
    <div className=" w-full overflow-hidden  items-center flex justify-center scroll-smooth">
      <form
        onSubmit={handleSubmit}
        className=" flex justify-center items-center p-4 w-full shadow-md shadow-black"
      >
       <div className="max-w-[400px] bg-white flex flex-col p-4 gap-4 justify-center items-center text-center rounded-2xl shadow-lg  shadow-black">
         {renderInputField(
           "المحكمة",
           "ادخل اسم المحكمة",
           "court",
           data.court,
           "text",
           "",
           handleOnChange
         )}
         {renderInputField(
           "نوع الدعوى",
           "ادخل نوع الدعوى",
           "caseTypeOF",
           data.caseTypeOF,
           "text",
           "",
           handleOnChange
         )}
         {renderInputField(
           "طبيعة الدعوى",
           "ادخل طبيعة الدعوى",
           "type",
           data.type,
           "text",
           "",
           handleOnChange
         )}
         {renderInputField(
           "رقم الدعوى",
           "ادخل رقم الدعوى",
           "caseNumber",
           data.caseNumber,
           "number",
           "",
           handleOnChange
         )}
         {renderInputField(
           "سنة الدعوى",
           "ادخل سنه الدعوى",
           "year",
           data.year,
           "number",
           "",
           handleOnChange
         )}
         {renderInputField(
           "رقم التوكيل",
           "ادخل رقم التوكيل",
           "attorneyNumber",
           data.attorneyNumber,
           "text",
           "",
           handleOnChange
         )}
         {renderInputField(
           "تاريخ الدعوى",
           "ادخل تاريخ الجلسة",
           "caseDate",
           data.caseDate,
           "date",
           "w-[230px] text-center",
           handleOnChange
         )}
         {renderInputField(
           "تاريخ الجلسة",
           "ادخل تاريخ الجلسة",
           "sessiondate",
           data.sessiondate,
           "date",
           "w-[230px] text-center",
           handleOnChange
         )}
           <label>قرار الجلسة :</label>
           <textarea
             placeholder="ادخل قرار الجلسة"
             className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
             name="decision"
             value={data.decision}
             onChange={handleOnChange}
           />
        
        
         <div className="w-full h-[60px] mt-4">
           <label>الموكل:</label>
           <Select
             options={clientOptions as any}
             value={selectedClient}
             onChange={handleClientChange}
             placeholder="اختار الموكل"
             isSearchable
             className="mt-1"
           />
         </div>
        
         <label>الخصم :</label>
         {data.opponents.map((opponent, index) => (
           <div key={index} className="flex items-center mt-2">
             <Input
               type="text"
               value={opponent}
               onChange={(e: ChangeEvent<HTMLInputElement>) =>
                 handleOpponentChange(index, e.target.value)
               }
               className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
             />
             <button
               type="button"
               onClick={() => removeOpponent(index)}
               className="ml-2 w-[130px] p-2 bg-red-500 text-white rounded"
             >
               إزالة 
             </button>
             {index === data.opponents.length - 1 && (
               <button
                 type="button"
                 onClick={addOpponent}
                 className="ml-2 p-2 w-[170px] bg-blue-500 text-white rounded"
               >
                 إضافة  آخر
               </button>
             )}
           </div>
         ))}
        
         <label htmlFor="image" className="mt-3">
           ارفع صور المستندات الخاصة بالدعوى
         </label>
         <label htmlFor="uploadImage">
           <div className="p-2 bg-slate-100 border rounded h-32 w-full flex justify-center items-center cursor-pointer">
             <div className="text-slate-500 flex justify-center items-center flex-col gap-2">
               <span className="text-4xl">
                 <FaCloudUploadAlt />
               </span>
               <p className="text-sm">ارفع صور الدعوى</p>
               <input
                 type="file"
                 id="uploadImage"
                 multiple
                 className="hidden"
                 onChange={handleUploadImage}
               />
             </div>
           </div>
         </label>
        
         <div className="w-full">
           {data?.files?.length > 0 ? (
             <div className="flex justify-center w-full items-center gap-6">
               {data.files.map((el: string, i: number) => (
                 <div className="relative group" key={i}>
                   <img
                     src={el}
                     onClick={() => {
                       setOpenFullScreenImage(true);
                       setFullImage(el);
                     }}
                     className="bg-slate-100 max-w-[100px] max-h-[100px] border transition-all duration-[1s] cursor-pointer"
                   />
                   <div
                     className="absolute bottom-0 right-0 text-white bg-red-500 rounded-full hidden group-hover:block cursor-pointer"
                     onClick={() => handleDeleteImage(i, el)}
                   >
                     <MdDelete />
                   </div>
                 </div>
               ))}
             </div>
           ) : (
             <p className="text-red-500">
               من فضلك اضف صور المستندات الخاصة بالدعوى *
             </p>
           )}
         </div>
        
         <div className="flex justify-center items-center flex-col w-full">
           <label>ملاحظات:</label>
           <textarea
             placeholder="ملاحظات"
             name="nots"
             value={data.nots}
             onChange={handleOnChange}
             className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
           />
         </div>
        
         <Button variant="destructive" type="submit" className="w-[200px] h-[45px] text-lg font-semibold">
           إضافة الدعوى
         </Button>
       </div>
      </form>
      {openFullScreenImage && (
        <DisplayImage
          onClose={() => setOpenFullScreenImage(false)}
          imgUrl={fullImage}
        />
      )}
    </div>
  );
};

export default AddCase;
