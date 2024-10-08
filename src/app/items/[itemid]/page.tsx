import { validateRequest } from "@/app/(auth)/validate-request";
import {database} from '@/db/index'
import { Item, auctions, bidItems } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Image from 'next/image'
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getURLImg } from "@/app/page"
import {formatDistance} from 'date-fns'
import { createBid } from "./actions";
export const dateFunction=(date:Date)=>{
    return formatDistance(date, new Date(), { addSuffix: true })
}
export const formatCurrency=(currency:number)=>{
    return `₹${(currency/100).toFixed(2)}`
}
export default async function ItemDetails({params:{itemid}}:{params:{itemid:number}}) {
    const {user}=await validateRequest()
    const item:any= await database.query.bidItems.findFirst({
        where:eq(bidItems.id,itemid)
    })
    if(!user){
        return redirect('/login')
    }
    if (!item){
        return(
            <main className="space-y-8 flex flex-col items-center">
                <Image  src="/notfound.svg" height='200' width="200" alt="logo"/> 
                <h1 className="scroll-m-20 font-extrabold tracking-tight text-5xl">Item not found</h1>
                <p className="font-bold">Item is not available maybe try a different one</p>
                <Button asChild>
                    <Link href='/'>
                    Go back
                    </Link>
                </Button>
            </main>
        )
    }
    const bids=await database.query.auctions.findMany({
        where:eq(auctions.itemId,itemid),
        orderBy:desc(auctions.id),
        with:{
            user:{
                columns:{
                    username:true
                }
            }
        }
    })
    const noBids:boolean=bids.length>0

    return (
        <main className="space-y-12">
            
            <div className="flex gap-10 flex-wrap">
            <div>
            <h1 className="mt-4 font-bold text-4xl">
            <span className="font-normal">Bid for </span>{item.name}
            </h1>
            <Image className="border" src={getURLImg(item.fileName)} alt='item image' height='400' width='400'></Image>
            <p className="mt-4 text-2xl">Starting Price <span className="font-bold">{formatCurrency(item.startPrice)}</span></p>
            <p className="mt-4 text-2xl">Bid Interval: <span className="font-bold">{formatCurrency(item.bidInterval)}</span></p>
            </div>
            <div className="space-y-4 flex-1">
                <div className="flex justify-between mt-5">
                <h2 className="font-bold text-3xl ">Current Bids</h2>
                <form action={createBid.bind(null,item.id)}>
                    <Button>Place a bid</Button>
                </form>
                </div>
                {noBids?
                <ul className="space-y-4">
                {
                    bids.map((bid)=>(
                        <li key={bid.id} className="bg-gray-100 rounded-xl p-8" >
                            <div className="flex gap-4">
                                <div className="flex gap-4">
                                <span className="font-bold">
                                    ₹{bid.amount}
                                </span>
                                <span className="font-bold">
                                    {bid.user.username}
                                </span>
                                </div>
                                <div className="font-bold">
                                    {dateFunction(bid.timestamp)}
                                </div>
                            </div>
                        </li>
                    )
                    )
                }
            </ul>
                :
                <div className="flex flex-col items-center gap-8 bg-gray-100 p-12 rounded-xl">
                    <Image src='/notfound.svg' alt='logo' width='100' height='100'/>
                    <h2 className="font-bold text-2xl">No Bids Yet</h2>
                    <form action={createBid.bind(null,item.id)}>
                    <Button>Place a bid</Button>
                    </form>
                </div>
                }
            </div>
            </div>
        </main>
    );
}


