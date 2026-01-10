export default function Loader({ size = 8 }) {
  return (
    <div className="flex items-center justify-center p-4">
      <div
        className={`h-${size} w-${size} animate-spin rounded-full border-4 border-muted border-t-primary`}
      />
    </div>
  );
}
