export async function forEach<T = any>(
  collection: T[],
  cb: (elem: T, index: number, arr: T[]) => Promise<boolean | void>,
  reverse = false,
) {
  const lastIdx = collection.length - 1;

  for (let i = 0; i < collection.length; i++) {
    /* Extract the element from the specified collection.  If we are working backwards, we will need to extract the element as an offset
     * from the original end index (in the event that the user decides to remove elements from the array, which is a common reason for
     * backwards-iterating loops). */
    const idx = reverse ? lastIdx - i : i;
    const elem = collection[idx];

    /* Invoke the supplied callback.  A return value of false indicates a loop break. */
    if ((await cb(elem, idx, collection)) === false) {
      break;
    }
  }
}
