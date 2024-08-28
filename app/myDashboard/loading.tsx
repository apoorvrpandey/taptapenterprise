import { LayoutDashboard } from "lucide-react";
import { Skeleton } from "../../components/ui/skeleton";

export default async function Loading() {
  return (
    <div className="bg-[#D7D6D6] flex flex-col md:flex-row gap-x-3  min-h-screen md:p-8 p-5 ">
      <div className="min-h-screen  w-full md:w-[75%] p-8 flex flex-col bg-white rounded-xl">
        <p className="flex gap-x-2  items-center text-gray-700">
          <LayoutDashboard />
          Dashboard
        </p>

        <div className="flex mt-5    flex-wrap  gap-3 gap-y-4  justify-center md:justify-start items-center md:items-start  w-full">
          <Skeleton className=" w-full md:w-[17rem]  transition-all cursor-pointer focus:scale-[1.05] hover:scale-[1.05]   group h-20 border gap-x-3 p-3.5 rounded-xl flex items-center justify-between">
            <Skeleton className="flex items-start flex-col gap-y-1">
              <Skeleton className=" h-5 w-[8rem] rounded-xl bg-gray-200" />
              <Skeleton className=" h-5 w-[10rem] rounded-xl bg-gray-200" />
            </Skeleton>
            <Skeleton className=" h-10 w-10 rounded-xl bg-gray-200" />
          </Skeleton>
          <Skeleton className=" w-full md:w-[17rem]  transition-all cursor-pointer focus:scale-[1.05] hover:scale-[1.05]   group h-20 border gap-x-3 p-3.5 rounded-xl flex items-center justify-between">
            <Skeleton className="flex items-start flex-col gap-y-1">
              <Skeleton className=" h-5 w-[8rem] rounded-xl bg-gray-200" />
              <Skeleton className=" h-5 w-[10rem] rounded-xl bg-gray-200" />
            </Skeleton>
            <Skeleton className=" h-10 w-10 rounded-xl bg-gray-200" />
          </Skeleton>

          <Skeleton className=" w-full md:w-[17rem]  transition-all cursor-pointer focus:scale-[1.05] hover:scale-[1.05]   group h-20 border gap-x-3 p-3.5 rounded-xl flex items-center justify-between">
            <Skeleton className="flex items-start flex-col gap-y-1">
              <Skeleton className=" h-5 w-[8rem] rounded-xl bg-gray-200" />
              <Skeleton className=" h-5 w-[10rem] rounded-xl bg-gray-200" />
            </Skeleton>
            <Skeleton className=" h-10 w-10 rounded-xl bg-gray-200" />
          </Skeleton>
        </div>

        <div className="flex mt-5 flex-wrap  min-h-[250px]   gap-3 gap-y-4  items-start w-full">
          <Skeleton className="w-full bg-gray-100 rounded-xl md:w-[47%] h-full " />
          <Skeleton className="w-full bg-gray-100 rounded-xl md:w-[47%] h-full " />
        </div>

        <Skeleton className="w-[96%] bg-gray-100 rounded-xl mt-5 h-full " >
          
        </Skeleton>
        
      </div>
    </div>
  );
}
