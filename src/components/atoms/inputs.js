export function InputField({
  label,
  name = "inputField",
  type = "text",
  error = "",
  onChange = () => "",
  value = "",
}) {
  //render
  return (
    <div>
      {label && (
        <label htmlFor={name} className="block my-2 text-sm font-medium">
          {label}{" "}
          {error && (
            <span className="text-sm text-red-500 italic">{" " + error}</span>
          )}
        </label>
      )}
      <input
        type={type}
        id={`${name}_field`}
        value={value}
        className={`bg-gray-50 border ${
          error ? "border-red-500" : "border-gray-200"
        } text-sm rounded-lg ring-0 focus:ring-0 focus:border-blue-500 block w-full p-2.5 outline-none`}
        placeholder={`Enter ${name}`}
        onChange={onChange}
      />
    </div>
  );
}
