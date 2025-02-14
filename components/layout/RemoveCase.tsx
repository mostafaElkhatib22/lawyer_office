"use client"
import axios from "axios";
import React from "react";
import toast from "react-hot-toast";
import { Button } from "../ui/button";
import Swal from "sweetalert2";
import { FaTrash } from "react-icons/fa";
import { useRouter } from "next/navigation";
interface DeleteCaseButtonProps {
  caseId: string;
  publicId: string;
  onDelete: () => void;
}

function RemoveItem({ caseId, publicId, onDelete }: DeleteCaseButtonProps) {
  const router = useRouter()
  const handleDelete = async () => {
    try {
      Swal.fire({
        title: "هل انت متاكد ?",
        text: "من حذف هذه الدعوى!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        cancelButtonText:"لا ",
        confirmButtonText: "! نعم ",
      }).then(async (result) => {
        if (result.isConfirmed) {
          // حذف الصور من Cloudinary
          const deleteImageRes = await axios.delete(`/api/deleteImage`, {
            data: { publicId }
          });

          if (deleteImageRes.data.success) {
            // حذف الدعوى من قاعدة البيانات
            const res = await axios.delete(`/api/cases/${caseId}`);
            if (res.data.success) {
              toast.success(res.data.message);
              onDelete();
              router.push('/cases/all-cases')
            } else {
              toast.error(res.data.message);
            }
          } else {
            toast.error(deleteImageRes.data.message);
          }
        }
      });
    } catch (error) {
      toast.error("Failed to delete case");
    }
  };

  return (
    <Button type="button" onClick={handleDelete} className="bg-red-500 hover:bg-red-700">
      <FaTrash />
    </Button>
  );
}

export default RemoveItem;
