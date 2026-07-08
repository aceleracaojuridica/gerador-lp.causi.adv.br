"use client";

import { ArrowForward } from "@material-symbols-svg/react/rounded";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { templatePreviewSrc } from "@/lib/landing-pages/templates";

type TemplateMaterialCardProps = {
  id: string;
  name: string;
  description: string;
};

/** Card de template no layout Bonafide Materiais (mockup + loader + card escuro). */
export function TemplateMaterialCard({
  id,
  name,
  description,
}: TemplateMaterialCardProps) {
  const hasPreview = id !== "autoridade";
  const previewSrc = templatePreviewSrc(id);
  const [mockupLoaded, setMockupLoaded] = useState(false);
  const [previewLoaded, setPreviewLoaded] = useState(!hasPreview);

  const isLoaded = mockupLoaded && previewLoaded;

  return (
    <div className="material-item">
      <Link href={`/templates/${id}`} prefetch>
        <div className="item-img">
          <div className="item-img__stack">
            <Image
              src="/templates/mockup.png"
              alt="Notebook mockup"
              width={510}
              height={340}
              className="item-img__mockup"
              onLoad={() => setMockupLoaded(true)}
            />
            {hasPreview ? (
              <div className="item-img__screen">
                <Image
                  src={previewSrc}
                  alt={`Prévia do template ${name}`}
                  fill
                  sizes="(max-width: 768px) 90vw, (max-width: 1280px) 45vw, 30vw"
                  className={`item-img__preview${previewLoaded ? " is-loaded" : ""}`}
                  onLoad={() => setPreviewLoaded(true)}
                />
              </div>
            ) : null}
          </div>
          {!isLoaded ? <div className="loader" aria-hidden="true" /> : null}
        </div>

        <div className="item-content card-style">
          <h2 className="item-title">{name}</h2>
          <p className="item-description">{description}</p>
          <div className="item-btn">
            <span className="item-button">
              Ver template
              <ArrowForward className="size-4 fill-current" />
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
