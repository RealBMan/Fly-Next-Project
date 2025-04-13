/**
* This code was generated with the help of ChatGPT and it was modified a bit to meet
* the speciifc requirement and standards. The prompt given was the bookings user story
* from the assignment.
*/

'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface Booking {
  id: number;
  hotelBooking: string;
  FlightBooking: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const { user, refreshAccessToken, isTokenExpired } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchBookings = async () => {
      let token = localStorage.getItem("accessToken");
      if (!token) {
        setError("No access token found. Please log in again.");
        setLoading(false);
        return;
      }

      if (isTokenExpired(token)) {
        await refreshAccessToken();
        token = localStorage.getItem("accessToken");
      }

      setToken(token);

      try {
        const res = await fetch("/api/bookings/getBooking", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        console.log("Bookings data:", data);

        if (res.ok) {
          setBookings(data || []);
        } else {
          setError(data.error || "Failed to fetch bookings");
        }
      } catch (err) {
        setError("An error occurred while fetching bookings.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleViewDetails = (id: number) => {
    router.push(`/bookings/${id}`);
  };

  if (loading) return <p className="text-center py-8">Loading your bookings...</p>;
  if (error) return <p className="text-center text-red-500 py-8">{error}</p>;

return (
  <div className="container mx-auto px-4 py-8">
    <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Bookings</h1>
    {bookings.length === 0 ? (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <p className="text-gray-600">You don't have any bookings yet.</p>
      </div>
    ) : (
      <div className="grid gap-4">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-medium uppercase tracking-wide text-gray-900">
                  Booking ID
                </h2>
                <p className="text-xl font-semibold text-gray-800">#{booking.id}</p>
              </div>
              <button
                onClick={() => handleViewDetails(booking.id)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors duration-200 flex items-center"
              >
                View Details
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);
}
