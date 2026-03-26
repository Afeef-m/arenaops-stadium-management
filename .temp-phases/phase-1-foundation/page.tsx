"use client";

import { useParams } from "next/navigation";
import { StadiumLayoutBuilder } from "@/features/stadium-owner/stadium-layout-builder/StadiumLayoutBuilder";

/**
 * Stadium Layout Builder Page
 *
 * Route: /manager/stadiums/[id]/layout/builder
 *
 * Allows stadium owners to create and edit seating layout templates
 * for their stadiums. These templates can be cloned and customized by
 * event managers when creating events.
 */
export default function StadiumLayoutBuilderPage() {
  const params = useParams();
  const stadiumId = params.id as string;

  if (!stadiumId) {
    return (
      <div className="error-container">
        <h1>Stadium Not Found</h1>
        <p>Invalid stadium ID</p>
      </div>
    );
  }

  return (
    <StadiumLayoutBuilder
      mode="template"
      stadiumId={stadiumId}
    />
  );
}
