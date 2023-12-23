import { getPath, hexToRGBA } from "@/utilities";
import { useContext, useEffect, useRef, useState } from "react";
import { AppContext } from "../../context/AppContext";

const Annotation = ({ data, color }) => {
  const { code, sentence, start_position, segment } = data;
  const { codes, currentProject, filteredCodes } = useContext(AppContext);
  const [mousePosition, setMousePosition] = useState(null);
  const mousePositionRef = useRef(null);

  useEffect(() => {
    mousePositionRef.current = null;
  }, [data, color]);

  const handleMouseMove = (event) => {
    const chartElement = document.getElementById("chart-container");
    const bounding_rect = chartElement.getBoundingClientRect();
    const pos = { x: event.clientX - bounding_rect.x, y: event.clientY - bounding_rect.y };
    setMousePosition(pos);
    if (!mousePositionRef.current) {
      mousePositionRef.current = pos;
    }
  };

  useEffect(() => {
    const chartElement = document.getElementById("try");
    chartElement.addEventListener("mousemove", handleMouseMove);

    return () => {
      chartElement.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  if (!mousePosition) {
    return null; // Don't render until mouse position is available
  }

  const isWithinRange = () => {
    //check if mouse is within bounding box of
    if (mousePosition && mousePositionRef.current) {
      const chartElement = document.getElementById("chart-container");
      const bounding_rect = chartElement.getBoundingClientRect();
      const pos = { x: mousePosition.x, y: mousePosition.y };
      const posRef = { x: mousePositionRef.current.x, y: mousePositionRef.current.y };
        const distance = Math.sqrt(Math.pow(pos.x - posRef.x, 2) + Math.pow(pos.y - posRef.y, 2));
        return distance < 20 && (!(pos.x < 0 || pos.y < 0 || pos.x > bounding_rect.width || pos.y > bounding_rect.height));

      //return ;
    }

    return false;
  };

  if (!mousePosition || !isWithinRange()) {
    return null;
  }
  return (
    <div
      className="annotation"
      style={{
        left: mousePosition.x,
        top: mousePosition.y,
        backgroundColor: hexToRGBA(codes.find((c) => c.code_id === code).color, 0.7),
        maxWidth: "25%",
        wordWrap: "break-word",
        position: "absolute",
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          padding: "10px",
          borderRadius: "5px",
          color: "white",
        }}
      >
        <h3>
          {getPath(
            codes,
            codes.find((c) => c.code_id === code),
          )}
        </h3>
        <p>
          {sentence.substring(0, start_position)}
          <strong>
            <em>
              <u>{segment}</u>
            </em>
          </strong>
          {sentence.substring(start_position + segment.length)}
        </p>
      </div>
    </div>
  );
};

export default Annotation;
