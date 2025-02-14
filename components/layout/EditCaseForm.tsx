"use client";
import axios from "axios";
import React, { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Select, { SingleValue } from "react-select";
import Swal from "sweetalert2";
import toast from "react-hot-toast";

interface Case {
  _id: string;
  caseTypeOF: string;
  type:string;
  court: string;
  caseNumber: string;
  year: string;
  sessiondate: string;
  decision: string;
  opponents: string[];
  attorneyNumber: string;
  caseDate: string;
  files:string[]
  nots: string;
  client: { _id: string; name: string };
}

const EditCaseForm: React.FC<Case> = ({
  _id,
  caseTypeOF,
  court,
  type,
  caseNumber,
  sessiondate,
  year,
  decision,
  opponents,
  attorneyNumber,
  caseDate,
  nots,
  client,
  files,
}) => {
  const [formState, setFormState] = useState({
    newClient: [{ ...client, name: client?.name }],
    newcaseTypeOF: caseTypeOF,
    newcaseDate: caseDate,
    newopponents: opponents,
    newType:type,
    newsessiondate: sessiondate,
    newdecision: decision,
    selectedClient: null as SingleValue<{
      value: string;
      label: string;
    }> | null,
    newnots: nots,
    newcourt: court,
    newcaseNumber: caseNumber,
    newyear: year,
    newAttorneyNumber: attorneyNumber,
    newFiles:files
  });

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
  
    if (new Date(formState.newcaseDate) > new Date(formState.newsessiondate)) {
      return toast.error("يجب أن يكون تاريخ الجلسة بعد تاريخ الدعوى");
    }

    try {
      Swal.fire({
        title: "Do you want to save the changes?",
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: "Save",
        denyButtonText: `Don't save`
      }).then( async(result) => {
        if (result.isConfirmed) {
          const res = await axios.put(`/api/cases/${_id}`, formState);
          res.status === 200
            ? Swal.fire({
                position: "center",
                icon: "success",
                title: "تم التحديث",
                showConfirmButton: false,
                timer: 870,
              })
            : Swal.fire({
                position: "center",
                icon: "error",
                title: "لم يتم تحديث البيانات",
                showConfirmButton: false,
                timer: 870,
              });
          Swal.fire("Saved!", "", "success");
        } else if (result.isDenied) {
          Swal.fire("Changes are not saved", "", "info");
        }
      });
    } catch (error) {
      console.error("Failed to update case:", error);
    }
  };

  const handleChange = (field: string, value: any) =>
    setFormState((prev) => ({ ...prev, [field]: value }));

  const handleOpponentChange = (index: number, value: string) => {
    const updatedOpponents = [...formState.newopponents];
    updatedOpponents[index] = value;
    handleChange("newopponents", updatedOpponents);
  };

  const addOpponent = () =>
    handleChange("newopponents", [...formState.newopponents, ""]);

  const removeOpponent = (index: number) => {
    const updatedOpponents = [...formState.newopponents];
    if (updatedOpponents.length === 1) {
      toast.error("لا يوجد خصم");
    } else {
      updatedOpponents.splice(index, 1);
      handleChange("newopponents", updatedOpponents);
    }
  };

  const clientOptions = formState.newClient.map((client) => ({
    value: client._id,
    label: client.name,
  }));

  const handleClientChange = (
    selectedOption: SingleValue<{ value: string; label: string }>
  ) => {
    handleChange("selectedClient", selectedOption);
    handleChange("newClient", [
      { ...client, _id: selectedOption!.value, name: selectedOption!.label },
    ]);
  };

  return (
    <div>
      <div className="text-center font-serif font-bold text-2xl">
        <h1>تحديث دعوى الموكل ({client?.name})</h1>
      </div>
      <div className=" w-full items-center flex justify-center">
        <form
          onSubmit={handleUpdate}
          className="space-y-4 max-w-[700px] flex justify-center items-center flex-col"
        >
          <Input
            placeholder="ادخل اسم المحكمة"
            value={formState.newcourt}
            className="text-center"
            onChange={(e) => handleChange("newcourt", e.target.value)}
          />
          <Input
            placeholder="ادخل نوع الدعوى"
            value={formState.newcaseTypeOF}
            className="text-center"
            onChange={(e) => handleChange("newcaseTypeOF", e.target.value)}
          />
          <Input
            placeholder="ادخل نوع الدعوى"
            value={formState.newType}
            className="text-center"
            onChange={(e) => handleChange("newType", e.target.value)}
          />
          <Input
            type="number"
            placeholder="ادخل رقم الدعوى"
            value={formState.newcaseNumber}
            className="text-center"
            onChange={(e) => handleChange("newcaseNumber", e.target.value)}
          />
          <Input
            type="number"
            placeholder="ادخل سنه الدعوى"
            value={formState.newyear}
            className="text-center"
            onChange={(e) => handleChange("newyear", e.target.value)}
          />
          <Input
            type="text"
            placeholder="ادخل قرار الجلسة"
            value={formState.newdecision}
            className="text-center"
            onChange={(e) => handleChange("newdecision", e.target.value)}
          />
          <Input
            placeholder="ادخل رقم التوكيل"
            value={formState.newAttorneyNumber}
            className="text-center"
            onChange={(e) => handleChange("newAttorneyNumber", e.target.value)}
          />
          <Input
            type="date"
            placeholder="ادخل تاريخ الدعوى"
            value={new Date(formState.newcaseDate).toISOString().split("T")[0]}
            className="text-center"
            onChange={(e) => handleChange("newcaseDate", e.target.value)}
          />
          <Input
            type="date"
            placeholder="ادخل تاريخ الجلسة"
            value={new Date(formState.newsessiondate).toISOString().split("T")[0]}
            className="text-center"
            onChange={(e) => handleChange("newsessiondate", e.target.value)}
          />
          <Select
            options={clientOptions}
            value={formState.selectedClient}
            onChange={handleClientChange}
            placeholder={client?.name}
            isSearchable
            isDisabled
            className="mt-1"
          />
          <label>الخصم:</label>
          {formState.newopponents.map((opponent, index) => (
            <div key={index} className="flex items-center mt-2">
              <Input
                value={opponent}
                onChange={(e) => handleOpponentChange(index, e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <button
                type="button"
                onClick={() => removeOpponent(index)}
                className="ml-2 w-[130px] p-2 bg-red-500 text-white rounded"
              >
                إزالة الخصم
              </button>
              {index === formState.newopponents.length - 1 && (
                <button
                  type="button"
                  onClick={addOpponent}
                  className="ml-2 p-2 w-[170px] bg-blue-500 text-white rounded"
                >
                  إضافة خصم آخر
                </button>
              )}
            </div>
          ))}
          <textarea
            value={formState.newnots}
            onChange={(e) => handleChange("newnots", e.target.value)}
            className="mt-1 block w-full text-center border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="ملاحظات"
          />
          <Button variant="destructive" type="submit">
            تعديل الدعوى
          </Button>
        </form>
      </div>
    </div>
  );
};

export default EditCaseForm;
