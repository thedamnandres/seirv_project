export default function InputField({ label, type, placeholder, value, onChange }) {
  return (
    <div>
      <label className="input-label">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
