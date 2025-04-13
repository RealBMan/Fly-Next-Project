/**
* This code was generated with the help of ChatGPT and it was modified a bit to meet
* the speciifc requirement and standards. The prompt given was the bookings user story
* from the assignment.
*/
/* Tailwind styles for color and text */
'use client';

const styles = {
  container: "max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800",
  heading: "text-2xl font-bold mb-4 text-gray-900 dark:text-white",
  section: "p-4 border rounded-lg shadow mb-4 bg-gray-50 dark:bg-gray-700",
  subheading: "text-xl font-semibold text-gray-800 dark:text-gray-200",
  text: "text-gray-700 dark:text-gray-300",
  label: "font-medium text-gray-600 dark:text-gray-400",
  value: "text-gray-800 dark:text-gray-200",
  error: "text-center text-red-500 dark:text-red-400",
  loading: "text-center text-lg text-gray-600 dark:text-gray-400"
};


import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/utils/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { set } from "react-hook-form";

interface FlightBooking {
  bookingReference: string;
  agencyId: string;
  status: string;
  ticketNumber: string; 
}

interface HotelBooking {
  hotelName: string;
  checkInDate: string;
  checkOutDate: string;
}

interface HotelBooking2{
    hotelName: string; 
    hotelLocation: string; 
    roomType: string;

}
interface BookingInfo{
    status: string;
}

interface FlightBookingInfo{
    status: string; 
}

export default function ItineraryPage() {
  const router = useRouter();
  const params = useParams();
  const [flightBooking, setFlightBooking] = useState<FlightBooking | null>(null);
  const [hotelBooking, setHotelBooking] = useState<HotelBooking | null>(null);
  const [hotelBooking2, setHotelBooking2] = useState<HotelBooking2 | null>(null);
  const [BookingInfo, setBookingInfo] = useState<string | null>(null);
  const [FlightBookingInfo, setFlightInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, refreshAccessToken, isTokenExpired } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const itineraryId = Array.isArray(params.itineraryId) ? params.itineraryId[0] : params.itineraryId;

  useEffect(() => {
    setToken(localStorage.getItem('accessToken'));
    }, []);

  useEffect(() => {
    console.log("Fetching itinerary with ID:", itineraryId);
    if (!itineraryId) return;

    const fetchBookings = async() => {
    let token = localStorage.getItem('accessToken');
    if (!token) {
        setError("No access token found. Please log in again.");
        return;
    }
    if(isTokenExpired(token)) {
        await refreshAccessToken();
        token = localStorage.getItem('accessToken');
    }
      try {
        const response = await fetch(`/api/bookings/view?itineraryId=${itineraryId}`, {
            method: "GET",
            headers: { 
                'Authorization': `Bearer ${token}`

            },
        });
        const data = await response.json();
        console.log("Bookings data:", data);
        if (response.ok) {
          setFlightBooking(data.flightBooking || null);
          setHotelBooking(data.hotelBooking || null);
        } else {
          setError(data.error || "Failed to fetch bookings");
        }
        if (data.hotelBooking){
            const response2 = await fetch(`/api/hotels/bookings/find?bookingId=${data.hotelBooking.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const data2 = await response2.json();
              console.log("Hotel Booking data:", data2);
              console.log("Hotel Booking2 data:", response2);
              if (response2.ok) {
                setHotelBooking2(data2 || null);
              } else {
                setError(data.error || "Failed to fetch bookings");
              }
            setBookingInfo(data.hotelBooking.status);
        }
        console.log("Flight Booking data:", data.flightBooking);
        if(data.flightBooking){
            // const response3 = await fetch(`/api/flights/verifyBooking?bookingReference=${data.flightBooking.bookingReference}`, {
            //     headers: { 'Authorization': `Bearer ${token}` }
            //   });
            //   const data3 = await response3.json();
            //   console.log("Flight Booking data:", data3);
            //   console.log("Flight Booking2 data:", response3);
            //   if (response3.ok) {
            //     setFlightInfo(data3 || null);
            //   } else {
            //     setError(data.error || "Failed to fetch bookings");
            //   }
            // setFlightInfo("booked");
            setFlightBooking(data.flightBooking.bookingReference);
            setFlightBooking(data.flightBooking.agencyId);
            setFlightBooking(data.flightBooking.status);
            setFlightBooking(data.flightBooking.ticketNumber);
        }
        setLoading(false);
      } catch (err) {
        setError("Error fetching bookings");
      } finally {
        setLoading(false);
      }
      setLoading(false);
    }

    fetchBookings();
  }, [itineraryId]);

  async function cancelFlight() {
    if (!flightBooking) return;
    if (!user) { 
        // router.push('/');
        return; 
    }
    if (!token) {
        setError("No access token found. Please log in again.");
        return;
    }
    if(isTokenExpired(token)) {
        await refreshAccessToken();
        setToken(localStorage.getItem('accessToken'));
    }
    try{
        const response = await fetch(`/api/bookings/cancel`, {
            method: "POST",
            headers: { 
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({flightBooking: flightBooking}),
    
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "Failed to cancel a flight.");
        }
        setFlightInfo("cancelled");
    } catch (error) {
        setError("Error cancelling flight.");
    }
  }

  async function cancelHotel() {
    if (!hotelBooking) return;
    if (!user) { 
        router.push('/');
        return; 
    }
    if (!token) {
        setError("No access token found. Please log in again.");
        return;
    }
    if(isTokenExpired(token)) {
        await refreshAccessToken();
        setToken(localStorage.getItem('accessToken'));
    }
    try{
        const response = await fetch(`/api/bookings/cancel`, {
            method: "POST",
            headers: { 
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({itineraryId: itineraryId, hotelBooking: hotelBooking}),
    
        });
        const data = await response.json();
        console.log(data);
        if (!response.ok) {
            throw new Error(data.error || "Failed to cancel a hotel booking.");
        }
        console.log("Hotel Booking data:", data);
        console.log("Hotel Booking2 data:", response);
        setBookingInfo(data.hotelBooking.status);
    } catch (error) {
        setError("Error cancelling hotel booking.");
    }
  }

  if (loading) return <p className="text-center text-lg">Loading itinerary...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Itinerary Details</h1>
      {flightBooking ? (
        <div className={styles.section}>
          <h2 className={styles.subheading}>Flight Details</h2>
          <p className={styles.text}>
            <span className={styles.label}>Booking Reference:</span> <span className={styles.value}>{flightBooking.bookingReference}</span><br />
            <span className={styles.label}>Agency ID:</span> <span className={styles.value}>{flightBooking.agencyId}</span><br />
            <span className={styles.label}>Ticket Number:</span> <span className={styles.value}>{flightBooking.ticketNumber}</span><br />
            <span className={styles.label}>Booking Status:</span> <span className={styles.value}>{flightBooking.status}</span>
          </p>
          <Button onClick={cancelFlight} variant="destructive" className="mt-2">Cancel Flight</Button>
        </div>
      ) : <p className={styles.text}>No flight booking available.</p>}
      {hotelBooking ? (hotelBooking2 ? (
        <div className={styles.section}>
          <h2 className={styles.subheading}>Hotel Details</h2>
          <p className={styles.text}>
            <span className={styles.label}>Hotel:</span> <span className={styles.value}>{hotelBooking2.hotelName}</span><br />
            <span className={styles.label}>Location:</span> <span className={styles.value}>{hotelBooking2.hotelLocation}</span><br />
            <span className={styles.label}>Room Type:</span> <span className={styles.value}>{hotelBooking2.roomType}</span><br />
            <span className={styles.label}>Check-in:</span> <span className={styles.value}>{new Date(hotelBooking.checkInDate).toLocaleDateString()}</span><br />
            <span className={styles.label}>Check-out:</span> <span className={styles.value}>{new Date(hotelBooking.checkOutDate).toLocaleDateString()}</span><br />
            <span className={styles.label}>Booking Status:</span> <span className={styles.value}>{BookingInfo}</span>
          </p>
          <Button onClick={cancelHotel} variant="destructive" className="mt-2">Cancel Hotel</Button>
        </div>
      ) : <p className={styles.text}>No hotel booking details available.</p>) : <p className={styles.text}>No hotel booking available.</p>}
      <Button onClick={() => router.push(`${itineraryId}/checkout`)} variant="default" className="mt-4">
        Proceed to Checkout
      </Button>
    </div>
  );
}
