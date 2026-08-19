import Resizer from "react-image-file-resizer";

export function resizeImageFile(file: File): Promise<any> {
  return new Promise((resolve) => {
    Resizer.imageFileResizer(
      file,
      600, // Desired width
      600, // Desired height
      "png", // Output format
      100, // Image quality (0 to 100)
      0, // Rotation angle (in degrees)
      (uri) => {
        resolve(uri);
      },
      "file", // Encoding type: base64 | blob | file.
    );
  });
}
