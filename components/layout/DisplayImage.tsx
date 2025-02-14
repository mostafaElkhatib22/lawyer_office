import React from 'react'
import { CgClose } from "react-icons/cg";
interface DisplayImageProps{
    imgUrl:string
    onClose:()=>void
}
function DisplayImage({ imgUrl,onClose }: DisplayImageProps) {
  return (
 <div className='fixed bottom-0 left-0  top-0 right-0 flex justify-center items-center transition-all duration-200'>
       <div className='bg-slate-100 shadow-lg shadow-black rounded max-w-5xl mx-auto '>
        <div className='w-fit ml-auto text-2xl hover:text-red-500 cursor-pointer' onClick={onClose}><CgClose/></div>
        <div className='flex justify-center p-4 max-h-[90vh] max-w-[90vh]'>
          <img src={imgUrl} alt="img" className='max-h-[90vh] max-w-[90vh]'/>
        </div>
       </div>
 </div>
  )
}

export default DisplayImage
