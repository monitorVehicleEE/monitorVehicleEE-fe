import React from "react";

function StatsCards() {
  const cards = [
    { title: "Xe trong bãi", value: 0, variant: "primary" },
    { title: "Lượt xe vào hôm nay", value: 0, variant: "primary" },
    { title: "Cảnh báo hôm nay", value: 0, variant: "danger" },
    { title: "Người dùng đang hoạt động", value: 0, variant: "warning" },
  ];

  return (
    <div className="stats-grid">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`stats-card ${
            card.variant ? `stats-card--${card.variant}` : ""
          }`}
        >
          <div className="stats-card-title">{card.title}</div>
          <div className="stats-card-value">{card.value}</div>
        </div>
      ))}
    </div>
  );
}

export default StatsCards