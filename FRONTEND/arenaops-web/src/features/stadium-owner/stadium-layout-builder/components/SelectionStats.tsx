"use client";

import React from "react";
import type { LayoutSeat } from "../types";

export interface SelectionStatsProps {
  selectedSeats: LayoutSeat[];
  totalSeats: number;
}

/**
 * Selection Stats Component
 *
 * Display statistics about selected seats in a compact widget
 */
export function SelectionStats({
  selectedSeats,
  totalSeats,
}: SelectionStatsProps) {
  if (selectedSeats.length === 0) {
    return null;
  }

  // Calculate type distribution
  const typeCount = {
    vip: selectedSeats.filter(s => s.type === 'vip').length,
    premium: selectedSeats.filter(s => s.type === 'premium').length,
    standard: selectedSeats.filter(s => s.type === 'standard').length,
    economy: selectedSeats.filter(s => s.type === 'economy').length,
    accessible: selectedSeats.filter(s => s.type === 'accessible').length,
  };

  const disabledCount = selectedSeats.filter(s => s.disabled).length;
  const totalPrice = selectedSeats.reduce((sum, s) => sum + s.price, 0);
  const avgPrice = (totalPrice / selectedSeats.length).toFixed(2);

  return (
    <div className="selection-stats">
      <div className="stats-main">
        <span className="stat-item">
          <strong>{selectedSeats.length}</strong> selected
        </span>
        of <strong>{totalSeats}</strong> total
      </div>

      <div className="stats-breakdown">
        {typeCount.vip > 0 && (
          <span className="stat-badge vip" title="VIP seats">
            {typeCount.vip}
          </span>
        )}
        {typeCount.premium > 0 && (
          <span className="stat-badge premium" title="Premium seats">
            {typeCount.premium}
          </span>
        )}
        {typeCount.standard > 0 && (
          <span className="stat-badge standard" title="Standard seats">
            {typeCount.standard}
          </span>
        )}
        {typeCount.economy > 0 && (
          <span className="stat-badge economy" title="Economy seats">
            {typeCount.economy}
          </span>
        )}
        {typeCount.accessible > 0 && (
          <span className="stat-badge accessible" title="Accessible seats">
            {typeCount.accessible}
          </span>
        )}

        {disabledCount > 0 && (
          <span className="stat-badge disabled" title="Disabled seats">
            {disabledCount} disabled
          </span>
        )}
      </div>

      <div className="stats-pricing">
        <span className="price-label">Avg Price:</span>
        <span className="price-value">${avgPrice}</span>
      </div>

      <style jsx>{`
        .selection-stats {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 1rem;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 0.375rem;
          font-size: 0.875rem;
        }

        .stats-main {
          flex: 1;
          color: #1e40af;
          font-weight: 500;
        }

        .stat-item {
          white-space: nowrap;
        }

        .stats-breakdown {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          align-items: center;
        }

        .stat-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: #fff;
          white-space: nowrap;
        }

        .stat-badge.vip {
          background: #FFD700;
          color: #1f2937;
        }

        .stat-badge.premium {
          background: #3B82F6;
        }

        .stat-badge.standard {
          background: #10B981;
        }

        .stat-badge.economy {
          background: #6B7280;
        }

        .stat-badge.accessible {
          background: #EC4899;
        }

        .stat-badge.disabled {
          background: #EF4444;
        }

        .stats-pricing {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding-left: 1rem;
          border-left: 1px solid #bfdbfe;
          color: #1e40af;
        }

        .price-label {
          font-weight: 500;
        }

        .price-value {
          font-weight: 600;
          font-family: 'Monaco', 'Courier New', monospace;
        }
      `}</style>
    </div>
  );
}
