import React from "react";
import { Card, Badge } from "react-bootstrap";

import CameraPanel from "../CameraPanel";

function CameraCard({ camId, title }) {
  return (
    <Card className="mb-3">
      <Card.Body
        style={{
          padding: 0,
          backgroundColor: "#111827",
          borderRadius: 16,
        }}
      >
        <div style={{ padding: 16 }}>
          {/* HEADER */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                color: "#fff",
                fontWeight: 600,
                fontSize: 16,
              }}
            >
              {title}
            </div>

            <Badge bg="danger">LIVE</Badge>
          </div>

          <CameraPanel camId={camId} />
        </div>
      </Card.Body>
    </Card>
  );
}

export default CameraCard;
