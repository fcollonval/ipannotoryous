// Source: https://github.com/martinRenou/ipycanvas/blob/444b77293114b73db106bcc04418e9d67b51d532/src/utils.ts
// Distributed under the terms of the Modified BSD License.

export async function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      // eslint-disable-next-line eqeqeq
      if (blob == null) {
        return reject('Unable to create blob');
      }

      resolve(blob);
    });
  });
}

export async function toBytes(
  canvas: HTMLCanvasElement
): Promise<Uint8ClampedArray> {
  const blob = await toBlob(canvas);

  return new Promise<Uint8ClampedArray>((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      // eslint-disable-next-line eqeqeq
      if (typeof reader.result === 'string' || reader.result == null) {
        return reject('Unable to read blob');
      }

      const bytes = new Uint8ClampedArray(reader.result);
      resolve(bytes);
    };
    reader.readAsArrayBuffer(blob);
  });
}
