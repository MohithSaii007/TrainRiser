import { BerthType } from "@/types/booking";
import { cn } from "@/lib/utils";

interface SeatButtonProps {
  number: number;
  type: BerthType;
  isBooked: boolean;
  isLocked?: boolean;
  isRAC?: boolean;
  isWL?: boolean;
  isSelected: boolean;
  onClick: () => void;
}

const typeClasses: Record<BerthType, string> = {
  lb: "seat-lb",
  mb: "seat-mb",
  ub: "seat-ub",
  sl: "seat-sl",
  su: "seat-su",
  cc: "seat-cc",
};

const SeatButton = ({ number, type, isBooked, isLocked, isRAC, isWL, isSelected, onClick }: SeatButtonProps) => {
  const baseClass = `
    h-14 min-w-[70px] border-2 border-black rounded-xl font-extrabold text-lg
    flex items-center justify-center cursor-pointer transition-all duration-200
    hover:scale-110 hover:shadow-lg relative overflow-hidden
  `;

  return (
    <button
      onClick={onClick}
      disabled={isBooked || (isLocked && !isSelected)}
      className={cn(
        baseClass,
        // Only apply berth type color if not booked, locked, or selected
        !isBooked && !isLocked && !isSelected && typeClasses[type],
        // Booked state uses the red color from index.css
        isBooked && "seat-booked",
        // Locked state (by others)
        isLocked && !isSelected && "bg-amber-500 opacity-80 cursor-not-allowed",
        // RAC/WL indicators
        isRAC && !isBooked && "bg-yellow-400 text-black",
        isWL && !isBooked && "bg-gray-400 text-white opacity-50",
        // Selected state
        isSelected && "seat-selected ring-4 ring-black scale-110 z-10",
        !isBooked && !isLocked && !isSelected && "text-gray-900"
      )}
    >
      {number}
      {isRAC && !isBooked && <span className="absolute top-0 right-1 text-[8px] font-black">RAC</span>}
      {isWL && !isBooked && <span className="absolute top-0 right-1 text-[8px] font-black">WL</span>}
    </button>
  );
};

export default SeatButton;