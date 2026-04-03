"use client";

import { use } from "react";
import StadiumLayoutView from "@/components/stadium/StadiumLayoutView";

export default function StadiumDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return (
        <div className="p-6">
            <StadiumLayoutView stadiumId={id} />
        </div>
    );
}
