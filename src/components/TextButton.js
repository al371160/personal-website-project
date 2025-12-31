export default function TextButton({ label, onClick }) {
  return (
    <button className="text-button" onClick={onClick}>
      {label}
    </button>
  );
}
