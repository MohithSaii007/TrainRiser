import { BerthType } from "@/types/booking";

interface SeatButtonProps {
  number: number;
  type: BerthType;
  isBooked: boolean;
  isSelected: boolean;
  onClick: () => void;
}

const typeClasses: Record<BerthType, string> = {
  lb: "seat-lb",
  mb: "seat-mb",
  ub: "seat-ub",
  sl: "seat-sl",
  su: "seat-su",
};

const SeatButton = ({ number, type, isBooked, isSelected, onClick }: SeatButtonProps) => {
  const baseClass = `
    h-14 min-w-[70px] border-2 border-black rounded-xl font-extrabold text-lg
    flex items-center justify-center cursor-pointer transition-all duration-200
    hover:scale-110 hover:shadow-lg
  `;

  return (
    <button
      onClick={onClick}
      disabled={isBooked}
      className={`
        ${baseClass}
        ${typeClasses[type]}
        ${isBooked ? "seat-booked" : ""}
        ${isSelected ? "seat-selected" : ""}
        ${isBooked ? "text-white" : "text-gray-900"}
      `}
    >
      {number}
    </button>
  );
};

export default SeatButton;
