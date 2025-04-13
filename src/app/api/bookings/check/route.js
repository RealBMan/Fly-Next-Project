import { filterHotelBookingsService } from "@/services/bookingService";
import {apiClient} from "@/utils/apiClient";
import { verifyToken } from '@/utils/auth';

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(request){
    try{
        const token = verifyToken(request);
        console.log(token);
        if (!token || (token && token.error)){
            return new Response(JSON.stringify({error:'Unauthorized Access'}), {status: 401 });
        }

        const user = await prisma.user.findUnique({where: {email: token.userEmail}});
        const searchParams = request.nextUrl.searchParams;
        const { value } = Object.fromEntries(searchParams.entries());

        let itinerary = null;

        if (value == "1"){
            itinerary = await prisma.itinerary.findFirst({where: {userId: user.id, flightBooking: null}});
        } else {
            itinerary = await prisma.itinerary.findFirst({where: {userId: user.id, hotelBooking: null}}); 
        }

        console.log("Hello",itinerary);
        if(!itinerary){
            return new Response(JSON.stringify({itinerary: null}), {status: 200});
        }
        console.log(itinerary);
        return new Response(JSON.stringify({itinerary: itinerary}), {status: 200});
    }catch (error){
        console.log(error);
        return new Response(JSON.stringify({error: "Error while fetching bookings"}), {status: 400});
    }
}