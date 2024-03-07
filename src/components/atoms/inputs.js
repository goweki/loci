export function InputField({
  label,
  name = "inputField",
  type = "text",
  required = false,
}) {
  //render
  return (
    <div>
      {label && (
        <label htmlFor={name} className="block my-2 text-sm font-medium">
          {label}
        </label>
      )}
      <input
        type={type}
        id={`${name}_field`}
        className="bg-gray-50 border border-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
        placeholder={`Enter ${name}`}
        required={required}
      />
    </div>
  );
}
