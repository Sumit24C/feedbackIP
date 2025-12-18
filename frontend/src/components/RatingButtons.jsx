function RatingButtons({ value, onChange }) {
    return (
        <div className="flex gap-2 flex-wrap justify-center">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                    key={num}
                    onClick={() => onChange(num)}
                    className={`w-9 h-9 rounded-full text-sm font-semibold transition
                        ${value === num
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 hover:bg-blue-100 text-gray-700"
                        }`}
                >
                    {num}
                </button>
            ))}
        </div>
    );
}

export default RatingButtons;
