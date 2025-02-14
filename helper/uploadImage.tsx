import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const url = `https://api.cloudinary.com/v1_1/dbtbxt0fj/image/upload`;

interface UploadResponse {
  url: string;
  [key: string]: any;
}

const UploadImage = async (image: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append("file", image);
  formData.append("upload_preset", "lawyer_office");
  const dataResponse = await fetch(url, {
    method: "POST",
    body: formData,
  });

  return dataResponse.json();
};

export default UploadImage;

