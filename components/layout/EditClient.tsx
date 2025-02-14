"use client";
import axios from "axios";
import React, { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
interface Case {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

const EditClient: React.FC<Case> = ({ _id, name, email, phone, address }) => {
  const router = useRouter()
  const [formState, setFormState] = useState({
    newname: name,
    newemail: email,
    newphone: phone,
    newaddress: address,
  });

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      Swal.fire({
        title: "هل تريد حفظ التغيرات?",
        showDenyButton: true,
        showCancelButton: false,
        confirmButtonText: "حفظ",
        denyButtonText: `عدم الحفظ`,
      }).then(async (result) => {
        if (result.isConfirmed) {
          const res = await axios.put(`/api/clients/${_id}`, formState);
          console.log(res.data);
          res.status === 200
            ? Swal.fire({
                position: "center",
                icon: "success",
                title: "تم التحديث",
                timer: 1000,
              })
            : Swal.fire({
                position: "center",
                icon: "error",
                title: "لم يتم تحديث البيانات",
                timer: 1000,
              });
          Swal.fire(" ! تم حفظ التغيرات ", "", "success");
          router.push('/client')
        } else if (result.isDenied) {
          Swal.fire("التغيرات لم يتم حفظها ", "", "error");
        }
      });
    } catch (error) {
      console.error("Failed to update case:", error);
    }
  };

  const handleChange = (field: string, value: any) =>
    setFormState((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="mt-10">
      <div className="text-center font-serif font-bold text-2xl">
        {/* <h1>تحديث دعوى الموكل ({client?.name})</h1> */}
      </div>
      <div className=" w-full items-center flex justify-center">
        <form
          onSubmit={handleUpdate}
          className="space-y-4 max-w-[700px] flex justify-center items-center flex-col"
        >
          <Input
            placeholder="ادخل اسم الموكل"
            value={formState.newname}
            className="text-center"
            onChange={(e) => handleChange("newname", e.target.value)}
          />
          <Input
            placeholder="ادخل رقم تليفون الموكل"
            value={formState.newphone}
            className="text-center"
            onChange={(e) => handleChange("newphone", e.target.value)}
          />
          <Input
            type="text"
            placeholder="ادخل البريد الالكتروني "
            value={formState.newemail}
            className="text-center"
            onChange={(e) => handleChange("newemail", e.target.value)}
          />
          <Input
            type="text"
            placeholder="ادخل عنوان الموكل  "
            value={formState.newaddress}
            className="text-center"
            onChange={(e) => handleChange("newaddress", e.target.value)}
          />

          <Button variant="destructive" type="submit">
            تحديث
          </Button>
        </form>
      </div>
    </div>
  );
};

export default EditClient;
