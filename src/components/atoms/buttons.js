export function ButtonPrimary({
  label = "Primary Button",
  onClick = () => console.log("Primary button clicked"),
}) {
  //render
  return (
    <button className="btn" onClick={onClick}>
      {label}
    </button>
  );
}

export function ButtonSecondary({
  label = "Secondary Button",
  onClick = () => console.log("Secondary button clicked"),
}) {
  //render
  return (
    <button className="btn-sec" onClick={onClick}>
      {label}
    </button>
  );
}
