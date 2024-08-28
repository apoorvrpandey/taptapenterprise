import { cn } from "../app/utils";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import Marquee from "./ui/marquee";

const reviews = [
  {
    img: "https://res.cloudinary.com/diynkxbpc/image/upload/v1722502930/image_183_1_qbslta.png",
  },
  {
    img: "https://res.cloudinary.com/diynkxbpc/image/upload/v1722502867/image_184_1_zeike2.png",
  },
  {
    img: "https://res.cloudinary.com/diynkxbpc/image/upload/v1722502806/image_185_owjmtt.png",
  },
  {
    img: "https://res.cloudinary.com/diynkxbpc/image/upload/v1722503064/image_186_nasefv.png",
  },
  {
    img: "https://res.cloudinary.com/diynkxbpc/image/upload/v1722503110/image_187_qd72gg.png",
  },

];

const firstRow = reviews;

const ReviewCard = ({ img }: { img: string }) => {
  return (
    <div className="flex flex-row items-center gap-2">
      <img className="rounded-full" width="200" height="200" alt="" src={img} />
    </div>
  );
};

export function CompanyMarquee() {
  return (
    <Card className="   mt-10 w-[100%] ">
      <CardHeader>
        <CardTitle >Blackbucks Top Recruiters</CardTitle>
      </CardHeader>
      <CardContent className="relative w-full">
        <Marquee className="[--duration:20s]">
          {firstRow.map((review) => (
            <ReviewCard key={review.img} {...review} />
          ))}
        </Marquee>

        <div className="pointer-events-none absolute inset-y-0 left-3 w-1/3 bg-gradient-to-r from-white dark:from-background"></div>
        <div className="pointer-events-none absolute inset-y-0 right-3 w-1/3 bg-gradient-to-l from-white dark:from-background"></div>
      </CardContent>
    </Card>
  );
}
