import { useState } from "react";

type Props = { images: string[]; title: string };

export function ProductGallery({ images, title }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex] ?? images[0];

  return (
    <div>
      <div className="flex aspect-[5/3] items-center justify-center overflow-hidden bg-gray-200">
        <img
          src={active}
          alt={
            images.length > 1
              ? `${title}, image ${activeIndex + 1} of ${images.length}`
              : title
          }
          width={600}
          height={600}
          fetchPriority="high"
          className="h-full w-full object-contain p-6 mix-blend-multiply sm:p-10"
        />
      </div>

      {images.length > 1 && (
        <ul className="mt-4 flex gap-3 overflow-x-auto pb-1" aria-label="Product images">
          {images.map((src, index) => {
            const isActive = index === activeIndex;
            return (
              <li key={src} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Show image ${index + 1} of ${images.length}`}
                  aria-current={isActive ? "true" : undefined}
                  className={`block size-20 overflow-hidden bg-gray-200 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:size-24 ${
                    isActive
                      ? "ring-2 ring-brand"
                      : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={src}
                    alt=""
                    width={96}
                    height={96}
                    loading="lazy"
                    className="h-full w-full object-contain p-2 mix-blend-multiply"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}