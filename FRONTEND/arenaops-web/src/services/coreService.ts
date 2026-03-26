import { api } from './axios';

// ─── Types ────────────────────────────────────────────────────────────────────

// Generic API Response
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string | null;
    error: { code: string; message: string; details?: unknown } | null;
    pagination?: { page: number; pageSize: number; totalCount: number };
}

// Stadium
export interface Stadium {
    stadiumId: string;
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    latitude: number;
    longitude: number;
    imageUrl: string;
    imagePublicId: string;
    capacity?: number;
    ownerId?: string;
    isApproved?: boolean;
    createdAt?: string;
    isActive?: boolean;
}

export interface CreateStadiumPayload {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    latitude: number;
    longitude: number;
    imageUrl?: string;
    imagePublicId?: string;
}

// Seating Plan
export interface SeatingPlan {
    seatingPlanId: string;
    stadiumId: string;
    name: string;
    description?: string;
    createdAt?: string;
}

// Section
export interface Section {
    sectionId: string;
    seatingPlanId: string;
    name: string;
    type: 'Seated' | 'Standing';
    capacity?: number;
    color?: string;
    positionX?: number;
    positionY?: number;
}

// Event
export interface Event {
    eventId: string;
    name: string;
    description?: string;
    stadiumId: string;
    stadiumName?: string;
    organizerId?: string;
    status: 'Draft' | 'Live' | 'Completed' | 'Cancelled';
    startDate?: string;
    endDate?: string;
    eventType?: string;
    imageUrl?: string;
    createdAt?: string;
}

export interface CreateEventPayload {
    name: string;
    description?: string;
    stadiumId: string;
    startDate: string;
    endDate: string;
    eventType?: string;
}

export interface UpdateEventPayload {
    name?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    eventType?: string;
}

// Event Slot
export interface EventSlot {
    slotId: string;
    eventId: string;
    startTime: string;
    endTime: string;
    label?: string;
}

export interface CreateSlotPayload {
    startTime: string;
    endTime: string;
    label?: string;
}

// Ticket Type
export interface TicketType {
    ticketTypeId: string;
    eventId: string;
    name: string;
    price: number;
    description?: string;
}

export interface CreateTicketTypePayload {
    name: string;
    price: number;
    description?: string;
}

// Booking
export interface Booking {
    bookingId: string;
    eventId: string;
    eventName?: string;
    userId: string;
    status: 'PendingPayment' | 'Confirmed' | 'Cancelled' | 'Expired' | 'Failed';
    totalAmount: number;
    seatCount: number;
    createdAt: string;
    seats?: BookingSeat[];
}

export interface BookingSeat {
    seatLabel: string;
    sectionName: string;
    price: number;
    sectionType: 'Seated' | 'Standing';
}

// Event Layout
export interface EventLayout {
    eventSeatingPlanId: string;
    eventId: string;
    isLocked: boolean;
    sections: EventSection[];
    landmarks: EventLandmark[];
}

export interface EventSection {
    eventSectionId: string;
    name: string;
    type: 'Seated' | 'Standing';
    capacity?: number;
    color?: string;
    positionX?: number;
    positionY?: number;
}

export interface EventLandmark {
    eventLandmarkId: string;
    name: string;
    type: string;
    positionX?: number;
    positionY?: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const coreService = {
    // ── Stadiums ──────────────────────────────────────────
    getStadiums: async (): Promise<ApiResponse<Stadium[]>> => {
        const response = await api.get('/api/core/stadiums');
        return response.data;
    },

    getStadium: async (id: string): Promise<ApiResponse<Stadium>> => {
        const response = await api.get(`/api/core/stadiums/${id}`);
        return response.data;
    },

    createStadium: async (payload: CreateStadiumPayload): Promise<ApiResponse<Stadium>> => {
        const response = await api.post('/api/core/stadiums', payload);
        return response.data;
    },

    updateStadium: async (id: string, payload: Partial<CreateStadiumPayload>): Promise<ApiResponse<Stadium>> => {
        const response = await api.put(`/api/core/stadiums/${id}`, payload);
        return response.data;
    },

    deleteStadium: async (id: string): Promise<ApiResponse<void>> => {
        const response = await api.delete(`/api/core/stadiums/${id}`);
        return response.data;
    },

    getStadiumsByOwner: async (ownerId: string): Promise<ApiResponse<Stadium[]>> => {
        const response = await api.get(`/api/core/stadiums/owner/${ownerId}`);
        return response.data;
    },

    getEventsByStadium: async (stadiumId: string): Promise<ApiResponse<Event[]>> => {
        const response = await api.get(`/api/core/stadiums/${stadiumId}/events`);
        return response.data;
    },

    // ── Seating Plans ────────────────────────────────────
    getSeatingPlans: async (stadiumId: string): Promise<ApiResponse<SeatingPlan[]>> => {
        const response = await api.get(`/api/core/stadiums/${stadiumId}/seating-plans`);
        return response.data;
    },

    getSeatingPlan: async (id: string): Promise<ApiResponse<SeatingPlan>> => {
        const response = await api.get(`/api/core/seating-plans/${id}`);
        return response.data;
    },

    // ── Events ───────────────────────────────────────────
    getEvents: async (status?: string): Promise<ApiResponse<Event[]>> => {
        const params = status ? `?status=${status}` : '';
        try {
            const response = await api.get(`/api/core/events${params}`);
            return response.data;
        } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
        console.warn('getEvents failed:', error?.response?.status);
    }

    return {
        data: [],
        success: false,
        message: 'Unable to load events',
    };
}
    },

    getEvent: async (id: string): Promise<ApiResponse<Event>> => {
        const response = await api.get(`/api/core/events/${id}`);
        return response.data;
    },

    createEvent: async (payload: CreateEventPayload): Promise<ApiResponse<Event>> => {
        const response = await api.post('/api/core/events', payload);
        return response.data;
    },

    updateEvent: async (id: string, payload: UpdateEventPayload): Promise<ApiResponse<Event>> => {
        const response = await api.put(`/api/core/events/${id}`, payload);
        return response.data;
    },

    // ── Event Slots ──────────────────────────────────────
    getEventSlots: async (eventId: string): Promise<ApiResponse<EventSlot[]>> => {
        const response = await api.get(`/api/core/events/${eventId}/slots`);
        return response.data;
    },

    createEventSlot: async (eventId: string, payload: CreateSlotPayload): Promise<ApiResponse<EventSlot>> => {
        const response = await api.post(`/api/core/events/${eventId}/slots`, payload);
        return response.data;
    },

    // ── Event Layout ─────────────────────────────────────
    cloneLayout: async (eventId: string, seatingPlanId: string): Promise<ApiResponse<EventLayout>> => {
        const response = await api.post(`/api/core/events/${eventId}/layout/clone`, { seatingPlanId });
        return response.data;
    },

    getEventLayout: async (eventId: string): Promise<ApiResponse<EventLayout>> => {
        const response = await api.get(`/api/core/events/${eventId}/layout`);
        return response.data;
    },

    lockLayout: async (eventId: string): Promise<ApiResponse<unknown>> => {
        const response = await api.post(`/api/core/events/${eventId}/layout/lock`);
        return response.data;
    },

    generateSeats: async (eventId: string): Promise<ApiResponse<unknown>> => {
        const response = await api.post(`/api/core/events/${eventId}/generate-seats`);
        return response.data;
    },

    // ── Ticket Types ─────────────────────────────────────
    getTicketTypes: async (eventId: string): Promise<ApiResponse<TicketType[]>> => {
        const response = await api.get(`/api/core/events/${eventId}/ticket-types`);
        return response.data;
    },

    createTicketType: async (eventId: string, payload: CreateTicketTypePayload): Promise<ApiResponse<TicketType>> => {
        const response = await api.post(`/api/core/events/${eventId}/ticket-types`, payload);
        return response.data;
    },

    // ── Bookings ─────────────────────────────────────────
    getMyBookings: async (): Promise<ApiResponse<Booking[]>> => {
        const response = await api.get('/api/core/bookings/my');
        return response.data;
    },

    getBooking: async (id: string): Promise<ApiResponse<Booking>> => {
        const response = await api.get(`/api/core/bookings/${id}`);
        return response.data;
    },

    createBooking: async (payload: { eventId: string; seatIds: string[] }): Promise<ApiResponse<Booking>> => {
        const response = await api.post('/api/core/bookings', payload);
        return response.data;
    },

    confirmBooking: async (id: string): Promise<ApiResponse<unknown>> => {
        const response = await api.post(`/api/core/bookings/${id}/confirm`);
        return response.data;
    },

    cancelBooking: async (id: string): Promise<ApiResponse<unknown>> => {
        const response = await api.post(`/api/core/bookings/${id}/cancel`);
        return response.data;
    },

    // ── Seat Map ─────────────────────────────────────────
    getEventSeats: async (eventId: string, sectionId?: string): Promise<ApiResponse<unknown[]>> => {
        const params = sectionId ? `?sectionId=${sectionId}` : '';
        const response = await api.get(`/api/core/events/${eventId}/seats${params}`);
        return response.data;
    },

    holdSeat: async (eventId: string, seatId: string): Promise<ApiResponse<unknown>> => {
        const response = await api.post(`/api/core/events/${eventId}/seats/${seatId}/hold`);
        return response.data;
    },

    releaseSeat: async (eventId: string, seatId: string): Promise<ApiResponse<unknown>> => {
        const response = await api.post(`/api/core/events/${eventId}/seats/${seatId}/release`);
        return response.data;
    },

    holdStanding: async (eventId: string, sectionId: string, quantity: number): Promise<ApiResponse<unknown>> => {
        const response = await api.post(`/api/core/events/${eventId}/standing/${sectionId}/hold`, { quantity });
        return response.data;
    },

    // ── Discovery ────────────────────────────────────────
    getNearbyStadiums: async (lat: number, lng: number, radiusKm: number): Promise<ApiResponse<Stadium[]>> => {
        const response = await api.get(`/api/core/stadiums/nearby?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`);
        return response.data;
    },

    getNearbyEvents: async (lat: number, lng: number, radiusKm: number): Promise<ApiResponse<Event[]>> => {
        const response = await api.get(`/api/core/events/nearby?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`);
        return response.data;
    },

    searchEvents: async (query: string, city?: string): Promise<ApiResponse<Event[]>> => {
        const params = new URLSearchParams({ query });
        if (city) params.append('city', city);
        const response = await api.get(`/api/core/events/search?${params.toString()}`);
        return response.data;
    },
};
