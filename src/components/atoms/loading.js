export default function Loading({ dim: classname }) {
  //render
  return (
    <div className="flex flex-col min-h-screen justify-center items-center">
      <div
        className={`rounded-full bg-sky-500 animate-ping ${classname}`}
      ></div>
    </div>
  );
}
