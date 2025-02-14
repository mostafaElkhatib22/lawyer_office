import axios from 'axios';
import React from 'react';
import toast from 'react-hot-toast';
import { Button } from '../ui/button';
import Swal from 'sweetalert2';
import { FaTrash } from 'react-icons/fa';

interface DeleteClientButtonProps {
  clientId: string;
  onDelete: () => void;
}

const DeleteClientButton: React.FC<DeleteClientButtonProps> = ({ clientId, onDelete }) => {
  const handleDelete = async () => {
    try {
      Swal.fire({
        title: 'هل انت متاكد ?',
        text: 'من حذف هذا العميل والدعاوى المرتبطة به!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        cancelButtonText: 'الغاء',
        confirmButtonText: 'حذف !',
      }).then(async (result) => {
        if (result.isConfirmed) {
          const res = await axios.delete(`/api/clients/${clientId}`);
          if (res.status === 200) {
            toast.success('Client and associated cases deleted successfully');
            onDelete();
          } else {
            toast.error('Failed to delete client or cases');
          }
        }
      });
    } catch (error) {
      toast.error('Failed to delete client or cases');
    }
  };

  return (
    <Button type="button" onClick={handleDelete}>
      <FaTrash />
    </Button>
  );
};

export default DeleteClientButton;
