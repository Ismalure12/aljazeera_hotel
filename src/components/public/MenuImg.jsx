'use client';
import { useEffect, useRef, useState } from 'react';
import { FALLBACK_IMG } from './menuData';

// Plain <img> with a graceful striped placeholder fallback (intentional
// per project convention — the menu uses inline <img>, not next/image), plus a
// shimmer skeleton + fade-in that covers the image area until it has loaded.
export default function MenuImg({ src, alt = '', className = '', ...rest }) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);

  // Catch images that finished loading before React attached onLoad (cached hits),
  // so the skeleton never gets stuck over an already-painted image.
  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, [src]);

  return (
    <>
      {!loaded && <span className="img-skel" aria-hidden="true" />}
      <img
        ref={imgRef}
        src={src || FALLBACK_IMG}
        alt={alt}
        loading="lazy"
        className={`menu-img${loaded ? ' is-loaded' : ''}${className ? ` ${className}` : ''}`}
        onLoad={() => setLoaded(true)}
        onError={(e) => {
          if (e.currentTarget.src !== FALLBACK_IMG) e.currentTarget.src = FALLBACK_IMG;
          setLoaded(true);
        }}
        {...rest}
      />
    </>
  );
}
